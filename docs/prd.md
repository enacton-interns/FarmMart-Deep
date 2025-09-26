# FarmmartBMAD Product Requirements Document (PRD)

### 1. Goals and Background Context

#### **Goals**

*   Increase farmer participation by onboarding 50 local farmers within the first 6 months.
*   Drive customer adoption to achieve 1,000 active customers within the first year.
*   Facilitate $100,000 in direct farmer-to-consumer sales within the first year.
*   Achieve financial sustainability with a positive operational margin within 18 months.
*   Successfully launch in 3 distinct local communities within 2 years.

#### **Background Context**

The Farm Market application addresses the disconnect between local food producers and consumers by providing a full-stack digital platform for direct sales. Farmers face challenges with market access and profitability due to intermediaries and logistical hurdles. Consumers, in turn, struggle to find and purchase fresh, locally-sourced produce with confidence.

This PRD outlines the requirements for the Minimum Viable Product (MVP) of the Farm Market platform. The MVP is focused on validating the core assumptions: that farmers will adopt a simple digital sales channel and that consumers will use it to buy local goods. The solution prioritizes trust, simplicity, and community-building over complex, feature-rich technology to ensure it meets the needs of its target users.

#### **Change Log**

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-09-18 | 0.3 | Added Out of Scope section. | John (PM) |
| 2025-09-18 | 0.2 | Added MVP Validation & NFRs for Ops/Reliability. | John (PM) |
| 2025-09-18 | 0.1 | Initial draft of PRD from Project Brief. | John (PM) |

***

### 2. MVP Validation Approach

The success of the Farm Market MVP will be determined by its ability to validate our two primary assumptions: 1) that farmers will adopt a simple digital platform for direct sales, and 2) that consumers will use this platform to purchase local produce.

Validation will be measured using a combination of quantitative metrics and qualitative feedback.

#### **Quantitative Success Criteria (First 3 Months)**

*   **Farmer Adoption:** Onboard at least **15** local farmers who actively list produce.
*   **Customer Adoption:** Acquire at least **200** unique customers who make a purchase.
*   **Marketplace Traction:** Facilitate a total of at least **$5,000** in Gross Merchandise Value (GMV).
*   **Operational Stability:** Maintain an order fulfillment rate of **90%** or higher.

#### **Qualitative Feedback & Learning**

*   **Farmer Interviews:** We will conduct 1-on-1 interviews with at least 10-15 of our initial farmers to gather direct feedback on the onboarding process, product management, and order fulfillment workflow.
*   **Customer Surveys:** A simple satisfaction survey will be sent to customers after their first purchase to measure their perception of trust, simplicity, and overall experience.
*   **User Feedback Analysis:** We will analyze all qualitative feedback to identify key pain points and areas for improvement in the post-MVP roadmap.

***

### 3. Requirements

#### **Functional Requirements**

1.  **FR1:** Farmers can register for the platform through a simple, low-tech process (e.g., web form, guided phone call, or WhatsApp).
2.  **FR2:** Farmers can create, edit, and manage product listings, including name, description, price, quantity, and photos.
3.  **FR3:** Customers can browse all available produce on the platform.
4.  **FR4:** Customers can search for produce by product name, farmer, or location.
5.  **FR5:** Customers can add items to a shopping cart and place an order.
6.  **FR6:** Customers can view their complete order history.
7.  **FR7:** Farmers can view and manage the status of incoming orders.
8.  **FR8:** All payments must be processed through a secure, integrated payment gateway that includes escrow functionality.
9.  **FR9:** The system will display a "Verified Farmer Badge" for farmers who complete an identity verification process.
10. **FR10:** A basic notification system will inform farmers and customers about significant order status changes.

#### **Non-Functional Requirements**

1.  **NFR1:** The platform must be a responsive web application, providing a seamless experience on modern desktop, tablet, and mobile browsers.
2.  **NFR2:** Critical pages (e.g., product listings, checkout) must have a target load time of under 3 seconds on a standard broadband connection.
3.  **NFR3:** The user interface must adhere to Web Content Accessibility Guidelines (WCAG) 2.1 AA standards.
4.  **NFR4:** The platform architecture must be designed to scale, anticipating future growth to thousands of active farmers and tens of thousands of customers.
5.  **NFR5:** All sensitive user data must be encrypted both in transit (TLS/SSL) and at rest.
6.  **NFR6 (Availability):** The production application will target **99.5% uptime**, excluding scheduled maintenance windows.
7.  **NFR7 (Data Backup):** The production database will be backed up daily, with backups retained for at least 7 days to ensure recoverability.
8.  **NFR8 (Monitoring):** The system will include a `/health` check endpoint for basic uptime monitoring, integration with an error tracking service, and basic performance monitoring to track API response times.

***

### 4. Out of Scope for MVP

To ensure focus on the core value proposition for the MVP, the following features and capabilities are explicitly considered out of scope. They may be considered for future versions of the platform.

*   **Subscription Boxes / Recurring Orders:** The MVP will only support single, one-time purchases.
*   **Advanced Logistics & Delivery Partners:** The MVP will rely on a simple, farmer-managed pickup/delivery model. A dedicated system for third-party couriers is not included.
*   **Dynamic Pricing Engine:** Farmers will set their own static prices.
*   **QR Code Traceability:** Advanced farm-to-table traceability features are not in scope for the MVP.
*   **Gamified Loyalty Programs:** Customer rewards, badges, and loyalty points are post-MVP features.
*   **Advanced Analytics for Farmers:** Farmers will have basic order information, but comprehensive sales dashboards are not included.
*   **In-App Chat:** The MVP will use basic order notifications (email). A real-time, in-app chat system is out of scope.

***

### 5. User Interface Design Goals

This section captures the high-level vision for the user experience to guide the design and development process.

#### **Overall UX Vision**

The user experience should embody the project's core themes of **Trust and Simplicity**. The platform should feel like a friendly, approachable, and reliable local market, not a slick, impersonal e-commerce giant. The design will prioritize clarity, ease of use, and authenticity, using high-quality imagery of farms and produce to build a connection between the consumer and the farmer.

#### **Key Interaction Paradigms**

We will use familiar and intuitive e-commerce patterns to minimize the learning curve for all users. This includes:
*   A grid-based layout for browsing and searching products.
*   A standard shopping cart and multi-step checkout process.
*   Simple, clearly labeled forms for farmers to manage their products and orders.

#### **Core Screens and Views**

The following conceptual screens are critical for the MVP:
*   Home/Landing Page (featuring local produce and farmers)
*   Search Results Page
*   Product Detail Page
*   Shopping Cart
*   Checkout Flow (Payment & Pickup/Delivery selection)
*   Customer Profile & Order History
*   Farmer Dashboard (for order and product management)
*   Login / Registration Page

#### **Accessibility: WCAG AA**

The application must adhere to WCAG 2.1 Level AA guidelines to be accessible to users with disabilities.

#### **Branding**

*(Assumption)* The project brief does not specify branding. I propose a design direction that uses an earthy, natural color palette (greens, browns, yellows) and clean, highly-readable fonts. The brand's visual identity should be driven by authentic photography of the farms and their products.

#### **Target Device and Platforms: Web Responsive**

The application will be a responsive web app, ensuring a consistent and functional experience across desktop, tablet, and mobile devices.

***

## 6. Technical Assumptions

This section documents the guiding technical decisions and constraints for the project.

#### **Repository Structure: Monorepo**

A monorepo will be used to house the frontend and backend code.
*   **Rationale:** This simplifies dependency management and cross-service changes during the early stages of the project, which is ideal for a small, focused MVP team.

#### **Service Architecture: Modular Monolith**

The application will be built as a single backend service (a monolith) but with strong internal boundaries between logical domains (e.g., users, products, orders).
*   **Rationale:** This approach provides a faster development start than a full microservices architecture, while still allowing for easier extraction of services in the future as the platform scales. It aligns with the MVP's need for speed and the long-term vision for scalability.

#### **Testing Requirements: Unit + Integration**

The testing strategy will require both unit tests for individual components and integration tests for key workflows (e.g., placing an order).
*   **Rationale:** This provides a balanced approach, ensuring individual logic is correct while also verifying that major components work together as expected, which is critical for a transaction-based platform.

#### **Additional Technical Assumptions and Requests**

*   **Frontend:** React with TypeScript.
*   **Backend:** Node.js with Express.js and TypeScript.
*   **Database:** PostgreSQL.
*   **Deployment:** The application will be containerized using Docker and initially deployed to a cloud provider like AWS or GCP.
*   **Rationale for Stack:** The brief mentioned React/Vue and Node/Python as options. I have proposed a specific stack (React/Node.js/TypeScript) because it allows for a shared language across the frontend and backend, improving development efficiency for a small team. PostgreSQL is chosen for its robustness and data integrity, which is crucial for handling orders and payments.

***

### 7. Epic List

Here is the proposed list of epics to deliver the Farm Market MVP.

*   **Epic 1: Foundation & Farmer Onboarding**
    *   **Goal:** Establish the project's technical foundation, and enable farmers to onboard, become verified, and list their products for customers to browse and search.

*   **Epic 2: Customer Transaction Engine**
    *   **Goal:** Enable customers to create an account, place orders, and pay securely, while providing farmers with the tools to manage incoming orders and basic communication.

***

### 8. Epic 1: Foundation & Farmer Onboarding

**Goal:** The goal of this epic is to establish the project's foundational infrastructure, including the initial database schema, API setup, and a basic frontend application. It will deliver the core functionality for farmers to create an account, get verified by an admin process, and successfully list their produce, making it visible to any visitor on the platform. This epic builds the essential "supply" side of our marketplace.

---

#### **Story 1.1: Project & Repository Setup**

*As a developer, I want a new monorepo with initial frontend and backend application skeletons, so that I can begin development in a structured environment.*

**Acceptance Criteria:**
1.  A new monorepo is created in a Git provider.
2.  A basic frontend application (e.g., using Create React App) is set up in the repository.
3.  A basic backend application (e.g., using Express.js) is set up in the repository.
4.  A Docker Compose file is created to orchestrate the local development environment.

---

#### **Story 1.2: User & Farmer Profile Model**

*As a developer, I want a database schema and API endpoints for creating and retrieving basic user and farmer profiles, so that we can store essential user information.*

**Acceptance Criteria:**
1.  A database migration for a `users` table is created with fields for email, password hash, and role (e.g., 'customer', 'farmer').
2.  A `farmer_profiles` table is created that links to the `users` table.
3.  API endpoints exist and are tested for creating a new user and retrieving a user's profile.

---

#### **Story 1.3: Farmer Registration**

*As a farmer, I want a simple web form to register for an account, so that I can join the platform.*

**Acceptance Criteria:**
1.  A public registration page exists with fields for email and password.
2.  Upon submission, the form calls the API to create a new user with the 'farmer' role.
3.  The user is automatically logged in upon successful registration.
4.  Appropriate error messages are shown for invalid input or if the email is already taken.

---

#### **Story 1.4: Farmer Verification Process**

*As a platform owner, I want a simple, manual way to mark farmers as "verified", so that we can begin building trust with customers.*

**Acceptance Criteria:**
1.  The `farmer_profiles` table contains an `is_verified` boolean field, which defaults to `false`.
2.  For the MVP, a platform administrator can manually set this flag to `true` directly in the database.
3.  When a farmer's profile is viewed, a "Verified" badge is displayed if this flag is `true`.

---

#### **Story 1.5: Product Catalog Model**

*As a developer, I want a database schema and API endpoints for managing products, so that farmers have a way to list their produce.*

**Acceptance Criteria:**
1.  A database migration for a `products` table is created (including name, description, price, quantity, and a link to the farmer).
2.  API endpoints exist and are tested for creating, retrieving, updating, and deleting products.
3.  Only the farmer who created a product can update or delete it.

---

#### **Story 1.6: Farmer Product Management**

*As a farmer, I want a simple form to create and edit my product listings, so that I can manage my inventory on the platform.*

**Acceptance Criteria:**
1.  A "Manage My Products" page is available only to logged-in farmers.
2.  The page contains a form to create a new product, including fields for name, description, price, and quantity.
3.  Farmers can see a list of their existing products and have options to edit or delete them.

---

#### **Story 1.7: Public Product Browsing**

*As a customer, I want to browse a list of all available products, so that I can see what's for sale in the marketplace.*

**Acceptance Criteria:**
1.  A public home page displays a grid or list of all products from all farmers.
2.  Each product display includes its name, price, and the name of the farm/farmer.
3.  Clicking on a product takes the user to a detailed product page showing all its information.

***

### 9. Epic 2: Customer Transaction Engine

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