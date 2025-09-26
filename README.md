# FarmMart-With-Bmad

FarmMart-With-Bmad is a farm market (agriculture e-commerce / marketplace) application built with enhanced security and consistency using the **BMAD** method and GitHub specification practices.

Live Demo: [farm-mart-with-bmad.vercel.app](https://farm-mart-with-bmad.vercel.app)

## Table of Contents
1. [Motivation & Overview](#motivation--overview)
2. [Features](#features)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Setup & Installation](#setup--installation)
5. [Environment & Configuration](#environment--configuration)
6. [Running Locally](#running-locally)
7. [Deployment](#deployment)
8. [Folder Structure](#folder-structure)
9. [Contributing](#contributing)
10. [License & Acknowledgments](#license--acknowledgments)
11. [Contact](#contact)

## Motivation & Overview
FarmMart-With-Bmad aims to provide a secure, consistent, and maintainable platform for farmers, buyers, and stakeholders to transact agricultural goods. The **BMAD** approach (Business, Model, API, Data) enforces separation of concerns, robust validation, and modular architecture. This repository includes frontend (Next.js / React) and backend (API, business logic) layers, containerization (Docker), and deployment scripts.

## Features
- User registration, authentication & authorization
- Product / crop listings by farmers
- Browsing & search for buyers
- Cart, checkout, and order management
- Role-based views (farmer, buyer, admin)
- Secure APIs and data validation
- Containerized deployment (Docker, docker-compose)
- Nginx reverse proxy / configuration
- CI/CD or deployment scripts (e.g. `deploy.sh`)
- Environment variable management

## Architecture & Tech Stack
| Layer / Component | Technology / Tool |
|-------------------|-----------------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend / API | Node.js / Express / Next.js API routes |
| Containerization | Docker, docker-compose |
| Web Server / Proxy | Nginx |
| Configuration | `.env`, `next.config.js`, `next-env.d.ts` |
| Deployment Scripts | `deploy.sh`, `Dockerfile` |
| Validation / Models | BMAD method (Business, Model, API, Data layers) |
| Version control & CI | Git / GitHub |

## Setup & Installation
Ensure you have Node.js (>=16), npm / yarn, Docker & docker-compose, and Git installed. Then clone the repository:

```bash
git clone https://github.com/Deep-Bhanushali/FarmMart-With-Bmad.git
cd FarmMart-With-Bmad
```

## Environment & Configuration
Create a `.env` file (or `.env.local`) in the root with your environment variables:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
NEXT_PUBLIC_API_BASE_URL=/api
JWT_SECRET=your_jwt_secret
PORT=3000
# Add other keys like SMTP, cloud storage, etc.
```

Ensure `next.config.js`, `tsconfig.json`, and internal config layers respect your environment variables.

## Running Locally
### Option A: Using Docker
```bash
docker-compose up --build
```
This will spin up API, frontend, database, and services like Nginx.

### Option B: Local Development
1. Install dependencies:
```bash
npm install
# or
yarn install
```
2. Run frontend / backend:
```bash
npm run dev
# or if separate backend
npm run dev:api
```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment
Deployment scripts included:
- `deploy.sh` – Automates building, pushing containers, restarting server
- `Dockerfile` – Builds app image
- `nginx.conf` – Reverse proxy / SSL / routing
- `docker-compose.yml` – Multi-container orchestration

Hosting options:
- AWS ECS / EKS
- DigitalOcean Droplets
- Vercel / Netlify (frontend) + separate backend hosting
- Kubernetes

Secure secrets & environment variables using Vault, AWS SSM, GitHub Secrets, etc.

## Folder Structure
```
.
├── src/
├── .gitignore
├── DEPLOYMENT.md
├── Dockerfile
├── deploy.sh
├── docker-compose.yml
├── next-env.d.ts
├── next.config.js
├── nginx.conf
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```
Inside `src/`:
```
src/
  api/
  business/
  data/
  models/
  pages/
  components/
  utils/
```

## Contributing
1. Fork the repository
2. Create a feature branch:
```bash
git checkout -b feature/MyFeature
```
3. Make changes & write tests
4. Commit with descriptive message
5. Push branch & open a pull request

Follow:
- Code style (Prettier / ESLint)
- Write tests / ensure existing tests pass
- Update README & documentation for new features
- Ensure security & validation checks

## License & Acknowledgments
**License:** MIT License  
© 2025 [Your Name / Organization]

Acknowledgments:
- BMAD methodology and design patterns
- Open source libraries and templates used
- Contributors who inspired or assisted

## Contact
- GitHub: [Deep-Bhanushali](https://github.com/Deep-Bhanushali)  
- Email: [your-email@example.com]

Thank you for checking out **FarmMart-With-Bmad**! 🌱
