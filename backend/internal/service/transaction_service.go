package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"

	"github.com/wealthpath/backend/internal/model"
	"github.com/wealthpath/backend/internal/repository"
)

// DateString handles both "2006-01-02" and RFC3339 date formats
type DateString time.Time

func (d *DateString) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), "\"")
	if s == "" || s == "null" {
		return nil
	}

	// Try RFC3339 first
	t, err := time.Parse(time.RFC3339, s)
	if err == nil {
		*d = DateString(t)
		return nil
	}

	// Try date only format
	t, err = time.Parse("2006-01-02", s)
	if err == nil {
		*d = DateString(t)
		return nil
	}

	return err
}

func (d DateString) Time() time.Time {
	return time.Time(d)
}

type TransactionService struct {
	repo *repository.TransactionRepository
}

func NewTransactionService(repo *repository.TransactionRepository) *TransactionService {
	return &TransactionService{repo: repo}
}

type CreateTransactionInput struct {
	Type        model.TransactionType `json:"type"`
	Amount      decimal.Decimal       `json:"amount"`
	Currency    string                `json:"currency"`
	Category    string                `json:"category"`
	Description string                `json:"description"`
	Date        DateString            `json:"date"`
}

type UpdateTransactionInput struct {
	Type        model.TransactionType `json:"type"`
	Amount      decimal.Decimal       `json:"amount"`
	Currency    string                `json:"currency"`
	Category    string                `json:"category"`
	Description string                `json:"description"`
	Date        DateString            `json:"date"`
}

type ListTransactionsInput struct {
	Type      *string    `json:"type"`
	Category  *string    `json:"category"`
	StartDate *time.Time `json:"startDate"`
	EndDate   *time.Time `json:"endDate"`
	Page      int        `json:"page"`
	PageSize  int        `json:"pageSize"`
}

func (s *TransactionService) Create(ctx context.Context, userID uuid.UUID, input CreateTransactionInput) (*model.Transaction, error) {
	tx := &model.Transaction{
		UserID:      userID,
		Type:        input.Type,
		Amount:      input.Amount,
		Currency:    input.Currency,
		Category:    input.Category,
		Description: input.Description,
		Date:        input.Date.Time(),
	}

	if tx.Currency == "" {
		tx.Currency = "USD"
	}

	if err := s.repo.Create(ctx, tx); err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *TransactionService) Get(ctx context.Context, id uuid.UUID) (*model.Transaction, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *TransactionService) List(ctx context.Context, userID uuid.UUID, input ListTransactionsInput) ([]model.Transaction, error) {
	if input.PageSize <= 0 {
		input.PageSize = 20
	}
	if input.PageSize > 100 {
		input.PageSize = 100
	}

	filters := repository.TransactionFilters{
		Type:      input.Type,
		Category:  input.Category,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		Limit:     input.PageSize,
		Offset:    input.Page * input.PageSize,
	}

	return s.repo.List(ctx, userID, filters)
}

func (s *TransactionService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, input UpdateTransactionInput) (*model.Transaction, error) {
	tx, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if tx.UserID != userID {
		return nil, repository.ErrTransactionNotFound
	}

	tx.Type = input.Type
	tx.Amount = input.Amount
	tx.Currency = input.Currency
	tx.Category = input.Category
	tx.Description = input.Description
	tx.Date = input.Date.Time()

	if err := s.repo.Update(ctx, tx); err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *TransactionService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}
