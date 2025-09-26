import { Pool } from 'pg';

export interface IFarmer {
  id: string;
  userId: string;
  farmName: string;
  farmDescription?: string;
  farmLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class FarmerModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(farmerData: Omit<IFarmer, 'id' | 'createdAt' | 'updatedAt'>): Promise<IFarmer> {
    const { userId, farmName, farmDescription, farmLocation, verified } = farmerData;
    const { address, city, state, zipCode, coordinates } = farmLocation;
    
    const query = `
      INSERT INTO farmers (user_id, farm_name, farm_description, farm_address, farm_city, farm_state, farm_zip_code, farm_coordinates_lat, farm_coordinates_lng, verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, user_id, farm_name, farm_description, farm_address, farm_city, farm_state, farm_zip_code, farm_coordinates_lat, farm_coordinates_lng, verified, created_at, updated_at
    `;
    
    const values = [
      userId,
      farmName,
      farmDescription,
      address,
      city,
      state,
      zipCode,
      coordinates?.lat,
      coordinates?.lng,
      verified
    ];
    
    const result = await this.pool.query(query, values);
    
    // Transform the row to match the interface
    const row = result.rows[0];
    return {
      id: String(row.id),
      userId: String(row.user_id),
      farmName: row.farm_name,
      farmDescription: row.farm_description,
      farmLocation: {
        address: row.farm_address,
        city: row.farm_city,
        state: row.farm_state,
        zipCode: row.farm_zip_code,
        coordinates: row.farm_coordinates_lat !== null && row.farm_coordinates_lng !== null
          ? { lat: row.farm_coordinates_lat, lng: row.farm_coordinates_lng }
          : undefined,
      },
      verified: row.verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<IFarmer | null> {
    const query = 'SELECT * FROM farmers WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      id: String(row.id),
      userId: String(row.user_id),
      farmName: row.farm_name,
      farmDescription: row.farm_description,
      farmLocation: {
        address: row.farm_address,
        city: row.farm_city,
        state: row.farm_state,
        zipCode: row.farm_zip_code,
        coordinates: row.farm_coordinates_lat !== null && row.farm_coordinates_lng !== null
          ? { lat: row.farm_coordinates_lat, lng: row.farm_coordinates_lng }
          : undefined,
      },
      verified: row.verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByUserId(userId: string): Promise<IFarmer | null> {
    const query = 'SELECT * FROM farmers WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      id: String(row.id),
      userId: String(row.user_id),
      farmName: row.farm_name,
      farmDescription: row.farm_description,
      farmLocation: {
        address: row.farm_address,
        city: row.farm_city,
        state: row.farm_state,
        zipCode: row.farm_zip_code,
        coordinates: row.farm_coordinates_lat !== null && row.farm_coordinates_lng !== null
          ? { lat: row.farm_coordinates_lat, lng: row.farm_coordinates_lng }
          : undefined,
      },
      verified: row.verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async update(id: string, farmerData: Partial<IFarmer>): Promise<IFarmer | null> {
    const { farmName, farmDescription, farmLocation, verified } = farmerData;
    
    let query = 'UPDATE farmers SET updated_at = NOW()';
    const values: any[] = [];
    let paramIndex = 1;
    
    if (farmName !== undefined) {
      query += `, farm_name = $${paramIndex}`;
      values.push(farmName);
      paramIndex++;
    }
    
    if (farmDescription !== undefined) {
      query += `, farm_description = $${paramIndex}`;
      values.push(farmDescription);
      paramIndex++;
    }
    
    if (farmLocation?.address !== undefined) {
      query += `, farm_address = $${paramIndex}`;
      values.push(farmLocation.address);
      paramIndex++;
    }
    
    if (farmLocation?.city !== undefined) {
      query += `, farm_city = $${paramIndex}`;
      values.push(farmLocation.city);
      paramIndex++;
    }
    
    if (farmLocation?.state !== undefined) {
      query += `, farm_state = $${paramIndex}`;
      values.push(farmLocation.state);
      paramIndex++;
    }
    
    if (farmLocation?.zipCode !== undefined) {
      query += `, farm_zip_code = $${paramIndex}`;
      values.push(farmLocation.zipCode);
      paramIndex++;
    }
    
    if (farmLocation?.coordinates?.lat !== undefined) {
      query += `, farm_coordinates_lat = $${paramIndex}`;
      values.push(farmLocation.coordinates.lat);
      paramIndex++;
    }
    
    if (farmLocation?.coordinates?.lng !== undefined) {
      query += `, farm_coordinates_lng = $${paramIndex}`;
      values.push(farmLocation.coordinates.lng);
      paramIndex++;
    }
    
    if (verified !== undefined) {
      query += `, verified = $${paramIndex}`;
      values.push(verified);
      paramIndex++;
    }
    
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);
    
    const result = await this.pool.query(query, values);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      id: String(row.id),
      userId: String(row.user_id),
      farmName: row.farm_name,
      farmDescription: row.farm_description,
      farmLocation: {
        address: row.farm_address,
        city: row.farm_city,
        state: row.farm_state,
        zipCode: row.farm_zip_code,
        coordinates: row.farm_coordinates_lat !== null && row.farm_coordinates_lng !== null
          ? { lat: row.farm_coordinates_lat, lng: row.farm_coordinates_lng }
          : undefined,
      },
      verified: row.verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default FarmerModel;
