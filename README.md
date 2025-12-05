# WealthPath - Personal Finance Tracker

A full-stack personal finance management application built with Go (backend) and Next.js (frontend).

![WealthPath](https://img.shields.io/badge/WealthPath-Finance-8B5CF6)

## Features

### Core Features
- **Income/Expense Tracking** - Log and categorize your transactions
- **Budget Management** - Set spending limits by category with progress tracking
- **Savings Goals** - Create goals and track contributions
- **Monthly Dashboard** - Visual overview of your financial health

### Debt Management
- Track multiple loans and credit cards
- Interest rate tracking
- Payoff planning with amortization schedules
- Payment history

### Calculators
- Loan payment calculator
- Savings projection calculator with compound interest

## Tech Stack

### Backend
- **Go 1.22+** - Fast, reliable backend
- **Chi Router** - Lightweight HTTP router
- **PostgreSQL** - Reliable data storage
- **JWT** - Secure authentication

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Recharts** - Data visualization
- **TanStack Query** - Server state management
- **Zustand** - Client state management

## Getting Started

### Prerequisites
- Go 1.22+
- Node.js 18+
- PostgreSQL 14+

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE wealthpath;
```

2. Run migrations:
```bash
cd backend
psql -d wealthpath -f migrations/001_initial.sql
```

### Backend Setup

```bash
cd backend

# Install dependencies
go mod tidy

# Set environment variables
export DATABASE_URL="postgres://localhost:5432/wealthpath?sslmode=disable"
export JWT_SECRET="your-secret-key-change-in-production"

# Run the server
go run cmd/api/main.go
```

The API will be available at `http://localhost:8080`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Dashboard
- `GET /api/dashboard` - Get current month dashboard
- `GET /api/dashboard/monthly/{year}/{month}` - Get specific month

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction

### Budgets
- `GET /api/budgets` - List budgets with spent amounts
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget

### Savings Goals
- `GET /api/savings-goals` - List goals
- `POST /api/savings-goals` - Create goal
- `PUT /api/savings-goals/{id}` - Update goal
- `DELETE /api/savings-goals/{id}` - Delete goal
- `POST /api/savings-goals/{id}/contribute` - Add contribution

### Debt Management
- `GET /api/debts` - List debts
- `POST /api/debts` - Create debt
- `PUT /api/debts/{id}` - Update debt
- `DELETE /api/debts/{id}` - Delete debt
- `POST /api/debts/{id}/payment` - Make payment
- `GET /api/debts/{id}/payoff-plan` - Get payoff plan
- `GET /api/debts/calculator` - Interest calculator

## Project Structure

```
WealthPath/
├── backend/
│   ├── cmd/api/          # Application entry point
│   ├── internal/
│   │   ├── handler/      # HTTP handlers
│   │   ├── model/        # Data models
│   │   ├── repository/   # Database access
│   │   └── service/      # Business logic
│   ├── migrations/       # SQL migrations
│   └── go.mod
│
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js app router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities and API client
│   │   └── store/        # State management
│   ├── package.json
│   └── tailwind.config.ts
│
└── README.md
```

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://localhost:5432/wealthpath?sslmode=disable` |
| `JWT_SECRET` | Secret for JWT signing | `dev-secret-change-in-production` |
| `PORT` | Server port | `8080` |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `` (uses proxy) |

## License

MIT License - See LICENSE file for details.





