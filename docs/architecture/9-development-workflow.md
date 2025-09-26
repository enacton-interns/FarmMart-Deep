# 9. Development Workflow

#### **Local Development Setup**
- **Prerequisites:** Node.js (v20+), Docker, Turborepo (`npm i -g turborepo`)
- **Initial Setup:**
  1. Clone the repository.
  2. Run `npm install` at the root.
  3. Run `docker-compose up -d` to start PostgreSQL.
  4. Copy `.env.example` to `.env` in `apps/api` and fill in database details.
- **Development Commands:**
  - `turbo dev`: Start all services.
  - `turbo test`: Run all tests.

***

This document provides a comprehensive architectural foundation. Further detailed design for each component will occur during the development sprints.