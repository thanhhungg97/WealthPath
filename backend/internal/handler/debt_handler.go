package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"github.com/wealthpath/backend/internal/service"
)

type DebtHandler struct {
	service DebtServiceInterface
}

func NewDebtHandler(service DebtServiceInterface) *DebtHandler {
	return &DebtHandler{service: service}
}

func (h *DebtHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	var input service.CreateDebtInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	debt, err := h.service.Create(r.Context(), userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create debt")
		return
	}

	respondJSON(w, http.StatusCreated, debt)
}

func (h *DebtHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	debt, err := h.service.Get(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "debt not found")
		return
	}

	respondJSON(w, http.StatusOK, debt)
}

func (h *DebtHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	debts, err := h.service.List(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list debts")
		return
	}

	respondJSON(w, http.StatusOK, debts)
}

func (h *DebtHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input service.UpdateDebtInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	debt, err := h.service.Update(r.Context(), id, userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update debt")
		return
	}

	respondJSON(w, http.StatusOK, debt)
}

func (h *DebtHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.service.Delete(r.Context(), id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete debt")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *DebtHandler) MakePayment(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input service.MakePaymentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	debt, err := h.service.MakePayment(r.Context(), id, userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to make payment")
		return
	}

	respondJSON(w, http.StatusOK, debt)
}

func (h *DebtHandler) GetPayoffPlan(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	monthlyPayment := decimal.Zero
	if mp := r.URL.Query().Get("monthlyPayment"); mp != "" {
		if p, err := decimal.NewFromString(mp); err == nil {
			monthlyPayment = p
		}
	}

	plan, err := h.service.GetPayoffPlan(r.Context(), id, monthlyPayment)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get payoff plan")
		return
	}

	respondJSON(w, http.StatusOK, plan)
}

func (h *DebtHandler) InterestCalculator(w http.ResponseWriter, r *http.Request) {
	var input service.InterestCalculatorInput

	principal := r.URL.Query().Get("principal")
	if p, err := decimal.NewFromString(principal); err == nil {
		input.Principal = p
	}

	interestRate := r.URL.Query().Get("interestRate")
	if ir, err := decimal.NewFromString(interestRate); err == nil {
		input.InterestRate = ir
	}

	termMonths := r.URL.Query().Get("termMonths")
	if tm, err := decimal.NewFromString(termMonths); err == nil {
		input.TermMonths = int(tm.IntPart())
	}

	input.PaymentType = r.URL.Query().Get("paymentType")
	if input.PaymentType == "" {
		input.PaymentType = "fixed"
	}

	result, err := h.service.CalculateInterest(input)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid calculator input")
		return
	}

	respondJSON(w, http.StatusOK, result)
}
