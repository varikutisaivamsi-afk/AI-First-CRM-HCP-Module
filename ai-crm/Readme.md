# AI-First CRM for Healthcare Providers (HCP)

A full-stack CRM application with a React frontend and FastAPI backend, designed for managing healthcare provider interactions with AI-powered chat capabilities.

## Project Structure

```
ai-crm/
├── backend/
│   └── venv/              # Python virtual environment
│       ├── main.py         # FastAPI application entry point
│       ├── models.py       # SQLAlchemy database models
│       ├── schemas.py      # Pydantic request/response schemas
│       ├── database.py     # Database connection configuration
│       ├── agent.py        # AI agent integration
│       ├── tools.py        # Utility functions
│       └── requirements.txt # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── App.js          # Main React component
    │   ├── index.js        # React entry point
    │   ├── store/          # Redux store configuration
    │   └── pages/          # React pages
    └── package.json        # Node.js dependencies
```

## Prerequisites

- **Node.js** (v18+) and npm
- **Python** (v3.10+)
- **PostgreSQL** (v14+)

---

## Running the Backend

### 1. Navigate to the backend directory

```powershell
cd backend\venv
```

### 2. Activate the virtual environment

```powershell
# On Windows
.\Scripts\activate

# Or using python directly
python -m venv .venv
.\.venv\Scripts\Activate
```

### 3. Install Python dependencies (if not already installed)

```powershell
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in `backend/venv/` with:

```env
# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/crm_db

# AI API (Groq)
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Start the backend server

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: **http://localhost:8000**

- API docs: **http://localhost:8000/docs**
- Health check: **http://localhost:8000/**

---

## Running the Frontend

### 1. Navigate to the frontend directory

```powershell
cd frontend
```

### 2. Install Node.js dependencies (if not already installed)

```powershell
npm install
```

### 3. Start the development server

```powershell
npm start
```

The frontend will open at: **http://localhost:3000**

---

## Running Both Services

You need **two separate terminals**:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 | `backend\venv` | `uvicorn main:app --reload --port 8000` |
| 2 | `frontend` | `npm start` |

> **Note:** The frontend is configured to proxy API requests to `http://localhost:8000` (configured in `frontend/package.json`).

---

## Technology Stack

### Frontend
- **React 18** — UI framework
- **Redux Toolkit** — State management
- **React Router** — Navigation
- **Axios** — HTTP client

### Backend
- **FastAPI** — Python web framework
- **SQLAlchemy** — ORM
- **PostgreSQL** — Database
- **LangChain + Groq** — AI integration

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/interactions` | Create interaction |
| `GET` | `/interactions` | List interactions |
| `GET` | `/interactions/{id}` | Get interaction by ID |
| `POST` | `/chat` | Chat with AI agent |

---

## Troubleshooting

### PostgreSQL connection error
Ensure PostgreSQL is running and the `DATABASE_URL` in `.env` is correct.

### CORS errors
The backend is configured to allow `http://localhost:3000`. If using a different port, update the CORS middleware in `main.py`.

### Missing Python packages
```powershell
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv pydantic httpx langchain langchain-groq
```

### Node modules issues
```powershell
# Remove node_modules and reinstall
rmdir /s /node_modules
del package-lock.json
npm install
```