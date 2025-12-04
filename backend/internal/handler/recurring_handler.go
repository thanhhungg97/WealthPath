package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wealthpath/backend/internal/service"
)

type RecurringHandler struct {
	recurringService RecurringServiceInterface
}

func NewRecurringHandler(recurringService RecurringServiceInterface) *RecurringHandler {
	return &RecurringHandler{recurringService: recurringService}
}

func (h *RecurringHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var input service.CreateRecurringInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	rt, err := h.recurringService.Create(r.Context(), userID, input)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, rt)
}

func (h *RecurringHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	items, err := h.recurringService.GetByUserID(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get recurring transactions")
		return
	}

	respondJSON(w, http.StatusOK, items)
}

func (h *RecurringHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	rt, err := h.recurringService.GetByID(r.Context(), userID, id)
	if err != nil {
		respondError(w, http.StatusNotFound, "recurring transaction not found")
		return
	}

	respondJSON(w, http.StatusOK, rt)
}

func (h *RecurringHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input service.UpdateRecurringInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	rt, err := h.recurringService.Update(r.Context(), userID, id, input)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, rt)
}

func (h *RecurringHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.recurringService.Delete(r.Context(), userID, id); err != nil {
		respondError(w, http.StatusNotFound, "recurring transaction not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *RecurringHandler) Pause(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	rt, err := h.recurringService.Pause(r.Context(), userID, id)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, rt)
}

func (h *RecurringHandler) Resume(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	rt, err := h.recurringService.Resume(r.Context(), userID, id)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, rt)
}

func (h *RecurringHandler) Upcoming(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	items, err := h.recurringService.GetUpcoming(r.Context(), userID, 10)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get upcoming items")
		return
	}

	respondJSON(w, http.StatusOK, items)
}
