package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"

	"github.com/wealthpath/backend/internal/model"
	"github.com/wealthpath/backend/internal/repository"
)

type DashboardService struct {
	transactionRepo *repository.TransactionRepository
	budgetRepo      *repository.BudgetRepository
	savingsRepo     *repository.SavingsGoalRepository
	debtRepo        *repository.DebtRepository
}

func NewDashboardService(
	transactionRepo *repository.TransactionRepository,
	budgetRepo *repository.BudgetRepository,
	savingsRepo *repository.SavingsGoalRepository,
	debtRepo *repository.DebtRepository,
) *DashboardService {
	return &DashboardService{
		transactionRepo: transactionRepo,
		budgetRepo:      budgetRepo,
		savingsRepo:     savingsRepo,
		debtRepo:        debtRepo,
	}
}

func (s *DashboardService) GetDashboard(ctx context.Context, userID uuid.UUID) (*model.DashboardData, error) {
	now := time.Now()
	return s.GetMonthlyDashboard(ctx, userID, now.Year(), int(now.Month()))
}

func (s *DashboardService) GetMonthlyDashboard(ctx context.Context, userID uuid.UUID, year, month int) (*model.DashboardData, error) {
	// Get monthly totals
	income, expenses, err := s.transactionRepo.GetMonthlyTotals(ctx, userID, year, month)
	if err != nil {
		return nil, err
	}

	// Get period dates for expenses by category
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	// Get expenses by category
	expensesByCategory, err := s.transactionRepo.GetExpensesByCategory(ctx, userID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Get budget summary with spent amounts
	budgets, err := s.budgetRepo.GetActiveForUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	budgetSummary := make([]model.BudgetWithSpent, len(budgets))
	for i, budget := range budgets {
		spent, err := s.transactionRepo.GetSpentByCategory(ctx, userID, budget.Category, startDate, endDate)
		if err != nil {
			return nil, err
		}

		remaining := budget.Amount.Sub(spent)
		percentage := float64(0)
		if !budget.Amount.IsZero() {
			percentage = spent.Div(budget.Amount).Mul(decimal.NewFromInt(100)).InexactFloat64()
		}

		budgetSummary[i] = model.BudgetWithSpent{
			Budget:     budget,
			Spent:      spent,
			Remaining:  remaining,
			Percentage: percentage,
		}
	}

	// Get savings goals
	savingsGoals, err := s.savingsRepo.List(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Get total savings
	totalSavings, err := s.savingsRepo.GetTotalSavings(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Get total debt
	totalDebt, err := s.debtRepo.GetTotalDebt(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Get recent transactions
	recentTransactions, err := s.transactionRepo.GetRecentTransactions(ctx, userID, 10)
	if err != nil {
		return nil, err
	}

	// Get income vs expenses for last 6 months
	incomeVsExpenses := make([]model.MonthlyComparison, 6)
	for i := 5; i >= 0; i-- {
		m := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC).AddDate(0, -i, 0)
		inc, exp, err := s.transactionRepo.GetMonthlyTotals(ctx, userID, m.Year(), int(m.Month()))
		if err != nil {
			return nil, err
		}
		incomeVsExpenses[5-i] = model.MonthlyComparison{
			Month:    m.Format("Jan 2006"),
			Income:   inc,
			Expenses: exp,
		}
	}

	return &model.DashboardData{
		TotalIncome:        income,
		TotalExpenses:      expenses,
		NetCashFlow:        income.Sub(expenses),
		TotalSavings:       totalSavings,
		TotalDebt:          totalDebt,
		BudgetSummary:      budgetSummary,
		SavingsGoals:       savingsGoals,
		RecentTransactions: recentTransactions,
		ExpensesByCategory: expensesByCategory,
		IncomeVsExpenses:   incomeVsExpenses,
	}, nil
}
