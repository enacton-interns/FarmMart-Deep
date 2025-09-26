# 4. Data Models

These data models provide a TypeScript representation of the database schema. They are intended for use in the `packages/shared-types` directory to ensure type safety across the frontend and backend.

#### **Users & Profiles**

```typescript
// packages/shared-types/src/user.ts

export type UserRole = 'admin' | 'farmer' | 'customer';

export interface User {
  id: string; // UUID
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: User['id'];
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  // Farmer-specific
  farmName?: string;
  isVerified: boolean;
}

export interface UserAddress {
  id: string; // UUID
  userId: User['id'];
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
}
```

#### **Products & Categories**

```typescript
// packages/shared-types/src/product.ts

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
}

export interface Product {
  id: string; // UUID
  farmerId: User['id'];
  categoryId?: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string; // UUID
  productId: Product['id'];
  sku?: string;
  priceCents: number;
  currency: string; // e.g., 'USD'
  attributes: Record<string, any>; // e.g., { size: 'Large' }
}

export interface Inventory {
  variantId: ProductVariant['id'];
  quantityAvailable: number;
  updatedAt: Date;
}
```

#### **Orders & Payments**

```typescript
// packages/shared-types/src/order.ts

export type OrderStatus = 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed';

export interface Order {
  id: string; // UUID
  customerId: User['id'];
  shippingAddressId?: string;
  totalPriceCents: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string; // UUID
  orderId: Order['id'];
  variantId: ProductVariant['id'];
  quantity: number;
  priceAtPurchaseCents: number;
}

export interface Payment {
  id: string; // UUID
  orderId: Order['id'];
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  paymentProvider?: string;
  providerPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

***