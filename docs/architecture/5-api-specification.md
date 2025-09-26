# 5. API Specification

A REST API will be used. The following is a high-level summary of the key resources. A full OpenAPI 3.0 specification will be generated as part of the development process.

**Base URL:** `/api/v1`

**Authentication:** JWT Bearer Tokens issued by Cognito will be required for all authenticated endpoints.

**Key Resources:**

*   **Users & Auth**
    *   `POST /auth/register`: Create a new user (farmer or customer).
    *   `POST /auth/login`: Authenticate and receive a JWT.
    *   `GET /users/me`: Get the profile of the currently logged-in user.
*   **Products**
    *   `GET /products`: Get a list of all products (public).
    *   `GET /products/{id}`: Get details for a single product (public).
    *   `POST /products`: Create a new product (farmer only).
    *   `PUT /products/{id}`: Update a product (farmer only, owner).
*   **Orders**
    *   `POST /orders`: Create a new order from a shopping cart (customer only).
    *   `GET /orders`: Get a list of orders for the current user (customer or farmer).
    *   `PATCH /orders/{id}`: Update an order's status (farmer only, owner).

***