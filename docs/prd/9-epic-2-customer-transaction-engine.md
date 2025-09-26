# 9. Epic 2: Customer Transaction Engine

**Goal:** This epic builds upon the foundation of Epic 1. Its primary goal is to complete the core marketplace loop by enabling customers to register, place orders for the products listed by farmers, and complete payment securely. It also provides farmers with the necessary tools to manage these incoming orders and handle basic communication, thus enabling the first end-to-end transactions on the platform.

---

#### **Story 2.1: Customer Registration & Login**

*As a customer, I want to register for an account and log in, so that I can save my information and track my orders.*

**Acceptance Criteria:**
1.  The public registration page is updated to support creating a 'customer' role, or a separate customer registration form is created.
2.  A login page exists that allows any user (farmer or customer) to sign in.
3.  Logged-in customers have a basic profile page where they can manage their details.

---

#### **Story 2.2: Shopping Cart Functionality**

*As a customer, I want to add products to a shopping cart, so that I can purchase multiple items in a single transaction.*

**Acceptance Criteria:**
1.  An "Add to Cart" button is present on all product detail pages.
2.  A persistent cart component is visible across the site, showing the number of items.
3.  A dedicated cart page allows users to view all items, adjust quantities, or remove items.
4.  The cart page displays a subtotal and a final total price.

---

#### **Story 2.3: Order & Payment Data Model**

*As a developer, I want a database schema and API endpoints for managing orders, so that customer transactions can be recorded and processed.*

**Acceptance Criteria:**
1.  Database migrations for `orders` and `order_items` tables are created.
2.  The `orders` table links to the customer and stores the total price and a status (e.g., 'pending', 'confirmed', 'fulfilled').
3.  The `order_items` table links to the `orders` table and stores the specific products and quantities for each order.
4.  API endpoints are created to support the creation and retrieval of orders.

---

#### **Story 2.4: Secure Checkout Process**

*As a customer, I want a secure checkout process to pay for the items in my cart, so that I can complete my purchase with confidence.*

**Acceptance Criteria:**
1.  A checkout page is created that is accessible from the shopping cart.
2.  The system is integrated with a secure third-party payment gateway (e.g., Stripe) to handle payment processing.
3.  Upon successful payment authorization, an order is created in the system with a 'pending' status.
4.  The user is redirected to an order confirmation page.

---

#### **Story 2.5: Farmer Order Management**

*As a farmer, I want to see a list of new orders for my products and confirm them, so that I can begin preparing them for the customer.*

**Acceptance Criteria:**
1.  The Farmer Dashboard now includes a list of incoming orders for their products.
2.  Farmers can view the details of each order (customer name, products, quantities).
3.  Farmers have a button to change an order's status from 'pending' to 'confirmed'.

---

#### **Story 2.6: Customer Order History**

*As a customer, I want to view my past orders and their current status, so that I can track my purchases.*

**Acceptance Criteria:**
1.  The Customer Profile page now includes a list of their past and current orders.
2.  The status for each order (e.g., 'pending', 'confirmed') is clearly displayed.

---

#### **Story 2.7: Basic Order Notification**

*As a customer, I want to receive a basic notification when my order is confirmed, so that I have confidence the farmer is preparing it.*

**Acceptance Criteria:**
1.  When a farmer changes an order's status to 'confirmed', an automated email is sent to the customer.
2.  The email contains a summary of the order and confirms that the farmer has received it.
