# OutreachHub

A multi-tenant SaaS platform with admin and user portals for managing business workspaces, contacts, templates, and campaigns.

## Project Structure

- `client/` - React.js frontend application
- `server/` - NestJS backend API server

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB (for database)

### Client Setup

```bash
cd client
npm install
npm start
```

### Server Setup

1. Copy `.env.example` to `.env` and update the environment variables:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Install dependencies and start the server:
   ```bash
   npm install
   npm run start:dev
   ```

## Available Scripts

### Client
- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production

### Server
- `npm run start` - Start in production mode
- `npm run start:dev` - Start in development mode
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run e2e tests

## About the Author

**Kevit Asif Alam**  
Full Stack Developer  
[GitHub](https://github.com/kevit-asif-alam)
