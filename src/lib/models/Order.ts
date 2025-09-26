import { Pool } from 'pg';

export interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  id: string;
  userId: string;
  farmerId: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryDate?: Date;
  deliveryInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

class OrderModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(orderData: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<IOrder> {
    const { userId, farmerId, items, totalAmount, status, paymentStatus, deliveryAddress, deliveryDate, deliveryInstructions } = orderData;
    const { address, city, state, zipCode } = deliveryAddress;

    // Start a transaction
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Insert the order
      const orderQuery = `
        INSERT INTO orders (user_id, farmer_id, total_amount, status, payment_status, delivery_address, delivery_city, delivery_state, delivery_zip_code, delivery_date, delivery_instructions, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id, user_id, farmer_id, total_amount, status, payment_status, delivery_address, delivery_city, delivery_state, delivery_zip_code, delivery_date, delivery_instructions, created_at, updated_at
      `;

      const orderValues = [
        userId,
        farmerId,
        totalAmount,
        status,
        paymentStatus,
        JSON.stringify(deliveryAddress), // Store as JSONB
        city,
        state,
        zipCode,
        deliveryDate,
        deliveryInstructions
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const orderId = orderResult.rows[0].id;

      // Insert order items
      for (const item of items) {
        const itemQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `;

        const itemValues = [orderId, item.productId, item.quantity, item.price];
        await client.query(itemQuery, itemValues);
      }

      await client.query('COMMIT');

      // Transform the row to match the interface
      const row = orderResult.rows[0];
      return {
        id: String(row.id), // Convert to string
        userId: String(row.user_id), // Convert to string
        farmerId: String(row.farmer_id), // Convert to string
        items,
        totalAmount: parseFloat(row.total_amount),
        status: row.status,
        paymentStatus: row.payment_status,
        deliveryAddress: typeof row.delivery_address === 'string'
          ? JSON.parse(row.delivery_address)
          : row.delivery_address, // Handle both JSONB and already parsed data
        deliveryDate: row.delivery_date,
        deliveryInstructions: row.delivery_instructions,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<IOrder | null> {
    // Get order details
    const orderQuery = 'SELECT * FROM orders WHERE id = $1';
    const orderResult = await this.pool.query(orderQuery, [id]);
    
    if (!orderResult.rows[0]) return null;
    
    // Get order items
    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
    const itemsResult = await this.pool.query(itemsQuery, [id]);
    
    const items = itemsResult.rows.map(item => ({
      productId: item.product_id,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
    }));
    
    // Transform the row to match the interface
    const row = orderResult.rows[0];
    return {
      id: String(row.id), // Convert to string
      userId: String(row.user_id), // Convert to string
      farmerId: String(row.farmer_id), // Convert to string
      items,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      paymentStatus: row.payment_status,
      deliveryAddress: typeof row.delivery_address === 'string'
        ? JSON.parse(row.delivery_address)
        : row.delivery_address, // Handle both JSONB and already parsed data
      deliveryDate: row.delivery_date,
      deliveryInstructions: row.delivery_instructions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByUserId(userId: string): Promise<IOrder[]> {
    const orderQuery = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
    const orderResult = await this.pool.query(orderQuery, [userId]);

    const orders = [];

    for (const row of orderResult.rows) {
      // Get order items for each order
      const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
      const itemsResult = await this.pool.query(itemsQuery, [row.id]);

      const items = itemsResult.rows.map(item => ({
        productId: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
      }));

      orders.push({
        id: String(row.id), // Convert to string
        userId: String(row.user_id), // Convert to string
        farmerId: String(row.farmer_id), // Convert to string
        items,
        totalAmount: parseFloat(row.total_amount),
        status: row.status,
        paymentStatus: row.payment_status,
        deliveryAddress: typeof row.delivery_address === 'string'
          ? JSON.parse(row.delivery_address)
          : row.delivery_address, // Handle both JSONB and already parsed data
        deliveryDate: row.delivery_date,
        deliveryInstructions: row.delivery_instructions,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return orders;
  }

  async findByFarmerId(farmerId: string): Promise<IOrder[]> {
    const orderQuery = 'SELECT * FROM orders WHERE farmer_id = $1 ORDER BY created_at DESC';
    const orderResult = await this.pool.query(orderQuery, [farmerId]);

    const orders = [];

    for (const row of orderResult.rows) {
      // Get order items for each order
      const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
      const itemsResult = await this.pool.query(itemsQuery, [row.id]);

      const items = itemsResult.rows.map(item => ({
        productId: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
      }));

      orders.push({
        id: String(row.id), // Convert to string
        userId: String(row.user_id), // Convert to string
        farmerId: String(row.farmer_id), // Convert to string
        items,
        totalAmount: parseFloat(row.total_amount),
        status: row.status,
        paymentStatus: row.payment_status,
        deliveryAddress: typeof row.delivery_address === 'string'
          ? JSON.parse(row.delivery_address)
          : row.delivery_address, // Handle both JSONB and already parsed data
        deliveryDate: row.delivery_date,
        deliveryInstructions: row.delivery_instructions,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return orders;
  }

  async findAll(): Promise<IOrder[]> {
    const orderQuery = 'SELECT * FROM orders ORDER BY created_at DESC';
    const orderResult = await this.pool.query(orderQuery);

    const orders = [];

    for (const row of orderResult.rows) {
      // Get order items for each order
      const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
      const itemsResult = await this.pool.query(itemsQuery, [row.id]);

      const items = itemsResult.rows.map(item => ({
        productId: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
      }));

      orders.push({
        id: String(row.id), // Convert to string
        userId: String(row.user_id), // Convert to string
        farmerId: String(row.farmer_id), // Convert to string
        items,
        totalAmount: parseFloat(row.total_amount),
        status: row.status,
        paymentStatus: row.payment_status,
        deliveryAddress: typeof row.delivery_address === 'string'
          ? JSON.parse(row.delivery_address)
          : row.delivery_address, // Handle both JSONB and already parsed data
        deliveryDate: row.delivery_date,
        deliveryInstructions: row.delivery_instructions,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return orders;
  }

  async update(id: string, orderData: Partial<IOrder>): Promise<IOrder | null> {
    const { status, paymentStatus, deliveryAddress, deliveryDate, deliveryInstructions } = orderData;

    let query = 'UPDATE orders SET updated_at = NOW()';
    const values: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      query += `, status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (paymentStatus !== undefined) {
      query += `, payment_status = $${paramIndex}`;
      values.push(paymentStatus);
      paramIndex++;
    }

    if (deliveryAddress !== undefined) {
      query += `, delivery_address = $${paramIndex}`;
      values.push(JSON.stringify(deliveryAddress)); // Store as JSON
      paramIndex++;
    }

    if (deliveryDate !== undefined) {
      query += `, delivery_date = $${paramIndex}`;
      values.push(deliveryDate);
      paramIndex++;
    }

    if (deliveryInstructions !== undefined) {
      query += `, delivery_instructions = $${paramIndex}`;
      values.push(deliveryInstructions);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    const result = await this.pool.query(query, values);

    if (!result.rows[0]) return null;

    // Get order items
    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
    const itemsResult = await this.pool.query(itemsQuery, [id]);

    const items = itemsResult.rows.map(item => ({
      productId: item.product_id,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
    }));

    // Transform the row to match the interface
    const row = result.rows[0];
    return {
      id: String(row.id), // Convert to string
      userId: String(row.user_id), // Convert to string
      farmerId: String(row.farmer_id), // Convert to string
      items,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      paymentStatus: row.payment_status,
      deliveryAddress: typeof row.delivery_address === 'string'
        ? JSON.parse(row.delivery_address)
        : row.delivery_address, // Handle both JSON and already parsed data
      deliveryDate: row.delivery_date,
      deliveryInstructions: row.delivery_instructions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default OrderModel;
