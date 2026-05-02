# StudyLabs Backend

Production-ready Node.js + Express + MongoDB API for the StudyLabs gamified learning platform.

## Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Google Cloud Console project with OAuth 2.0 credentials

### Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values (MongoDB URI, Google OAuth credentials, JWT secret)

# Start development server
npm run dev
```

The server will start at `http://localhost:5000`.

### Available URLs

| URL                                | Description               |
| ---------------------------------- | ------------------------- |
| `http://localhost:5000/api/health` | Health check              |
| `http://localhost:5000/api-docs`   | Swagger API Documentation |

## API Endpoints

### Auth

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| GET    | `/api/auth/google`          | Start Google OAuth       |
| GET    | `/api/auth/google/callback` | Google redirect callback |
| GET    | `/api/auth/me`              | Get current user         |
| PUT    | `/api/auth/role`            | Set role (first login)   |
| POST   | `/api/auth/logout`          | Logout                   |

### Courses

| Method | Endpoint                                 | Description               |
| ------ | ---------------------------------------- | ------------------------- |
| GET    | `/api/courses`                           | List published courses    |
| GET    | `/api/courses/:id`                       | Get course details        |
| POST   | `/api/courses`                           | Create course (multipart) |
| PUT    | `/api/courses/:id`                       | Update course             |
| DELETE | `/api/courses/:id`                       | Delete course             |
| GET    | `/api/courses/:id/nodes`                 | Get course nodes          |
| GET    | `/api/courses/:id/nodes/:nodeId/content` | Get lesson markdown       |
| PUT    | `/api/courses/:id/nodes/:nodeId/content` | Update lesson markdown    |
| GET    | `/api/courses/:id/analytics`             | Get course analytics      |

### Enrollments

| Method | Endpoint                            | Description                |
| ------ | ----------------------------------- | -------------------------- |
| POST   | `/api/enrollments`                  | Request enrollment         |
| GET    | `/api/enrollments/my`               | My enrollments             |
| GET    | `/api/enrollments/course/:courseId` | Course enrollment requests |
| PUT    | `/api/enrollments/:id/approve`      | Approve request            |
| PUT    | `/api/enrollments/:id/deny`         | Deny request               |

### Progress

| Method | Endpoint                         | Description     |
| ------ | -------------------------------- | --------------- |
| GET    | `/api/progress/stats`            | Student stats   |
| GET    | `/api/progress/course/:courseId` | Course progress |
| POST   | `/api/progress/complete-node`    | Complete a node |

### Quizzes

| Method | Endpoint                    | Description        |
| ------ | --------------------------- | ------------------ |
| GET    | `/api/quizzes/node/:nodeId` | Get quiz questions |
| POST   | `/api/quizzes/submit`       | Submit quiz        |

### AI

| Method | Endpoint                   | Description             |
| ------ | -------------------------- | ----------------------- |
| POST   | `/api/ai/generate-roadmap` | Generate roadmap (stub) |
| POST   | `/api/ai/evaluate-answer`  | Evaluate answer (stub)  |

## Architecture

- **Auth**: Passport.js (pluggable strategies) + JWT
- **Storage**: Abstract interface with local filesystem adapter (swap to S3 via `STORAGE_TYPE` env)
- **AI**: Stub service client — see [AI_SERVICE_CONTRACT.md](./AI_SERVICE_CONTRACT.md)
- **Docs**: Swagger/OpenAPI at `/api-docs`

## Testing

```bash
npm test
```

## Scripts

| Command       | Description                        |
| ------------- | ---------------------------------- |
| `npm run dev` | Development server with hot reload |
| `npm start`   | Production server                  |
| `npm test`    | Run tests                          |
