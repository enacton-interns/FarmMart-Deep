# 3. Tech Stack

| Category | Technology | Version | Purpose | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| Frontend Language | TypeScript | 5.x | Type safety for UI code | Reduces runtime errors and improves developer experience. |
| Frontend Framework | Next.js (React) | 14.x | Full-stack React framework | Provides excellent performance (SSG/SSR) and developer experience. |
| UI Component Library | Shadcn/UI | latest | Composable and accessible UI components | Provides a great-looking, unstyled base to build our custom UI upon. |
| State Management | Zustand | 4.x | Minimalist state management | Simple, unopinionated, and avoids boilerplate compared to Redux. |
| Backend Language | TypeScript | 5.x | Type safety for API code | Consistent language with frontend, reduces errors. |
| Backend Framework | Express.js | 4.x | Web server framework for Node.js | Mature, well-supported, and flexible for building REST APIs. |
| API Style | REST | N/A | Client-server communication | Well-understood, stateless, and easy to consume for web clients. |
| Database | PostgreSQL | 16.x | Primary data store | Robust, reliable, and excellent for relational data like users and orders. |
| File Storage | Amazon S3 | N/A | Storing user/product images | Highly scalable, durable, and cost-effective object storage. |
| Authentication | AWS Cognito / NextAuth.js | N/A | User authentication and management | Cognito provides a robust backend, NextAuth simplifies frontend integration. |
| Frontend Testing | Jest & React Testing Library | latest | Unit & Component testing | Industry standard for testing React applications. |
| Backend Testing | Jest & Supertest | latest | Unit & Integration testing | Jest for test running, Supertest for HTTP endpoint testing. |
| E2E Testing | Playwright | latest | End-to-end browser testing | Modern, reliable, and fast E2E testing framework. |
| Build/Bundler | Turborepo / Next.js | latest | Monorepo management and bundling | Turborepo for monorepo tasks, Next.js handles its own bundling. |
| CI/CD | Vercel & GitHub Actions | N/A | Continuous integration & deployment | Vercel for frontend, GitHub Actions for backend deployment pipeline. |
| Monitoring | Vercel Analytics & AWS CloudWatch | N-A | Performance and health monitoring | Vercel for frontend vitals, CloudWatch for backend logs and metrics. |

***