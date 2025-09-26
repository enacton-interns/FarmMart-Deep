export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'farmer' | 'admin';
  address?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Farmer {
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

export interface Product {
  id: string;
  farmerId: string;
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

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  farmerId: string;
  items: OrderItem[];
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

export interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order_update' | 'product_available' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  farmer: Farmer | null;
  loading: boolean;
  error: string | null;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export interface FilterState {
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  location: string | null;
  organicOnly: boolean;
}