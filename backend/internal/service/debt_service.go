package service

import (
	"context"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"

	"github.com/wealthpath/backend/internal/model"
	"github.com/wealthpath/backend/internal/repository"
)

type DebtService struct {
	repo *repository.DebtRepository
}

func NewDebtService(repo *repository.DebtRepository) *DebtService {
	return &DebtService{repo: repo}
}

type CreateDebtInput struct {
	Name           string          `json:"name"`
	Type           model.DebtType  `json:"type"`
	OriginalAmount decimal.Decimal `json:"originalAmount"`
	CurrentBalance decimal.Decimal `json:"currentBalance"`
	InterestRate   decimal.Decimal `json:"interestRate"` // APR as percentage (e.g., 5.5 for 5.5%)
	MinimumPayment decimal.Decimal `json:"minimumPayment"`
	Currency       string          `json:"currency"`
	DueDay         int             `json:"dueDay"`
	StartDate      time.Time       `json:"startDate"`
}

type UpdateDebtInput struct {
	Name           string          `json:"name"`
	Type           model.DebtType  `json:"type"`
	OriginalAmount decimal.Decimal `json:"originalAmount"`
	CurrentBalance decimal.Decimal `json:"currentBalance"`
	InterestRate   decimal.Decimal `json:"interestRate"`
	MinimumPayment decimal.Decimal `json:"minimumPayment"`
	Currency       string          `json:"currency"`
	DueDay         int             `json:"dueDay"`
	StartDate      time.Time       `json:"startDate"`
}

type MakePaymentInput struct {
	Amount decimal.Decimal `json:"amount"`
	Date   time.Time       `json:"date"`
}

type InterestCalculatorInput struct {
	Principal    decimal.Decimal `json:"principal"`
	InterestRate decimal.Decimal `json:"interestRate"` // APR as percentage
	TermMonths   int             `json:"termMonths"`
	PaymentType  string          `json:"paymentType"` // "fixed" or "minimum"
}

type InterestCalculatorResult struct {
	MonthlyPayment decimal.Decimal `json:"monthlyPayment"`
	TotalPayment   decimal.Decimal `json:"totalPayment"`
	TotalInterest  decimal.Decimal `json:"totalInterest"`
	PayoffDate     time.Time       `json:"payoffDate"`
}

func (s *DebtService) Create(ctx context.Context, userID uuid.UUID, input CreateDebtInput) (*model.Debt, error) {
	debt := &model.Debt{
		UserID:         userID,
		Name:           input.Name,
		Type:           input.Type,
		OriginalAmount: input.OriginalAmount,
		CurrentBalance: input.CurrentBalance,
		InterestRate:   input.InterestRate,
		MinimumPayment: input.MinimumPayment,
		Currency:       input.Currency,
		DueDay:         input.DueDay,
		StartDate:      input.StartDate,
	}

	if debt.Currency == "" {
		debt.Currency = "USD"
	}
	if debt.CurrentBalance.IsZero() {
		debt.CurrentBalance = debt.OriginalAmount
	}

	if err := s.repo.Create(ctx, debt); err != nil {
		return nil, err
	}

	return debt, nil
}

func (s *DebtService) Get(ctx context.Context, id uuid.UUID) (*model.Debt, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *DebtService) List(ctx context.Context, userID uuid.UUID) ([]model.Debt, error) {
	return s.repo.List(ctx, userID)
}

func (s *DebtService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, input UpdateDebtInput) (*model.Debt, error) {
	debt, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if debt.UserID != userID {
		return nil, repository.ErrDebtNotFound
	}

	debt.Name = input.Name
	debt.Type = input.Type
	debt.OriginalAmount = input.OriginalAmount
	debt.CurrentBalance = input.CurrentBalance
	debt.InterestRate = input.InterestRate
	debt.MinimumPayment = input.MinimumPayment
	debt.Currency = input.Currency
	debt.DueDay = input.DueDay
	debt.StartDate = input.StartDate

	if err := s.repo.Update(ctx, debt); err != nil {
		return nil, err
	}

	return debt, nil
}

func (s *DebtService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *DebtService) MakePayment(ctx context.Context, debtID uuid.UUID, userID uuid.UUID, input MakePaymentInput) (*model.Debt, error) {
	debt, err := s.repo.GetByID(ctx, debtID)
	if err != nil {
		return nil, err
	}

	if debt.UserID != userID {
		return nil, repository.ErrDebtNotFound
	}

	// Calculate interest portion (monthly rate)
	monthlyRate := debt.InterestRate.Div(decimal.NewFromInt(100)).Div(decimal.NewFromInt(12))
	interestPortion := debt.CurrentBalance.Mul(monthlyRate)
	principalPortion := input.Amount.Sub(interestPortion)

	if principalPortion.IsNegative() {
		principalPortion = decimal.Zero
		interestPortion = input.Amount
	}

	payment := &model.DebtPayment{
		DebtID:    debtID,
		Amount:    input.Amount,
		Principal: principalPortion,
		Interest:  interestPortion,
		Date:      input.Date,
	}

	if err := s.repo.RecordPayment(ctx, payment); err != nil {
		return nil, err
	}

	return s.repo.GetByID(ctx, debtID)
}

func (s *DebtService) GetPayoffPlan(ctx context.Context, id uuid.UUID, monthlyPayment decimal.Decimal) (*model.PayoffPlan, error) {
	debt, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if monthlyPayment.IsZero() {
		monthlyPayment = debt.MinimumPayment
	}

	plan := calculatePayoffPlan(debt, monthlyPayment)
	return plan, nil
}

func (s *DebtService) CalculateInterest(input InterestCalculatorInput) (*InterestCalculatorResult, error) {
	monthlyRate := input.InterestRate.Div(decimal.NewFromInt(100)).Div(decimal.NewFromInt(12))
	
	// Calculate fixed monthly payment using amortization formula
	// M = P * [r(1+r)^n] / [(1+r)^n - 1]
	r := monthlyRate.InexactFloat64()
	p := input.Principal.InexactFloat64()
	n := float64(input.TermMonths)

	var monthlyPayment float64
	if r == 0 {
		monthlyPayment = p / n
	} else {
		monthlyPayment = p * (r * math.Pow(1+r, n)) / (math.Pow(1+r, n) - 1)
	}

	totalPayment := monthlyPayment * n
	totalInterest := totalPayment - p

	return &InterestCalculatorResult{
		MonthlyPayment: decimal.NewFromFloat(monthlyPayment).Round(2),
		TotalPayment:   decimal.NewFromFloat(totalPayment).Round(2),
		TotalInterest:  decimal.NewFromFloat(totalInterest).Round(2),
		PayoffDate:     time.Now().AddDate(0, input.TermMonths, 0),
	}, nil
}

func calculatePayoffPlan(debt *model.Debt, monthlyPayment decimal.Decimal) *model.PayoffPlan {
	balance := debt.CurrentBalance
	monthlyRate := debt.InterestRate.Div(decimal.NewFromInt(100)).Div(decimal.NewFromInt(12))
	
	totalInterest := decimal.Zero
	totalPayment := decimal.Zero
	months := 0
	maxMonths := 360 // 30 years cap
	
	amortization := make([]model.AmortizationRow, 0)

	for balance.IsPositive() && months < maxMonths {
		months++
		
		interest := balance.Mul(monthlyRate).Round(2)
		payment := monthlyPayment
		
		if payment.GreaterThan(balance.Add(interest)) {
			payment = balance.Add(interest)
		}
		
		principal := payment.Sub(interest)
		balance = balance.Sub(principal)
		
		totalInterest = totalInterest.Add(interest)
		totalPayment = totalPayment.Add(payment)

		amortization = append(amortization, model.AmortizationRow{
			Month:            months,
			Payment:          payment,
			Principal:        principal,
			Interest:         interest,
			RemainingBalance: balance,
		})

		if balance.LessThanOrEqual(decimal.Zero) {
			break
		}
	}

	return &model.PayoffPlan{
		DebtID:           debt.ID,
		CurrentBalance:   debt.CurrentBalance,
		MonthlyPayment:   monthlyPayment,
		TotalInterest:    totalInterest,
		TotalPayment:     totalPayment,
		PayoffDate:       time.Now().AddDate(0, months, 0),
		MonthsToPayoff:   months,
		AmortizationPlan: amortization,
	}
}


