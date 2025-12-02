package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wealthpath/backend/internal/service"
)

type SavingsGoalHandler struct {
	service *service.SavingsGoalService
}

func NewSavingsGoalHandler(service *service.SavingsGoalService) *SavingsGoalHandler {
	return &SavingsGoalHandler{service: service}
}

func (h *SavingsGoalHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	var input service.CreateSavingsGoalInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	goal, err := h.service.Create(r.Context(), userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create savings goal")
		return
	}

	respondJSON(w, http.StatusCreated, goal)
}

func (h *SavingsGoalHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	goal, err := h.service.Get(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "savings goal not found")
		return
	}

	respondJSON(w, http.StatusOK, goal)
}

func (h *SavingsGoalHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	goals, err := h.service.List(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list savings goals")
		return
	}

	respondJSON(w, http.StatusOK, goals)
}

func (h *SavingsGoalHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input service.UpdateSavingsGoalInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	goal, err := h.service.Update(r.Context(), id, userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update savings goal")
		return
	}

	respondJSON(w, http.StatusOK, goal)
}

func (h *SavingsGoalHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.service.Delete(r.Context(), id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete savings goal")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *SavingsGoalHandler) Contribute(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input service.ContributeInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	goal, err := h.service.Contribute(r.Context(), id, userID, input.Amount)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to contribute")
		return
	}

	respondJSON(w, http.StatusOK, goal)
}

