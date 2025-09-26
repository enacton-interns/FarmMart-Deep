import { Pool } from 'pg';

export interface INotification {
  id: string;
  userId: string;
  type: 'order_update' | 'product_available' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

class NotificationModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(notificationData: Omit<INotification, 'id' | 'createdAt'>): Promise<INotification> {
    const { userId, type, title, message, read } = notificationData;
    
    const query = `
      INSERT INTO notifications (user_id, type, title, message, read, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, user_id, type, title, message, read, created_at
    `;
    
    const values = [userId, type, title, message, read];
    const result = await this.pool.query(query, values);
    
    // Transform the row to match the interface
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
    };
  }

  async findById(id: string): Promise<INotification | null> {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
    };
  }

  async findByUserId(userId: string): Promise<INotification[]> {
    const query = 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
    }));
  }

  async markAsRead(id: string): Promise<INotification | null> {
    const query = `
      UPDATE notifications
      SET read = true, updated_at = NOW()
      WHERE id = $1
      RETURNING id, user_id, type, title, message, read, created_at
    `;
    
    const result = await this.pool.query(query, [id]);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
    };
  }

  async markAllAsRead(userId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET read = true, updated_at = NOW()
      WHERE user_id = $1 AND read = false
    `;
    
    await this.pool.query(query, [userId]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM notifications WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export default NotificationModel;