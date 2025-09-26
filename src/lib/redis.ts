import net from 'net';
import { logger } from './logger';

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: 'PX', ttl?: number): Promise<'OK'>;
  incr(key: string): Promise<number>;
  pexpire(key: string, ttl: number): Promise<number>;
  pttl(key: string): Promise<number>;
  del(...keys: string[]): Promise<number>;
};

type PendingCommand = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
};

class RedisSocketClient implements RedisLike {
  private socket: net.Socket | null = null;
  private buffer = '';
  private pending: PendingCommand[] = [];
  private readyPromise: Promise<void>;
  private reconnecting = false;

  constructor(connectionString: string) {
    const url = new URL(connectionString);
    this.readyPromise = this.connect(url);
  }

  private connect(url: URL): Promise<void> {
    const port = url.port ? parseInt(url.port, 10) : 6379;
    const host = url.hostname;
    const password = url.password ? decodeURIComponent(url.password) : null;
    const db = url.pathname && url.pathname !== '/' ? url.pathname.slice(1) : null;

    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port }, async () => {
        this.socket = socket;
        this.socket.setEncoding('utf8');

        try {
          if (password) {
            await this.commandRaw(['AUTH', password]);
          }
          if (db) {
            await this.commandRaw(['SELECT', db]);
          }
          resolve();
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Failed to authenticate Redis connection'));
        }
      });

      socket.on('data', (chunk) => {
        this.buffer += chunk.toString();
        this.processBuffer();
      });

      socket.on('error', (error) => {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        if (!this.socket) {
          reject(normalizedError);
          socket.destroy();
          return;
        }
        this.flushPending(normalizedError);
      });

      socket.on('close', () => {
        this.socket = null;
        if (!this.reconnecting) {
          this.reconnecting = true;
          setTimeout(() => {
            this.readyPromise = this.connect(url).finally(() => {
              this.reconnecting = false;
            });
          }, 500);
        }
      });
    });
  }

  private flushPending(error: Error) {
    while (this.pending.length > 0) {
      const command = this.pending.shift();
      command?.reject(error);
    }
  }

  private encodeCommand(args: string[]): string {
    let command = `*${args.length}\r\n`;
    for (const arg of args) {
      const value = arg ?? '';
      const byteLength = Buffer.byteLength(value);
      command += `$${byteLength}\r\n${value}\r\n`;
    }
    return command;
  }

  private parseResponse(): any | undefined {
    if (this.buffer.length === 0) {
      return undefined;
    }

    const prefix = this.buffer[0];
    const newlineIndex = this.buffer.indexOf('\r\n');

    if (newlineIndex === -1) {
      return undefined;
    }

    if (prefix === '+') {
      const value = this.buffer.slice(1, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 2);
      return value;
    }

    if (prefix === '-') {
      const message = this.buffer.slice(1, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 2);
      return new Error(message);
    }

    if (prefix === ':') {
      const value = parseInt(this.buffer.slice(1, newlineIndex), 10);
      this.buffer = this.buffer.slice(newlineIndex + 2);
      return value;
    }

    if (prefix === '$') {
      const length = parseInt(this.buffer.slice(1, newlineIndex), 10);
      if (Number.isNaN(length)) {
        return undefined;
      }
      this.buffer = this.buffer.slice(newlineIndex + 2);
      if (length === -1) {
        return null;
      }
      if (this.buffer.length < length + 2) {
        return undefined;
      }
      const value = this.buffer.slice(0, length);
      this.buffer = this.buffer.slice(length + 2);
      return value;
    }

    if (prefix === '*') {
      const count = parseInt(this.buffer.slice(1, newlineIndex), 10);
      if (Number.isNaN(count)) {
        return undefined;
      }
      this.buffer = this.buffer.slice(newlineIndex + 2);
      const items: any[] = [];
      for (let i = 0; i < count; i++) {
        const item = this.parseResponse();
        if (item === undefined) {
          return undefined;
        }
        items.push(item);
      }
      return items;
    }

    return undefined;
  }

  private processBuffer() {
    while (this.pending.length > 0) {
      const response = this.parseResponse();
      if (response === undefined) {
        break;
      }

      const command = this.pending.shift();
      if (!command) {
        continue;
      }

      if (response instanceof Error) {
        command.reject(response);
      } else {
        command.resolve(response);
      }
    }
  }

  private async ensureReady() {
    await this.readyPromise;
  }

  private commandRaw(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Redis socket is not connected'));
        return;
      }

      this.pending.push({ resolve, reject });
      const command = this.encodeCommand(args);
      this.socket.write(command);
    });
  }

  private async command(args: string[]): Promise<any> {
    await this.ensureReady();
    return this.commandRaw(args);
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command(['GET', key]);
    return result === null ? null : String(result);
  }

  async set(key: string, value: string, mode?: 'PX', ttl?: number): Promise<'OK'> {
    const args = ['SET', key, value];
    if (mode === 'PX' && typeof ttl === 'number') {
      args.push('PX', ttl.toString());
    }
    const result = await this.command(args);
    return result as 'OK';
  }

  async incr(key: string): Promise<number> {
    const result = await this.command(['INCR', key]);
    return typeof result === 'number' ? result : parseInt(String(result), 10);
  }

  async pexpire(key: string, ttl: number): Promise<number> {
    const result = await this.command(['PEXPIRE', key, ttl.toString()]);
    return typeof result === 'number' ? result : parseInt(String(result), 10);
  }

  async pttl(key: string): Promise<number> {
    const result = await this.command(['PTTL', key]);
    return typeof result === 'number' ? result : parseInt(String(result), 10);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    const result = await this.command(['DEL', ...keys]);
    return typeof result === 'number' ? result : parseInt(String(result), 10);
  }
}

class InMemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  private isExpired(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) {
      return true;
    }
    if (!entry.expiresAt) {
      return false;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return true;
    }
    return false;
  }

  async get(key: string): Promise<string | null> {
    if (this.isExpired(key)) {
      return null;
    }
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string, mode?: 'PX', ttl?: number): Promise<'OK'> {
    const entry: { value: string; expiresAt?: number } = { value };
    if (mode === 'PX' && typeof ttl === 'number') {
      entry.expiresAt = Date.now() + ttl;
    }
    this.store.set(key, entry);
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const currentValue = await this.get(key);
    const current = currentValue ? parseInt(currentValue, 10) : 0;
    const next = current + 1;
    const expiresAt = this.store.get(key)?.expiresAt;
    this.store.set(key, { value: String(next), expiresAt });
    return next;
  }

  async pexpire(key: string, ttl: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) {
      return 0;
    }
    entry.expiresAt = Date.now() + ttl;
    this.store.set(key, entry);
    return 1;
  }

  async pttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) {
      return -2;
    }
    if (!entry.expiresAt) {
      return -1;
    }
    const remaining = entry.expiresAt - Date.now();
    if (remaining <= 0) {
      this.store.delete(key);
      return -2;
    }
    return remaining;
  }

  async del(...keys: string[]): Promise<number> {
    let removed = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        removed += 1;
      }
    }
    return removed;
  }
}

class RedisManager implements RedisLike {
  private client: RedisLike;

  constructor() {
    const connectionString = process.env.REDIS_URL;
    if (connectionString) {
      try {
        const socketClient = new RedisSocketClient(connectionString);
        socketClient
          .get('__redis_connection_test__')
          .catch(() => undefined);
        this.client = socketClient;
        return;
      } catch (error) {
        logger.warn('Failed to initialize Redis client. Falling back to in-memory store.');
      }
    }
    this.client = new InMemoryRedis();
  }

  private async withClient<T>(operation: (client: RedisLike) => Promise<T>): Promise<T> {
    try {
      return await operation(this.client);
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      logger.warn('Redis operation failed. Falling back to in-memory store.', { error: normalizedError });
      this.client = new InMemoryRedis();
      return operation(this.client);
    }
  }

  get(key: string): Promise<string | null> {
    return this.withClient((client) => client.get(key));
  }

  set(key: string, value: string, mode?: 'PX', ttl?: number): Promise<'OK'> {
    return this.withClient((client) => client.set(key, value, mode, ttl));
  }

  incr(key: string): Promise<number> {
    return this.withClient((client) => client.incr(key));
  }

  pexpire(key: string, ttl: number): Promise<number> {
    return this.withClient((client) => client.pexpire(key, ttl));
  }

  pttl(key: string): Promise<number> {
    return this.withClient((client) => client.pttl(key));
  }

  del(...keys: string[]): Promise<number> {
    return this.withClient((client) => client.del(...keys));
  }
}

const redisManager = new RedisManager();

export type RedisClient = RedisManager;
export default redisManager;