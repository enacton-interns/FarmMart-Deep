<!-- EPIC 2: ALL STORIES -->
<!-- Powered by BMAD™ -->

# **Epic 2: Customer Transaction Engine - All Stories**

This document contains the Approveded stories for the entirety of Epic 2.

---
---

# **Story 2.1: Customer Registration & Login**

- **Status**: `Approved`

### **User Story**

**As a** customer,
**I want** to register for an account and log in,
**so that** I can save my information and track my orders.

### **Acceptance Criteria**

1.  The public registration page is updated to support creating a 'customer' role.
2.  A login page exists at `/auth/signin` that allows any user (farmer or customer) to sign in.
3.  Logged-in customers have a basic profile page (`/profile`) where they can manage their details.

### **Dev Notes (Technical Implementation Details)**

- **Registration (AC: 1):**
    - The existing registration form at `src/app/auth/signup/page.tsx` (from Story 1.3) should be modified or parameterized. A simple approach is to have a single form and pass the `role: 'customer'` to the `POST /api/auth/signup` endpoint.
- **Login Page (AC: 2):**
    - **Location:** `src/app/auth/signin/page.tsx`.
    - **UI:** Create a form with email and password fields using `Shadcn/UI` components.
    - **API:** The form will call a new endpoint `POST /api/auth/signin`. This endpoint will validate credentials, and if successful, return a JWT.
    - **Session:** Use `NextAuth.js` or similar to manage the session upon successful login.
- **Profile Page (AC: 3):**
    - **Location:** `src/app/profile/page.tsx`.
    - This page should be a protected route.
    - It will fetch user data from the `GET /api/profile` endpoint (from Story 1.2) and display it.
    - It should include a form to update profile information (e.g., name, phone number), which would call a new `PUT /api/profile` endpoint.

### **Tasks / Subtasks**

1.  **Update Registration:** Modify the signup form to allow for customer registration.
2.  **Create Login Page:** Build the UI and form logic for `src/app/auth/signin/page.tsx`.
3.  **Create Login API:** Implement the `POST /api/auth/signin` endpoint to handle authentication.
4.  **Create Profile Page:** Build the UI for `src/app/profile/page.tsx` to display user data.
5.  **Implement Profile Update:** Create the `PUT /api/profile` endpoint and connect the profile page form to it.

---
---

# **Story 2.2: Shopping Cart Functionality**

- **Status**: `Approved`

### **User Story**

**As a** customer,
**I want** to add products to a shopping cart,
**so that** I can purchase multiple items in a single transaction.

### **Acceptance Criteria**

1.  An "Add to Cart" button is present on all product detail pages.
2.  A persistent cart component (e.g., a drawer or icon in the header) is visible across the site, showing the number of items.
3.  A dedicated cart page (`/cart`) allows users to view all items, adjust quantities, or remove items.
4.  The cart page displays a subtotal and a final total price.

### **Dev Notes (Technical Implementation Details)**

- **State Management:** A client-side global state is required for the cart. `Zustand` is the recommended library from the tech stack.
    - **Store:** Create a cart store (`src/context/CartContext.tsx` or similar) to hold an array of `{ productId, quantity }`.
    - **Actions:** The store should have actions like `addItem`, `removeItem`, `updateQuantity`.
    - **Persistence:** Use `persist` middleware for Zustand to save the cart contents to `localStorage`, so it persists between sessions.
- **UI Components:**
    - **`AddToCartButton.tsx` (AC: 1):** A button component that takes a `productId` and calls the `addItem` action on the cart store.
    - **`CartDrawer.tsx` (AC: 2):** A component, likely in the main `Header.tsx`, that displays the cart icon and item count. Clicking it opens a drawer/modal showing a summary of the cart.
    - **Cart Page (AC: 3, 4):** A full page at `src/app/cart/page.tsx` that subscribes to the cart store and displays its full contents with controls for quantity and removal.

### **Tasks / Subtasks**

1.  **Setup Cart State:** Create the Zustand store for cart management with persistence.
2.  **Create `AddToCartButton`:** Build the button and integrate it into the product detail page (`src/app/products/[id]/page.tsx`).
3.  **Create `CartDrawer`:** Build the header component to show cart status.
4.  **Create Cart Page:** Build the full cart page UI at `src/app/cart/page.tsx`.
5.  **Implement Cart Logic:** Connect the UI components to the Zustand store to manage quantities, removal, and price calculations.

---
---

# **Story 2.3: Order & Payment Data Model**

- **Status**: `Approved`

### **User Story**

**As a** developer,
**I want** a database schema and API endpoints for managing orders,
**so that** customer transactions can be recorded and processed.

### **Acceptance Criteria**

1.  Database migrations/models for `orders` and `order_items` tables are created.
2.  The `orders` table links to the customer and stores the total price and a status.
3.  The `order_items` table links to orders and stores product/quantity info.
4.  API endpoints are created for creating (`POST /api/orders`) and retrieving (`GET /api/orders`) orders.

### **Dev Notes (Technical Implementation Details)**

- **Data Models & Schema:**
    - Implement the `orders`, `order_items`, and `payments` tables as defined in the architecture.
    - **`orders`:** `id`, `customer_id`, `total_price_cents`, `status` (enum).
    - **`order_items`:** `id`, `order_id`, `variant_id`, `quantity`, `price_at_purchase_cents`.
    - *Reference: `[Source: architecture/7-database-schema.md]`*
- **API Specifications:**
    - **`POST /api/orders` (AC: 4):** Creates a new order. This should be called *after* payment is initiated. It will take the cart contents and user ID, calculate the final price, and create the `orders` and `order_items` records.
    - **`GET /api/orders` (AC: 4):** Retrieves a list of orders for the currently authenticated user (customer or farmer).
    - **File Locations:** `src/app/api/orders/route.ts` and `src/app/api/orders/[id]/route.ts`.
    - *Reference: `[Source: architecture/5-api-specification.md]`*

### **Tasks / Subtasks**

1.  **Schema/Model Definition (AC: 1, 2, 3):**
    - Create the `Order` and `OrderItem` models in `src/lib/models/`.
2.  **API Endpoint: Create Order (AC: 4):**
    - Implement the `POST` handler in `src/app/api/orders/route.ts`.
    - This endpoint must be authenticated.
    - It should perform a final validation of prices and inventory before creating the order.
3.  **API Endpoint: Get Orders (AC: 4):**
    - Implement the `GET` handler in `src/app/api/orders/route.ts`.
    - The logic should return orders where the user is either the customer OR the seller of items in the order.
4.  **Testing:** Write unit tests for the new order endpoints.

---
---

# **Story 2.4: Secure Checkout Process**

- **Status**: `Approved`

### **User Story**

**As a** customer,
**I want** a secure checkout process to pay for the items in my cart,
**so that** I can complete my purchase with confidence.

### **Acceptance Criteria**

1.  A checkout page is created, accessible from the cart.
2.  The system is integrated with Stripe for payment processing.
3.  Upon successful payment, an order is created with a 'processing' status.
4.  The user is redirected to an order confirmation page.

### **Dev Notes (Technical Implementation Details)**

- **Workflow:** Follow the `Place Order Sequence Diagram`.
    - *Reference: `[Source: architecture/6-core-workflows.md]`*
- **Stripe Integration (AC: 2):**
    - **Backend:** Create a new endpoint `POST /api/checkout/create-payment-intent`. This will take the cart items, calculate the total amount, and create a `PaymentIntent` with Stripe, returning the `client_secret` to the frontend.
    - **Frontend:** Use the `@stripe/react-stripe-js` library. On the checkout page, call the `create-payment-intent` endpoint, then use the returned `client_secret` to mount the Stripe `PaymentElement`.
- **Checkout Page (AC: 1):**
    - **Location:** `src/app/checkout/page.tsx`.
    - This page will contain the Stripe payment form.
    - Upon submission, it calls `stripe.confirmPayment()`.
- **Order Creation (AC: 3):** After `stripe.confirmPayment()` succeeds, the frontend will then call the `POST /api/orders` endpoint (from Story 2.3) to finalize the order in the database.
- **Confirmation Page (AC: 4):**
    - **Location:** `src/app/orders/confirmed/[id]/page.tsx`.
    - A simple page that displays a success message and the order number.

### **Tasks / Subtasks**

1.  **Configure Stripe:** Add Stripe secret keys to environment variables and initialize the Stripe SDK in `src/lib/stripe.ts`.
2.  **Create Payment Intent API:** Build the `POST /api/checkout/create-payment-intent` endpoint.
3.  **Build Checkout Page:** Create `src/app/checkout/page.tsx` and integrate the Stripe Elements form.
4.  **Handle Payment Confirmation:** Implement the client-side logic to confirm the payment and then call the `/api/orders` endpoint.
5.  **Build Confirmation Page:** Create the dynamic confirmation page.

---
---

# **Story 2.5: Farmer Order Management**

- **Status**: `Approved`

### **User Story**

**As a** farmer,
**I want** to see a list of new orders for my products and confirm them,
**so that** I can begin preparing them for the customer.

### **Acceptance Criteria**

1.  The Farmer Dashboard (`/dashboard`) includes a list of incoming orders for their products.
2.  Farmers can view the details of each order.
3.  Farmers have a button to change an order's status from 'processing' to 'confirmed'.

### **Dev Notes (Technical Implementation Details)**

- **Dashboard Page (AC: 1):**
    - **Location:** `src/app/dashboard/orders/page.tsx`.
    - **Data:** Fetch data from `GET /api/orders`. The API should be smart enough to return orders containing products sold by the currently logged-in farmer.
- **Order Status Update (AC: 3):**
    - **API:** Create a new endpoint `PATCH /api/orders/{id}`. This endpoint will take a new `status` in the body.
    - It must be authenticated and verify that the user is the farmer associated with the order before allowing the update.
    - **UI:** Add a 'Confirm Order' button to each order in the list on the dashboard. Clicking it will call the `PATCH` endpoint.

### **Tasks / Subtasks**

1.  **Create Farmer Orders Page:** Build the UI at `src/app/dashboard/orders/page.tsx`.
2.  **Fetch Farmer Orders:** Implement the data fetching logic for the page.
3.  **Create Update Status API:** Build the `PATCH /api/orders/{id}` endpoint with farmer authorization.
4.  **Implement Confirm Button:** Add the button and its `onClick` handler to the dashboard UI.

---
---

# **Story 2.6: Customer Order History**

- **Status**: `Approved`

### **User Story**

**As a** customer,
**I want** to view my past orders and their current status,
**so that** I can track my purchases.

### **Acceptance Criteria**

1.  The Customer Profile page (`/profile`) includes a list of their past and current orders.
2.  The status for each order is clearly displayed.

### **Dev Notes (Technical Implementation Details)**

- **Profile Page (AC: 1):**
    - **Location:** `src/app/profile/page.tsx`.
    - **Data:** The page should call `GET /api/orders`. The API (from Story 2.3) already supports fetching orders for the current user.
- **UI:**
    - Add a new section to the profile page titled "My Orders".
    - Display the orders in a list or table, showing Order ID, Date, Total Price, and Status.

### **Tasks / Subtasks**

1.  **Update Profile Page:** Modify `src/app/profile/page.tsx` to fetch data from `GET /api/orders`.
2.  **Render Order List:** Add the UI to display the list of orders with their statuses.

---
---

# **Story 2.7: Basic Order Notification**

- **Status**: `Approved`

### **User Story**

**As a** customer,
**I want** to receive a basic notification when my order is confirmed,
**so that** I have confidence the farmer is preparing it.

### **Acceptance Criteria**

1.  When a farmer changes an order's status to 'confirmed', an automated email is sent to the customer.
2.  The email contains a summary of the order.

### **Dev Notes (Technical Implementation Details)**

- **Email Service:** Use Amazon SES as specified in the tech stack.
    - **Integration:** Create a utility function in `src/lib/email.ts` that uses the AWS SDK to send emails.
- **Trigger:** The email should be sent from the `PATCH /api/orders/{id}` endpoint (from Story 2.5). After successfully updating the order status in the database, if the new status is 'confirmed', trigger the email sending function.
- **Email Template:** Create a simple HTML or text-based email template for the order confirmation.

### **Tasks / Subtasks**

1.  **Configure SES:** Set up AWS SES credentials in the environment.
2.  **Create Email Utility:** Implement the email sending function in `src/lib/email.ts`.
3.  **Update Order API:** Modify the `PATCH /api/orders/{id}` endpoint to call the email utility when an order is confirmed.
4.  **Create Email Template:** Design the simple order confirmation email.
