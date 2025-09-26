import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'customer' | 'farmer' | 'admin';
  address?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

class UserModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const { email, password, name, role, address, phone } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const query = `
      INSERT INTO users (email, password, name, role, address, phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, email, name, role, address, phone, created_at, updated_at
    `;
    
    const values = [email, hashedPassword, name, role, address, phone];
    const result = await this.pool.query(query, values);
    
    return result.rows[0];
  }

  async findById(id: string): Promise<IUser | null> {
    const query = 'SELECT id, email, name, role, address, phone, created_at, updated_at FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const query = 'SELECT id, email, password, name, role, address, phone, created_at, updated_at FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    
    return result.rows[0] || null;
  }

  async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    const { name, role, address, phone } = userData;

    // Build dynamic query based on provided fields
    let query = 'UPDATE users SET updated_at = NOW()';
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      query += `, name = $${paramIndex}`;
      values.push(name);
      paramIndex++;
    }

    if (role !== undefined) {
      query += `, role = $${paramIndex}`;
      values.push(role);
      paramIndex++;
    }

    if (address !== undefined) {
      query += `, address = $${paramIndex}`;
      values.push(address);
      paramIndex++;
    }

    if (phone !== undefined) {
      query += `, phone = $${paramIndex}`;
      values.push(phone);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, email, name, role, address, phone, created_at, updated_at`;
    values.push(id);

    const result = await this.pool.query(query, values);

    return result.rows[0] || null;
  }

  async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
}

export default UserModel;
