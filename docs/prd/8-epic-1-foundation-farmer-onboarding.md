# 8. Epic 1: Foundation & Farmer Onboarding

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
