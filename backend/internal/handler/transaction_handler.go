package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wealthpath/backend/internal/service"
)

type TransactionHandler struct {
	service *service.TransactionService
}

func NewTransactionHandler(service *service.TransactionService) *TransactionHandler {
	return &TransactionHandler{service: service}
}

func (h *TransactionHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	var input service.CreateTransactionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tx, err := h.service.Create(r.Context(), userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create transaction")
		return
	}

	respondJSON(w, http.StatusCreated, tx)
}

func (h *TransactionHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	tx, err := h.service.Get(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "transaction not found")
		return
	}

	respondJSON(w, http.StatusOK, tx)
}

func (h *TransactionHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	input := service.ListTransactionsInput{
		Page:     0,
		PageSize: 20,
	}

	if page := r.URL.Query().Get("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil {
			input.Page = p
		}
	}
	if pageSize := r.URL.Query().Get("pageSize"); pageSize != "" {
		if ps, err := strconv.Atoi(pageSize); err == nil {
			input.PageSize = ps
		}
	}
	if txType := r.URL.Query().Get("type"); txType != "" {
		input.Type = &txType
	}
	if category := r.URL.Query().Get("category"); category != "" {
		input.Category = &category
	}
	if startDate := r.URL.Query().Get("startDate"); startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			input.StartDate = &t
		}
	}
	if endDate := r.URL.Query().Get("endDate"); endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			input.EndDate = &t
		}
	}

	transactions, err := h.service.List(r.Context(), userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list transactions")
		return
	}

	respondJSON(w, http.StatusOK, transactions)
}

func (h *TransactionHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input service.UpdateTransactionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tx, err := h.service.Update(r.Context(), id, userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update transaction")
		return
	}

	respondJSON(w, http.StatusOK, tx)
}

func (h *TransactionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.service.Delete(r.Context(), id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete transaction")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

