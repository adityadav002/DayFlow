# Dayflow

A real-time collaborative Kanban board application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io.

## Features

- **Real-time Collaboration**: Changes to tasks and boards are instantly reflected across all connected clients via Socket.io.
- **Drag & Drop**: Seamlessly move tasks between columns using `@dnd-kit`.
- **Authentication**: JWT-based authentication with HttpOnly cookies.
- **Responsive Design**: Beautiful UI built with Tailwind CSS, fully responsive across devices.
- **Task Management**: Create, update, delete, and reorder tasks. Add descriptions, due dates, priorities, and comments.
- **State Management**: Robust state handling with Redux Toolkit and `createAsyncThunk`.
- **Form Validation**: Type-safe schema validation using Zod on both frontend and backend.

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router DOM
- @dnd-kit (Drag and Drop)
- React Hook Form + Zod
- Socket.io Client
- Axios

### Backend
- Node.js & Express
- MongoDB & Mongoose
- Socket.io
- JSON Web Tokens (JWT)
- Zod (Validation)
- Multer (File Uploads)

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/kanban
   CLIENT_URL=http://localhost:5173
   ACCESS_TOKEN_SECRET=your_super_secret_access_token_key
   REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=7d
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture Notes

- **Fractional Indexing**: Tasks use a position value that allows for fast reordering without updating all other tasks in the column.
- **Optimistic Concurrency Control**: Tasks use a `version` field to prevent conflicting updates from multiple users.
- **Service Layer**: Business logic is separated into service files (`taskService.js`, etc.) to keep controllers thin and testable.
