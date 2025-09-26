# 8. Unified Project Structure

```plaintext
farm-market/
├── apps/
│   ├── web/              # Next.js Frontend
│   │   ├── src/
│   │   └── package.json
│   └── api/              # Express.js Backend
│       ├── src/
│       └── package.json
├── packages/
│   ├── shared-types/     # Shared TypeScript interfaces
│   │   └── src/index.ts
│   ├── ui/               # Shared React components
│   │   └── src/
│   └── config/           # Shared configs (ESLint, etc.)
├── docs/
│   ├── prd.md
│   └── architecture.md
├── turborepo.json
└── package.json
```

***