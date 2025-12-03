package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"github.com/wealthpath/backend/internal/model"
	"github.com/wealthpath/backend/internal/repository"
)

type RecurringService struct {
	recurringRepo   *repository.RecurringRepository
	transactionRepo *repository.TransactionRepository
}

func NewRecurringService(recurringRepo *repository.RecurringRepository, transactionRepo *repository.TransactionRepository) *RecurringService {
	return &RecurringService{
		recurringRepo:   recurringRepo,
		transactionRepo: transactionRepo,
	}
}

type CreateRecurringInput struct {
	Type        model.TransactionType      `json:"type"`
	Amount      decimal.Decimal            `json:"amount"`
	Currency    string                     `json:"currency"`
	Category    string                     `json:"category"`
	Description string                     `json:"description"`
	Frequency   model.RecurringFrequency   `json:"frequency"`
	StartDate   time.Time                  `json:"startDate"`
	EndDate     *time.Time                 `json:"endDate"`
}

type UpdateRecurringInput struct {
	Type        *model.TransactionType     `json:"type"`
	Amount      *decimal.Decimal           `json:"amount"`
	Currency    *string                    `json:"currency"`
	Category    *string                    `json:"category"`
	Description *string                    `json:"description"`
	Frequency   *model.RecurringFrequency  `json:"frequency"`
	StartDate   *time.Time                 `json:"startDate"`
	EndDate     *time.Time                 `json:"endDate"`
	IsActive    *bool                      `json:"isActive"`
}

func (s *RecurringService) Create(ctx context.Context, userID uuid.UUID, input CreateRecurringInput) (*model.RecurringTransaction, error) {
	if input.Amount.LessThanOrEqual(decimal.Zero) {
		return nil, errors.New("amount must be greater than zero")
	}

	if input.Type != model.TransactionTypeIncome && input.Type != model.TransactionTypeExpense {
		return nil, errors.New("type must be 'income' or 'expense'")
	}

	if !isValidFrequency(input.Frequency) {
		return nil, errors.New("invalid frequency")
	}

	rt := &model.RecurringTransaction{
		UserID:         userID,
		Type:           input.Type,
		Amount:         input.Amount,
		Currency:       input.Currency,
		Category:       input.Category,
		Description:    input.Description,
		Frequency:      input.Frequency,
		StartDate:      input.StartDate,
		EndDate:        input.EndDate,
		NextOccurrence: input.StartDate,
		IsActive:       true,
	}

	if rt.Currency == "" {
		rt.Currency = "USD"
	}

	if err := s.recurringRepo.Create(ctx, rt); err != nil {
		return nil, err
	}

	return rt, nil
}

func (s *RecurringService) GetByUserID(ctx context.Context, userID uuid.UUID) ([]model.RecurringTransaction, error) {
	return s.recurringRepo.GetByUserID(ctx, userID)
}

func (s *RecurringService) GetByID(ctx context.Context, userID, id uuid.UUID) (*model.RecurringTransaction, error) {
	rt, err := s.recurringRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rt.UserID != userID {
		return nil, errors.New("recurring transaction not found")
	}
	return rt, nil
}

func (s *RecurringService) Update(ctx context.Context, userID, id uuid.UUID, input UpdateRecurringInput) (*model.RecurringTransaction, error) {
	rt, err := s.recurringRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rt.UserID != userID {
		return nil, errors.New("recurring transaction not found")
	}

	if input.Type != nil {
		rt.Type = *input.Type
	}
	if input.Amount != nil {
		if input.Amount.LessThanOrEqual(decimal.Zero) {
			return nil, errors.New("amount must be greater than zero")
		}
		rt.Amount = *input.Amount
	}
	if input.Currency != nil {
		rt.Currency = *input.Currency
	}
	if input.Category != nil {
		rt.Category = *input.Category
	}
	if input.Description != nil {
		rt.Description = *input.Description
	}
	if input.Frequency != nil {
		if !isValidFrequency(*input.Frequency) {
			return nil, errors.New("invalid frequency")
		}
		rt.Frequency = *input.Frequency
		// Recalculate next occurrence when frequency changes
		rt.NextOccurrence = calculateNextOccurrence(rt.StartDate, *input.Frequency)
	}
	if input.StartDate != nil {
		rt.StartDate = *input.StartDate
		rt.NextOccurrence = calculateNextOccurrence(*input.StartDate, rt.Frequency)
	}
	if input.EndDate != nil {
		rt.EndDate = input.EndDate
	}
	if input.IsActive != nil {
		rt.IsActive = *input.IsActive
	}

	if err := s.recurringRepo.Update(ctx, rt); err != nil {
		return nil, err
	}

	return rt, nil
}

func (s *RecurringService) Delete(ctx context.Context, userID, id uuid.UUID) error {
	rt, err := s.recurringRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if rt.UserID != userID {
		return errors.New("recurring transaction not found")
	}
	return s.recurringRepo.Delete(ctx, id)
}

func (s *RecurringService) Pause(ctx context.Context, userID, id uuid.UUID) (*model.RecurringTransaction, error) {
	isActive := false
	return s.Update(ctx, userID, id, UpdateRecurringInput{IsActive: &isActive})
}

func (s *RecurringService) Resume(ctx context.Context, userID, id uuid.UUID) (*model.RecurringTransaction, error) {
	isActive := true
	return s.Update(ctx, userID, id, UpdateRecurringInput{IsActive: &isActive})
}

func (s *RecurringService) GetUpcoming(ctx context.Context, userID uuid.UUID, limit int) ([]model.UpcomingBill, error) {
	if limit <= 0 {
		limit = 5
	}
	return s.recurringRepo.GetUpcoming(ctx, userID, limit)
}

// ProcessDueTransactions generates transactions for all due recurring items
// This should be called by a cron job
func (s *RecurringService) ProcessDueTransactions(ctx context.Context) (int, error) {
	now := time.Now()
	dueItems, err := s.recurringRepo.GetDueTransactions(ctx, now)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, rt := range dueItems {
		// Generate the transaction
		tx := &model.Transaction{
			UserID:      rt.UserID,
			Type:        rt.Type,
			Amount:      rt.Amount,
			Currency:    rt.Currency,
			Category:    rt.Category,
			Description: rt.Description + " (recurring)",
			Date:        rt.NextOccurrence,
		}

		if err := s.transactionRepo.Create(ctx, tx); err != nil {
			continue // Log error but continue processing
		}

		// Calculate next occurrence
		nextOccurrence := calculateNextOccurrence(rt.NextOccurrence, rt.Frequency)

		// Update the recurring transaction
		if err := s.recurringRepo.UpdateLastGenerated(ctx, rt.ID, now, nextOccurrence); err != nil {
			continue
		}

		count++
	}

	return count, nil
}

func isValidFrequency(f model.RecurringFrequency) bool {
	switch f {
	case model.FrequencyDaily, model.FrequencyWeekly, model.FrequencyBiweekly,
		model.FrequencyMonthly, model.FrequencyYearly:
		return true
	}
	return false
}

func calculateNextOccurrence(from time.Time, frequency model.RecurringFrequency) time.Time {
	switch frequency {
	case model.FrequencyDaily:
		return from.AddDate(0, 0, 1)
	case model.FrequencyWeekly:
		return from.AddDate(0, 0, 7)
	case model.FrequencyBiweekly:
		return from.AddDate(0, 0, 14)
	case model.FrequencyMonthly:
		return from.AddDate(0, 1, 0)
	case model.FrequencyYearly:
		return from.AddDate(1, 0, 0)
	default:
		return from.AddDate(0, 1, 0) // Default to monthly
	}
}

