<!-- EPIC 1: ALL STORIES -->
<!-- Powered by BMAD™ -->

# **Epic 1: Foundation & Farmer Onboarding - All Stories**

This document contains the Approveded stories for the remainder of Epic 1.

---
---

<!-- Epic: 1, Story: 2 -->
<!-- Powered by BMAD™ -->

# **Story 1.2: User & Farmer Profile Model**

- **Status**: `Approved`
- **Priority**: `High`
- **Points**: `3`

---

### **User Story**

**As a** developer,
**I want** a database schema and API endpoints for creating and retrieving basic user and farmer profiles,
**so that** we can store essential user information.

---

### **Acceptance Criteria**

1.  A database migration or model for a `users` table is created with fields for email, password hash, and role.
2.  A `farmer_profiles` table/model is created that links to the `users` table via a one-to-one relationship.
3.  The `farmer_profiles` model contains an `is_verified` boolean field, defaulting to `false`.
4.  An API endpoint `POST /api/auth/signup` exists to create a new user with a specified role ('customer' or 'farmer').
5.  An API endpoint `GET /api/profile` exists to retrieve the profile of the currently authenticated user.
6.  Endpoint requests are validated to ensure data integrity.
7.  Unit tests are created to verify the functionality of the new API endpoints.

---

### **Dev Notes (Technical Implementation Details)**

**CRITICAL:** This section contains implementation details derived ONLY from existing architecture documents. Do NOT invent new patterns or libraries.

#### **Previous Story Insights**
- Story 1.1 established the Next.js monorepo structure. This story will add the first core models and API endpoints within that structure.

#### **Data Models & Schema**
- Implement the `users` and `user_profiles` tables as defined in the database schema.
- **`users` table:**
    - `id` (uuid, primary key)
    - `email` (text, unique, not null)
    - `password_hash` (text, not null)
    - `created_at`, `updated_at`, `deleted_at` (timestamptz)
    - *Reference: `[Source: architecture/7-database-schema.md]`*
- **`user_profiles` table:**
    - `user_id` (uuid, primary key, foreign key to `users.id`)
    - `farm_name` (text, nullable)
    - `is_verified` (boolean, not null, default `false`)
    - *Reference: `[Source: architecture/7-database-schema.md]`*
- **`roles` & `user_roles` tables:**
    - The schema defines `roles` and `user_roles` tables to manage access. The user creation logic should assign the correct role (`customer` or `farmer`) upon registration.
    - *Reference: `[Source: architecture/7-database-schema.md]`*
- Use the TypeScript interfaces from `packages/shared-types/src/user.ts` for type safety.
    - *Reference: `[Source: architecture/4-data-models.md]`*

#### **API Specifications**
- **`POST /api/auth/signup`**:
    - This endpoint should be created within the Next.js API routes (`src/app/api/auth/signup/route.ts`).
    - It will receive `email`, `password`, and `role` in the request body.
    - It must hash the password before storing it in the `users` table. Use a strong hashing algorithm (e.g., bcrypt).
    - It will create an entry in both the `users` and `user_profiles` tables.
    - *Reference: `[Source: architecture/5-api-specification.md]` (Note: spec shows `/register`, using `/signup` to match existing folder structure)*
- **`GET /api/profile`**:
    - This endpoint should be created at `src/app/api/profile/route.ts`.
    - It must be authenticated, requiring a valid JWT.
    - It will retrieve the user's ID from the JWT, then query the `users` and `user_profiles` tables to return the combined user profile information.
    - *Reference: `[Source: architecture/5-api-specification.md]` (Note: spec shows `/users/me`, using `/profile` for simplicity)*

#### **File Locations**
- **API Routes:**
    - `src/app/api/auth/signup/route.ts`
    - `src/app/api/profile/route.ts`
- **Database Models/Migrations:**
    - The project uses `lib/initdb.ts` which suggests model definitions will be used to sync the schema. Place new model files in `src/lib/models/`.
    - `src/lib/models/user.ts`
    - `src/lib/models/profile.ts`
- **Shared Types:**
    - Already defined in `packages/shared-types/`. No action needed, just import from there.
    - *Reference: `[Source: architecture/8-unified-project-structure.md]`*

#### **Testing Requirements**
- Create unit tests for the new API endpoints.
- Use Jest and Supertest as defined in the tech stack.
- **Test Cases for `POST /api/auth/signup`**:
    - Test successful creation of a 'farmer' user.
    - Test successful creation of a 'customer' user.
    - Test for an error when the email address is already in use.
    - Test for validation errors (e.g., invalid email, weak password).
- **Test Cases for `GET /api/profile`**:
    - Test successful retrieval of a user's profile.
    - Test for an error when no authentication token is provided.
- *Reference: `[Source: architecture/3-tech-stack.md]`*

---

### **Tasks / Subtasks**

1.  **Schema/Model Definition:**
    - Create the `User` model in `src/lib/models/user.ts` corresponding to the `users` table.
    - Create the `Profile` model in `src/lib/models/profile.ts` for the `user_profiles` table, establishing the foreign key relationship.
2.  **API Endpoint: User Signup (AC: 1, 2, 3, 4, 6)**
    - Create the file `src/app/api/auth/signup/route.ts`.
    - Implement the `POST` handler to accept `email`, `password`, and `role`.
    - Add input validation logic (e.g., using Zod or a similar library).
    - Add logic to hash the password.
    - Implement the database logic to create records in the `users` and `user_profiles` tables within a transaction.
3.  **API Endpoint: Get Profile (AC: 5, 6)**
    - Create the file `src/app/api/profile/route.ts`.
    - Implement the `GET` handler.
    - Add middleware or a handler utility to verify the JWT and extract the user ID.
    - Implement the database logic to fetch the user and profile data.
4.  **Testing (AC: 7)**
    - Create a new test file for the auth endpoints (e.g., `src/app/api/auth/auth.test.ts`).
    - Write unit tests for the `signup` endpoint covering success and failure cases.
    - Write unit tests for the `profile` endpoint covering success and auth failure.


---
---



# **Story 1.3: Farmer Registration**

- **Status**: `Approved`

### **User Story**

**As a** farmer,
**I want** a simple web form to register for an account,
**so that** I can join the platform.

### **Acceptance Criteria**

1.  A public registration page exists at `/auth/signup` with fields for email and password.
2.  Upon submission, the form calls the `POST /api/auth/signup` endpoint with the role set to 'farmer'.
3.  The user is automatically logged in upon successful registration.
4.  Appropriate error messages are shown for invalid input or if the email is already taken.

### **Dev Notes (Technical Implementation Details)**

- **Frontend Component:** Create a new React component for the registration form.
    - **Location:** `src/app/auth/signup/page.tsx`
    - **UI:** Use `Shadcn/UI` components for the form fields (`Input`, `Button`, `Label`).
    - **State Management:** Use component state (e.g., `useState`) to manage form inputs. For handling the submission and subsequent user session, use a client-side data fetching library like SWR or React Query, configured to call the API endpoint.
    - *Reference: `[Source: architecture/3-tech-stack.md]`*
- **API Integration:** The form should make a `POST` request to the `/api/auth/signup` endpoint created in Story 1.2.
    - On success (HTTP 201), the response should contain the user and a token. Use a library like `NextAuth.js` to manage the session and automatically log the user in.
    - On failure (HTTP 400/409), display the error message from the API response to the user.
    - *Reference: `[Source: architecture/5-api-specification.md]`*

### **Tasks / Subtasks**

1.  **Create Registration Page (AC: 1):**
    - Create the file `src/app/auth/signup/page.tsx`.
    - Build the UI with email and password input fields and a submit button.
2.  **Implement Form Logic (AC: 2, 4):**
    - Add state management for form inputs.
    - Implement the `onSubmit` handler to call the `POST /api/auth/signup` endpoint, passing the form data and `role: 'farmer'`.
    - Implement error handling to display messages from the API.
3.  **Handle Session (AC: 3):**
    - Configure `NextAuth.js` or a similar session management utility.
    - On successful registration, use the API response to establish a user session, effectively logging them in.

---
---

# **Story 1.4: Farmer Verification Process**

- **Status**: `Approved`

### **User Story**

**As a** platform owner,
**I want** a simple, manual way to mark farmers as "verified",
**so that** we can begin building trust with customers.

### **Acceptance Criteria**

1.  The `farmer_profiles` table contains an `is_verified` boolean field, which defaults to `false` (already implemented in Story 1.2).
2.  For the MVP, a platform administrator can manually set this flag to `true` directly in the database.
3.  When a farmer's profile is viewed, a "Verified" badge is displayed if this flag is `true`.

### **Dev Notes (Technical Implementation Details)**

- **Database:** The `is_verified` field already exists in the `user_profiles` table as per the schema and Story 1.2. No database changes are needed.
    - *Reference: `[Source: architecture/7-database-schema.md]`*
- **Admin Process (AC: 2):** This is a manual process for the MVP. No code is required to implement this. The administrator will use a database client (e.g., `psql`, DBeaver) to run an `UPDATE` query.
    - `UPDATE user_profiles SET is_verified = true WHERE user_id = '<farmer_user_id>';`
- **Frontend Display (AC: 3):**
    - **Location:** This badge should appear on any component that displays farmer information, such as a future farmer profile page or on product pages.
    - **Component:** Create a simple `VerifiedBadge` component in the shared `ui` package (`packages/ui/src/VerifiedBadge.tsx`).
    - **Logic:** The component will take `is_verified` as a prop and render a badge (e.g., with a checkmark icon) only if the value is `true`.
    - The `GET /api/profile` endpoint (from Story 1.2) should already include the `is_verified` field in its response.

### **Tasks / Subtasks**

1.  **Create VerifiedBadge Component (AC: 3):**
    - Create the file `packages/ui/src/VerifiedBadge.tsx`.
    - Implement a simple React component that conditionally renders a badge or similar UI element based on a boolean prop.
2.  **Integrate Badge into Profile View (AC: 3):**
    - In the component responsible for displaying a user's profile (e.g., `src/app/profile/page.tsx`), fetch the user data.
    - Pass the `is_verified` property from the user data to the new `VerifiedBadge` component.
3.  **Documentation (AC: 2):**
    - Add a note in the project's `README.md` or a new `docs/admin-guide.md` explaining the manual verification process for the MVP.

---
---

# **Story 1.5: Product Catalog Model**

- **Status**: `Approved`

### **User Story**

**As a** developer,
**I want** a database schema and API endpoints for managing products,
**so that** farmers have a way to list their produce.

### **Acceptance Criteria**

1.  A database migration/model for a `products` table is created (including name, description, price, quantity, and a link to the farmer).
2.  API endpoints exist and are tested for creating (`POST /api/products`), retrieving (`GET /api/products`), updating (`PUT /api/products/{id}`), and deleting (`DELETE /api/products/{id}`) products.
3.  Only the farmer who created a product can update or delete it.

### **Dev Notes (Technical Implementation Details)**

- **Data Models & Schema:**
    - Implement the `products`, `product_variants`, and `inventory` tables as defined in the schema.
    - **`products`:** `id`, `farmer_id` (FK to `user_profiles.user_id`), `name`, `description`.
    - **`product_variants`:** `id`, `product_id` (FK to `products.id`), `price_cents`, `currency`, `attributes` (jsonb for things like 'unit').
    - **`inventory`:** `variant_id` (FK to `product_variants.id`), `quantity_available`.
    - *Reference: `[Source: architecture/7-database-schema.md]`*
- **API Specifications:**
    - Create a new API route handler at `src/app/api/products/route.ts` for `GET` (list) and `POST` (create).
    - Create a dynamic route at `src/app/api/products/[id]/route.ts` for `GET` (detail), `PUT` (update), and `DELETE`.
    - **Authorization (AC: 3):** For `PUT` and `DELETE`, the handler must verify that the authenticated user's ID matches the `farmer_id` on the product they are trying to modify.
    - *Reference: `[Source: architecture/5-api-specification.md]`*
- **File Locations:**
    - **API Routes:** `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts`
    - **Database Models:** `src/lib/models/product.ts` (and variant/inventory if separated).

### **Tasks / Subtasks**

1.  **Schema/Model Definition (AC: 1):**
    - Create the `Product` and related models in `src/lib/models/` to represent the `products`, `product_variants`, and `inventory` tables.
2.  **API Endpoint: List & Create (AC: 2):**
    - Implement `GET` and `POST` handlers in `src/app/api/products/route.ts`.
    - `POST` requires farmer authentication.
3.  **API Endpoint: Detail, Update, Delete (AC: 2, 3):**
    - Implement `GET`, `PUT`, `DELETE` handlers in `src/app/api/products/[id]/route.ts`.
    - `PUT` and `DELETE` must include the ownership check.
4.  **Testing:**
    - Write unit tests for all new product endpoints, including success cases, auth failures, and ownership checks.

---
---

# **Story 1.6: Farmer Product Management**

- **Status**: `Approved`

### **User Story**

**As a** farmer,
**I want** a simple form to create and edit my product listings,
**so that** I can manage my inventory on the platform.

### **Acceptance Criteria**

1.  A "Manage My Products" page is available only to logged-in farmers.
2.  The page contains a form to create a new product, including fields for name, description, price, and quantity.
3.  Farmers can see a list of their existing products and have options to edit or delete them.

### **Dev Notes (Technical Implementation Details)**

- **Page & Routing:**
    - Create a new page at `src/app/dashboard/products/page.tsx`.
    - This route should be protected, accessible only to users with the 'farmer' role. Use middleware or a client-side check.
- **UI Components:**
    - **Product Form:** Create a reusable `ProductForm` component in `src/components/ProductForm.tsx`. This form will be used for both creating and editing.
    - **Product List:** Display the products in a table or list using `Shadcn/UI` components.
    - Each item in the list should have 'Edit' and 'Delete' buttons.
- **API Integration:**
    - The page will fetch the farmer's products from `GET /api/products` (you'll need to filter by the current user's ID, or create a dedicated `GET /api/my-products` endpoint).
    - The 'Create' form will call `POST /api/products`.
    - The 'Edit' button will link to a new page `dashboard/products/[id]/edit` which uses the `ProductForm` pre-filled with data.
    - The 'Delete' button will call `DELETE /api/products/{id}`.

### **Tasks / Subtasks**

1.  **Create Products Page (AC: 1):**
    - Create `src/app/dashboard/products/page.tsx`.
    - Add logic to protect the route for farmers only.
2.  **Create Product Form Component (AC: 2):**
    - Create `src/components/ProductForm.tsx` with all necessary fields.
3.  **Display Product List (AC: 3):**
    - On the products page, fetch and display the list of the farmer's products.
    - Add Edit and Delete buttons to each product.
4.  **Implement Create/Edit/Delete Logic (AC: 2, 3):**
    - Wire up the form to the `POST` and `PUT` API endpoints.
    - Wire up the 'Delete' button to the `DELETE` API endpoint.

---
---

# **Story 1.7: Public Product Browsing**

- **Status**: `Approved`

### **User Story**

**As a** customer,
**I want** to browse a list of all available products,
**so that** I can see what's for sale in the marketplace.

### **Acceptance Criteria**

1.  The public home page (`/`) displays a grid or list of all products from all farmers.
2.  Each product display includes its name, price, and the name of the farm/farmer.
3.  Clicking on a product takes the user to a detailed product page showing all its information.

### **Dev Notes (Technical Implementation Details)**

- **Home Page (`/`):**
    - **Location:** `src/app/page.tsx`.
    - **Data Fetching:** This page should be server-side rendered (SSR) or statically generated (SSG) for performance. Use `getServerSideProps` or generate static paths to fetch all products from the `GET /api/products` endpoint.
    - *Reference: `[Source: architecture/2-high-level-architecture.md]`*
- **Product Display:**
    - Create a `ProductCard` component in `src/components/ProductCard.tsx` to display a single product's summary (image, name, price, farm name).
    - The home page will map over the fetched products and render a `ProductCard` for each.
- **Product Detail Page:**
    - **Location:** Create a dynamic route at `src/app/products/[id]/page.tsx`.
    - **Data Fetching:** This page should also use SSR or SSG to fetch the specific product's details from `GET /api/products/{id}`.
    - It should display all relevant product information.

### **Tasks / Subtasks**

1.  **Create ProductCard Component (AC: 2):**
    - Create `src/components/ProductCard.tsx`.
    - Design the card to show key product info and an image.
2.  **Update Home Page (AC: 1):**
    - Modify `src/app/page.tsx` to fetch all products.
    - Render the products using a grid of `ProductCard` components.
3.  **Create Product Detail Page (AC: 3):**
    - Create the dynamic route `src/app/products/[id]/page.tsx`.
    - Implement data fetching for a single product.
    - Build the UI to display all product details.
