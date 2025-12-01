const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

interface FetchOptions extends RequestInit {
  params?: Record<string, string>
}

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem("token", token)
    } else {
      localStorage.removeItem("token")
    }
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null
    if (!this.token) {
      this.token = localStorage.getItem("token")
    }
    return this.token
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...init } = options
    
    let url = `${API_BASE}${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    const token = this.getToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(url, { ...init, headers })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }))
      throw new Error(error.error || "Request failed")
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  // Auth
  async register(data: { email: string; password: string; name: string; currency?: string }) {
    return this.request<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Dashboard
  async getDashboard() {
    return this.request<DashboardData>("/api/dashboard")
  }

  async getMonthlyDashboard(year: number, month: number) {
    return this.request<DashboardData>(`/api/dashboard/monthly/${year}/${month}`)
  }

  // Transactions
  async getTransactions(params?: TransactionFilters) {
    return this.request<Transaction[]>("/api/transactions", { params: params as Record<string, string> })
  }

  async createTransaction(data: CreateTransactionInput) {
    return this.request<Transaction>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateTransaction(id: string, data: CreateTransactionInput) {
    return this.request<Transaction>(`/api/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteTransaction(id: string) {
    return this.request(`/api/transactions/${id}`, { method: "DELETE" })
  }

  // Budgets
  async getBudgets() {
    return this.request<BudgetWithSpent[]>("/api/budgets")
  }

  async createBudget(data: CreateBudgetInput) {
    return this.request<Budget>("/api/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateBudget(id: string, data: CreateBudgetInput) {
    return this.request<Budget>(`/api/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteBudget(id: string) {
    return this.request(`/api/budgets/${id}`, { method: "DELETE" })
  }

  // Savings Goals
  async getSavingsGoals() {
    return this.request<SavingsGoal[]>("/api/savings-goals")
  }

  async createSavingsGoal(data: CreateSavingsGoalInput) {
    return this.request<SavingsGoal>("/api/savings-goals", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateSavingsGoal(id: string, data: CreateSavingsGoalInput) {
    return this.request<SavingsGoal>(`/api/savings-goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteSavingsGoal(id: string) {
    return this.request(`/api/savings-goals/${id}`, { method: "DELETE" })
  }

  async contributeSavingsGoal(id: string, amount: number) {
    return this.request<SavingsGoal>(`/api/savings-goals/${id}/contribute`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  // Debts
  async getDebts() {
    return this.request<Debt[]>("/api/debts")
  }

  async createDebt(data: CreateDebtInput) {
    return this.request<Debt>("/api/debts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateDebt(id: string, data: CreateDebtInput) {
    return this.request<Debt>(`/api/debts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteDebt(id: string) {
    return this.request(`/api/debts/${id}`, { method: "DELETE" })
  }

  async makeDebtPayment(id: string, amount: number, date: string) {
    return this.request<Debt>(`/api/debts/${id}/payment`, {
      method: "POST",
      body: JSON.stringify({ amount, date }),
    })
  }

  async getPayoffPlan(id: string, monthlyPayment?: number) {
    const params: Record<string, string> = {}
    if (monthlyPayment) params.monthlyPayment = monthlyPayment.toString()
    return this.request<PayoffPlan>(`/api/debts/${id}/payoff-plan`, { params })
  }

  async calculateInterest(params: InterestCalculatorInput) {
    return this.request<InterestCalculatorResult>("/api/debts/calculator", {
      params: params as unknown as Record<string, string>,
    })
  }
}

export const api = new ApiClient()

// Types
export interface User {
  id: string
  email: string
  name: string
  currency: string
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: "income" | "expense"
  amount: string
  currency: string
  category: string
  description: string
  date: string
  createdAt: string
}

export interface TransactionFilters {
  type?: string
  category?: string
  startDate?: string
  endDate?: string
  page?: string
  pageSize?: string
}

export interface CreateTransactionInput {
  type: "income" | "expense"
  amount: number
  currency?: string
  category: string
  description?: string
  date: string
}

export interface Budget {
  id: string
  userId: string
  category: string
  amount: string
  currency: string
  period: string
  startDate: string
  endDate?: string
}

export interface BudgetWithSpent extends Budget {
  spent: string
  remaining: string
  percentage: number
}

export interface CreateBudgetInput {
  category: string
  amount: number
  currency?: string
  period?: string
  startDate: string
  endDate?: string
}

export interface SavingsGoal {
  id: string
  userId: string
  name: string
  targetAmount: string
  currentAmount: string
  currency: string
  targetDate?: string
  color: string
  icon: string
  createdAt: string
}

export interface CreateSavingsGoalInput {
  name: string
  targetAmount: number
  currency?: string
  targetDate?: string
  color?: string
  icon?: string
}

export interface Debt {
  id: string
  userId: string
  name: string
  type: string
  originalAmount: string
  currentBalance: string
  interestRate: string
  minimumPayment: string
  currency: string
  dueDay: number
  startDate: string
  expectedPayoff?: string
}

export interface CreateDebtInput {
  name: string
  type: string
  originalAmount: number
  currentBalance?: number
  interestRate: number
  minimumPayment: number
  currency?: string
  dueDay: number
  startDate: string
}

export interface PayoffPlan {
  debtId: string
  currentBalance: string
  monthlyPayment: string
  totalInterest: string
  totalPayment: string
  payoffDate: string
  monthsToPayoff: number
  amortizationPlan: AmortizationRow[]
}

export interface AmortizationRow {
  month: number
  payment: string
  principal: string
  interest: string
  remainingBalance: string
}

export interface InterestCalculatorInput {
  principal: number
  interestRate: number
  termMonths: number
  paymentType?: string
}

export interface InterestCalculatorResult {
  monthlyPayment: string
  totalPayment: string
  totalInterest: string
  payoffDate: string
}

export interface DashboardData {
  totalIncome: string
  totalExpenses: string
  netCashFlow: string
  totalSavings: string
  totalDebt: string
  budgetSummary: BudgetWithSpent[]
  savingsGoals: SavingsGoal[]
  recentTransactions: Transaction[]
  expensesByCategory: Record<string, string>
  incomeVsExpenses: MonthlyComparison[]
}

export interface MonthlyComparison {
  month: string
  income: string
  expenses: string
}

