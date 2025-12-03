package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"

	"github.com/wealthpath/backend/internal/model"
	"github.com/wealthpath/backend/internal/repository"
)

type SavingsGoalService struct {
	repo *repository.SavingsGoalRepository
}

func NewSavingsGoalService(repo *repository.SavingsGoalRepository) *SavingsGoalService {
	return &SavingsGoalService{repo: repo}
}

type CreateSavingsGoalInput struct {
	Name         string          `json:"name"`
	TargetAmount decimal.Decimal `json:"targetAmount"`
	Currency     string          `json:"currency"`
	TargetDate   *time.Time      `json:"targetDate"`
	Color        string          `json:"color"`
	Icon         string          `json:"icon"`
}

type UpdateSavingsGoalInput struct {
	Name          string          `json:"name"`
	TargetAmount  decimal.Decimal `json:"targetAmount"`
	CurrentAmount decimal.Decimal `json:"currentAmount"`
	Currency      string          `json:"currency"`
	TargetDate    *time.Time      `json:"targetDate"`
	Color         string          `json:"color"`
	Icon          string          `json:"icon"`
}

type ContributeInput struct {
	Amount decimal.Decimal `json:"amount"`
}

func (s *SavingsGoalService) Create(ctx context.Context, userID uuid.UUID, input CreateSavingsGoalInput) (*model.SavingsGoal, error) {
	goal := &model.SavingsGoal{
		UserID:       userID,
		Name:         input.Name,
		TargetAmount: input.TargetAmount,
		Currency:     input.Currency,
		TargetDate:   input.TargetDate,
		Color:        input.Color,
		Icon:         input.Icon,
	}

	if goal.Currency == "" {
		goal.Currency = "USD"
	}
	if goal.Color == "" {
		goal.Color = "#3B82F6"
	}
	if goal.Icon == "" {
		goal.Icon = "piggy-bank"
	}

	if err := s.repo.Create(ctx, goal); err != nil {
		return nil, err
	}

	return goal, nil
}

func (s *SavingsGoalService) Get(ctx context.Context, id uuid.UUID) (*model.SavingsGoal, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *SavingsGoalService) List(ctx context.Context, userID uuid.UUID) ([]model.SavingsGoal, error) {
	return s.repo.List(ctx, userID)
}

func (s *SavingsGoalService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, input UpdateSavingsGoalInput) (*model.SavingsGoal, error) {
	goal, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if goal.UserID != userID {
		return nil, repository.ErrSavingsGoalNotFound
	}

	goal.Name = input.Name
	goal.TargetAmount = input.TargetAmount
	goal.CurrentAmount = input.CurrentAmount
	goal.Currency = input.Currency
	goal.TargetDate = input.TargetDate
	goal.Color = input.Color
	goal.Icon = input.Icon

	if err := s.repo.Update(ctx, goal); err != nil {
		return nil, err
	}

	return goal, nil
}

func (s *SavingsGoalService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *SavingsGoalService) Contribute(ctx context.Context, id uuid.UUID, userID uuid.UUID, amount decimal.Decimal) (*model.SavingsGoal, error) {
	if err := s.repo.AddContribution(ctx, id, userID, amount); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}
