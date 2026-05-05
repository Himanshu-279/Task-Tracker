# ⚡ TaskFlow — Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking team progress with role-based access control.

**Built for Ethara AI Software Engineer Assessment**

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| Frontend | `https://task-tracker-rose-kappa.vercel.app` |
| Backend API | `task-tracker-production-1d7e.up.railway.app` |

---

## ✨ Features

### Authentication
- JWT-based signup & login
- Secure password hashing (bcrypt)
- Persistent sessions via localStorage
- Auto-logout on token expiry

### Role-Based Access Control (RBAC)
| Feature | Admin | Project Admin | Member |
|---------|-------|---------------|--------|
| View all projects | ✅ | ✅ (own) | ✅ (assigned) |
| Create project | ✅ | ✅ | ✅ |
| Edit/delete project | ✅ | ✅ | ❌ |
| Add/remove members | ✅ | ✅ | ❌ |
| Create tasks | ✅ | ✅ | ✅ |
| Update any task | ✅ | ✅ | Own only |
| Delete tasks | ✅ | ✅ | Own only |
| Manage all users | ✅ | ❌ | ❌ |

> **Note:** First registered user automatically becomes Admin.

### Project Management
- Create, edit, delete projects
- Color-coded project cards
- Status: Active / On Hold / Completed / Archived
- Priority: Low / Medium / High / Critical
- Due dates
- Team member management with per-project roles

### Task Management
- Kanban board (To Do → In Progress → In Review → Done)
- Task assignment to project members
- Priority and due date tracking
- Tags/labels
- Comments with delete support
- Overdue detection (auto-highlighted in red)
- Filter by priority, assignee

### Dashboard
- Stats overview (projects, tasks, overdue count)
- Completion rate progress bar
- Tasks by status breakdown
- Recent tasks
- Upcoming tasks (due within 7 days)
- Admin: total user count

---

## 🛠 Tech Stack

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| dotenv | Environment config |

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 + Vite | UI framework & build tool |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Server state management |
| Tailwind CSS | Styling |
| Axios | HTTP client |
| react-hot-toast | Notifications |
| date-fns | Date formatting |

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT + RBAC middleware
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   └── Task.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   ├── tasks.js
│   │   │   └── dashboard.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   └── response.js
│   │   └── index.js               # Entry point
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/ProtectedRoute.jsx
    │   │   ├── layout/AppLayout.jsx
    │   │   ├── layout/Sidebar.jsx
    │   │   ├── projects/ProjectModal.jsx
    │   │   ├── projects/AddMemberModal.jsx
    │   │   └── tasks/TaskModal.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── ProjectDetail.jsx
    │   │   ├── MyTasks.jsx
    │   │   └── AdminUsers.jsx
    │   ├── utils/
    │   │   ├── api.js             # Axios instance
    │   │   └── helpers.js         # Date, status, priority utils
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    └── railway.toml
```

---

## ⚙️ API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/me` | Private | Update profile |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Private | Get all accessible projects |
| POST | `/api/projects` | Private | Create project |
| GET | `/api/projects/:id` | Member+ | Get project details |
| PUT | `/api/projects/:id` | Project Admin+ | Update project |
| DELETE | `/api/projects/:id` | Project Admin+ | Delete project + tasks |
| POST | `/api/projects/:id/members` | Project Admin+ | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Project Admin+ | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects/:pid/tasks` | Member+ | List tasks (with filters) |
| POST | `/api/projects/:pid/tasks` | Member+ | Create task |
| GET | `/api/projects/:pid/tasks/:id` | Member+ | Get task details |
| PUT | `/api/projects/:pid/tasks/:id` | Creator/Assignee/Admin | Update task |
| DELETE | `/api/projects/:pid/tasks/:id` | Creator/Admin | Delete task |
| POST | `/api/projects/:pid/tasks/:id/comments` | Member+ | Add comment |
| DELETE | `/api/projects/:pid/tasks/:id/comments/:cid` | Author/Admin | Delete comment |

### Dashboard & Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard` | Private | Dashboard stats |
| GET | `/api/users` | Admin only | List all users |
| PUT | `/api/users/:id/role` | Admin only | Change user role |

---

## 🏃 Running Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works) OR local MongoDB

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
cd team-task-manager
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskflow
JWT_SECRET=any_long_random_string_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

```bash
npm install
npm run dev
```
Backend starts at `http://localhost:5000`

### 3. Setup Frontend
```bash
cd ../frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm install
npm run dev
```
Frontend starts at `http://localhost:5173`

### 4. Test the app
Open `http://localhost:5173` — first signup creates an Admin account.

---

## 🌐 Deployment on Railway

### Step 1 — MongoDB Atlas Setup
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free cluster
2. Database Access → Add user with password
3. Network Access → Allow `0.0.0.0/0`
4. Connect → Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/taskflow`

### Step 2 — Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → New Project
2. **Deploy from GitHub repo** → select your repo
3. Set **Root Directory** to `backend`
4. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<your atlas connection string>
   JWT_SECRET=<generate a strong random secret>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
   ```
5. Railway auto-detects Node.js and deploys
6. Copy the generated backend URL (e.g. `https://taskflow-backend.up.railway.app`)

### Step 3 — Deploy Frontend on Railway
1. New Project → Deploy from same GitHub repo
2. Set **Root Directory** to `frontend`
3. Add Environment Variables:
   ```
   VITE_API_URL=https://YOUR-BACKEND.up.railway.app/api
   ```
4. Railway builds with `npm run build` and serves with `serve`
5. Copy the frontend URL

### Step 4 — Update CORS
Go back to backend service → update `FRONTEND_URL` variable to your actual frontend URL.

### Step 5 — Verify
- Visit frontend URL → signup → you're Admin
- Test all features: create project, add tasks, invite members

---

## 🔒 Security Features
- Passwords hashed with bcrypt (salt rounds: 12)
- JWT tokens expire in 7 days
- All protected routes require valid Bearer token
- Input validation on all endpoints (express-validator)
- MongoDB injection prevention via Mongoose
- CORS restricted to frontend URL in production
- Sensitive fields excluded from API responses (`password: select: false`)

---

## 👤 Demo Credentials
After deployment, sign up — first user = Admin automatically.

Or seed a demo user by calling:
```
POST /api/auth/signup
{ "name": "Admin User", "email": "admin@demo.com", "password": "password123" }
```

---

## 📝 License
MIT — Built for Ethara AI Engineering Assessment
