package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wealthpath/backend/internal/service"
)

type BudgetHandler struct {
	service BudgetServiceInterface
}

func NewBudgetHandler(service BudgetServiceInterface) *BudgetHandler {
	return &BudgetHandler{service: service}
}

func (h *BudgetHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	var input service.CreateBudgetInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	budget, err := h.service.Create(r.Context(), userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create budget")
		return
	}

	respondJSON(w, http.StatusCreated, budget)
}

func (h *BudgetHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	budget, err := h.service.Get(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "budget not found")
		return
	}

	respondJSON(w, http.StatusOK, budget)
}

func (h *BudgetHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	budgets, err := h.service.ListWithSpent(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list budgets")
		return
	}

	respondJSON(w, http.StatusOK, budgets)
}

func (h *BudgetHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input service.UpdateBudgetInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	budget, err := h.service.Update(r.Context(), id, userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update budget")
		return
	}

	respondJSON(w, http.StatusOK, budget)
}

func (h *BudgetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.service.Delete(r.Context(), id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete budget")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
