# Live tournaments.in — Backend API

REST API server for Live tournaments.in tournament operations, squad registrations, inquiries, sponsor management, and authentication with Email OTP.

## Architecture

- **`server.js`**: Main Express server setup with CORS, JSON body parser, and route mounting.
- **`config/db.js`**: Centralized MongoDB Atlas connection pooling with graceful fallback.
- **`controllers/`**:
  - `auth.controller.js`: User login, registration, and Email OTP verification.
  - `registrations.controller.js`: Squad & player registrations CRUD.
  - `inquiries.controller.js`: Support inquiries & tickets handling.
  - `sponsors.controller.js`: Public sponsors & brand requests.
- **`routes/`**: Express Router endpoints mounted under `/api/*`.

## Running the Backend

```bash
# From repository root:
npm run server

# Or inside backend directory:
cd backend
npm install
npm run dev
```

Server starts at `http://localhost:5000` with health check available at `http://localhost:5000/api/health`.
