import { Pool } from 'pg';

export interface IProduct {
  id: string;
  farmerId: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: 'lb' | 'kg' | 'oz' | 'piece' | 'bunch' | 'dozen';
  category: 'fruits' | 'vegetables' | 'dairy' | 'meat' | 'bakery' | 'other';
  images: string[];
  available: boolean;
  organic: boolean;
  harvestDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class ProductModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(productData: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<IProduct> {
    const { farmerId, name, description, price, quantity, unit, category, images, available, organic, harvestDate } = productData;
    
    const query = `
      INSERT INTO products (farmer_id, name, description, price, quantity, unit, category, images, available, organic, harvest_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id, farmer_id, name, description, price, quantity, unit, category, images, available, organic, harvest_date, created_at, updated_at
    `;
    
    const values = [
      farmerId,
      name,
      description,
      price,
      quantity,
      unit,
      category,
      images,
      available,
      organic,
      harvestDate
    ];
    
    const result = await this.pool.query(query, values);
    
    // Transform the row to match the interface
    const row = result.rows[0];
    return {
      id: String(row.id),
      farmerId: row.farmer_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      quantity: parseInt(row.quantity),
      unit: row.unit,
      category: row.category,
      images: row.images,
      available: row.available,
      organic: row.organic,
      harvestDate: row.harvest_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<IProduct | null> {
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      id: String(row.id),
      farmerId: row.farmer_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      quantity: parseInt(row.quantity),
      unit: row.unit,
      category: row.category,
      images: row.images,
      available: row.available,
      organic: row.organic,
      harvestDate: row.harvest_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    organic?: boolean;
    available?: boolean;
    farmerId?: string;
    excludeFarmerId?: string;
  } = {}): Promise<IProduct[]> {
    let query = 'SELECT * FROM products WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      values.push(filters.category);
      paramIndex++;
    }

    if (filters.minPrice !== undefined) {
      query += ` AND price >= $${paramIndex}`;
      values.push(filters.minPrice);
      paramIndex++;
    }

    if (filters.maxPrice !== undefined) {
      query += ` AND price <= $${paramIndex}`;
      values.push(filters.maxPrice);
      paramIndex++;
    }

    if (filters.organic !== undefined) {
      query += ` AND organic = $${paramIndex}`;
      values.push(filters.organic);
      paramIndex++;
    }

    if (filters.available !== undefined) {
      query += ` AND available = $${paramIndex}`;
      values.push(filters.available);
      paramIndex++;
    }

    if (filters.farmerId) {
      query += ` AND farmer_id = $${paramIndex}`;
      values.push(filters.farmerId);
      paramIndex++;
    }

    if (filters.excludeFarmerId) {
      query += ` AND farmer_id != $${paramIndex}`;
      values.push(filters.excludeFarmerId);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, values);
    
    return result.rows.map(row => ({
      id: String(row.id),
      farmerId: row.farmer_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      quantity: parseInt(row.quantity),
      unit: row.unit,
      category: row.category,
      images: row.images,
      available: row.available,
      organic: row.organic,
      harvestDate: row.harvest_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findByFarmerId(farmerId: string): Promise<IProduct[]> {
    const query = 'SELECT * FROM products WHERE farmer_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [farmerId]);
    
    return result.rows.map(row => ({
      id: String(row.id),
      farmerId: row.farmer_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      quantity: parseInt(row.quantity),
      unit: row.unit,
      category: row.category,
      images: row.images,
      available: row.available,
      organic: row.organic,
      harvestDate: row.harvest_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async update(id: string, productData: Partial<IProduct>): Promise<IProduct | null> {
    const { name, description, price, quantity, unit, category, images, available, organic, harvestDate } = productData;
    
    let query = 'UPDATE products SET updated_at = NOW()';
    const values: any[] = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      query += `, name = $${paramIndex}`;
      values.push(name);
      paramIndex++;
    }
    
    if (description !== undefined) {
      query += `, description = $${paramIndex}`;
      values.push(description);
      paramIndex++;
    }
    
    if (price !== undefined) {
      query += `, price = $${paramIndex}`;
      values.push(price);
      paramIndex++;
    }
    
    if (quantity !== undefined) {
      query += `, quantity = $${paramIndex}`;
      values.push(quantity);
      paramIndex++;
    }
    
    if (unit !== undefined) {
      query += `, unit = $${paramIndex}`;
      values.push(unit);
      paramIndex++;
    }
    
    if (category !== undefined) {
      query += `, category = $${paramIndex}`;
      values.push(category);
      paramIndex++;
    }
    
    if (images !== undefined) {
      query += `, images = $${paramIndex}`;
      values.push(images);
      paramIndex++;
    }
    
    if (available !== undefined) {
      query += `, available = $${paramIndex}`;
      values.push(available);
      paramIndex++;
    }
    
    if (organic !== undefined) {
      query += `, organic = $${paramIndex}`;
      values.push(organic);
      paramIndex++;
    }
    
    if (harvestDate !== undefined) {
      query += `, harvest_date = $${paramIndex}`;
      values.push(harvestDate);
      paramIndex++;
    }
    
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);
    
    const result = await this.pool.query(query, values);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      id: String(row.id),
      farmerId: row.farmer_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      quantity: parseInt(row.quantity),
      unit: row.unit,
      category: row.category,
      images: row.images,
      available: row.available,
      organic: row.organic,
      harvestDate: row.harvest_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async decreaseQuantity(id: string, quantity: number): Promise<boolean> {
    const query = 'UPDATE products SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2 AND quantity >= $1';
    const result = await this.pool.query(query, [quantity, id]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    return result.rowCount !== null && result.rowCount > 0;
  }
}

export default ProductModel;
