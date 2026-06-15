# DevSto Staff Attendance System

A modern, full-stack role-based staff attendance and HR management system featuring real-time Socket.IO dashboard updates and deep AI integrations powered by Google Gemini and Pinecone vector databases.

### 🌐 Live Environments
- **Frontend (Live):** [https://devsto-interview-task-onge.vercel.app](https://devsto-interview-task-onge.vercel.app)
- **Backend (API Base):** [https://devsto-backend.onrender.com](https://devsto-backend.onrender.com)

---

## 🌟 Core Features & Functionality

### 1. Role-Based Access Control (RBAC)
The application defines three distinct roles, each with a tailored dashboard and feature set:
* **Admin**: Complete system access. Can manage all users (create, edit, delete), view system-wide attendance, manage the HR Knowledge Base, and view AI Data Analytics for the whole company.
* **Manager**: Mid-level access. Only sees and manages their assigned direct reports (Staff). They can view real-time attendance for their team and run AI Reports specific to their subordinates.
* **Staff**: Employee access. Can check in/out, view their attendance history/stats, interact with the HR Policy AI Assistant, and manage their profile.

### 2. Real-Time Attendance Engine
* **Live Dashboards**: As soon as a Staff member clicks "Check In" or "Check Out," the data is broadcast securely via WebSockets (`Socket.IO`). Admins and Managers see live "Online" and "Offline" counts shift immediately.
* **Hours & Overtime Calculation**: The system automatically tracks standard working hours (up to 8 hours/day) and automatically flags any extra hours as "Overtime".

### 3. AI HR Policy Assistant
* **RAG System (Retrieval-Augmented Generation)**: Admins can upload company PDF documents (like HR manuals and leave policies) into the "Knowledge Base".
* **Pinecone Integration**: Documents are chunked and converted into vector embeddings via Gemini, then securely stored in Pinecone.
* **Semantic Search**: Staff can ask natural language questions (e.g., *"How many sick days do I get?"*). The system retrieves the relevant policy chunks and Gemini constructs a conversational and accurate answer.

### 4. AI Data Analyst
* **Natural Language Queries on Live Data**: Admins and Managers have an "AI Data Assistant" tab. They can type questions like *"Who worked overtime last week?"* or *"What is our overall attendance rate?"*
* **Secure Context**: The backend automatically fetches real-time `Prisma` data (filtered strictly by the user's role/permissions) and asks Gemini to analyze the JSON structure to provide immediate data insights.

---

## ⚙️ Tech Stack
**Frontend:**
* React 18, TypeScript, Vite
* Tailwind CSS, Framer Motion (Micro-animations, Premium UI)
* React Router v6
* Axios (API requests), Socket.IO-Client
* React-Markdown (AI responses)

**Backend:**
* Node.js, Express, TypeScript
* Prisma ORM, PostgreSQL
* JSON Web Tokens (JWT), bcryptjs
* Socket.IO (WebSockets)
* Google GenAI (Gemini 2.5 Flash / Embeddings), Pinecone (Vector DB)
* Multer & PDF-Parse (Document Uploads)

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Authenticate and retrieve JWT token | None |
| POST | `/register`| Register new user | ADMIN |
| GET | `/me` | Get current authenticated user | ALL |
| PUT | `/profile` | Update current user's profile | ALL |

### Attendance (`/api/attendance`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| POST | `/check-in` | Record a check-in time | STAFF |
| POST | `/check-out`| Record a check-out time | STAFF |
| GET | `/history` | Get user's paginated attendance history| STAFF |
| GET | `/me/stats` | Get user's attendance statistics | STAFF |

### Manager Dashboard (`/api/manager`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/staff` | Get list of staff assigned to manager | MANAGER |
| GET | `/attendance`| Get today's attendance for manager's team | MANAGER |
| GET | `/attendance/stats` | Get live attendance stats for dashboard | MANAGER |
| GET | `/reports/ai`| Generate Gemini AI summary of team stats | MANAGER |

### Admin Dashboard (`/api/admin`)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/users` | Get all users in the system | ADMIN |
| POST | `/users` | Create a new user (Assign roles/managers)| ADMIN |
| PUT | `/users/:id` | Update an existing user | ADMIN |
| DELETE | `/users/:id` | Delete a user | ADMIN |
| GET | `/attendance/stats` | Get live attendance stats for entire company| ADMIN |
| GET | `/reports/ai`| Generate Gemini AI summary of company stats| ADMIN |

### AI Assistants (`/api/ai` & Admin KB)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| POST | `/ai/ask` | Ask HR policy questions (RAG search) | ALL |
| POST | `/ai/ask-data` | Ask questions about raw attendance data | ADMIN, MANAGER|
| POST | `/admin/documents` | Upload PDF/TXT to Pinecone Knowledge Base | ADMIN |

---

## 🔑 Required Data & Environment Variables

To run the application, you need the following API keys and services set up:

### Backend `.env` Requirements:
```env
# Database (PostgreSQL - Neon, Supabase, or Local)
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Server Settings
PORT=5000
JWT_SECRET="your_super_secret_jwt_key_here"

# Google Gemini API
GEMINI_API_KEY="AIzaSy..."

# Pinecone Vector Database
PINECONE_API_KEY="pcsk_..."
PINECONE_INDEX_NAME="devsto-hr-knowledge"
```

### Frontend `.env` Requirements:
```env
# Point this to your backend server (For local: http://localhost:5000/api)
VITE_API_URL="https://your-backend.onrender.com/api"

# Point this to your backend root for Socket.IO
VITE_SOCKET_URL="https://your-backend.onrender.com"
```

### Initial Database Setup (Prisma)
The database uses a PostgreSQL relational model. Ensure your database is initialized using Prisma:
```bash
npx prisma generate
npx prisma db push
```

**Note on initial Admin:** You may need to manually insert the first Admin user directly into the database (or use a Prisma seed script) in order to log in and begin creating Managers and Staff members via the UI.
