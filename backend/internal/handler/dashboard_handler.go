package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/wealthpath/backend/internal/service"
)

type DashboardHandler struct {
	service *service.DashboardService
}

func NewDashboardHandler(service *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

func (h *DashboardHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	data, err := h.service.GetDashboard(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get dashboard")
		return
	}

	respondJSON(w, http.StatusOK, data)
}

func (h *DashboardHandler) GetMonthlyDashboard(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())

	year, err := strconv.Atoi(chi.URLParam(r, "year"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid year")
		return
	}

	month, err := strconv.Atoi(chi.URLParam(r, "month"))
	if err != nil || month < 1 || month > 12 {
		respondError(w, http.StatusBadRequest, "invalid month")
		return
	}

	data, err := h.service.GetMonthlyDashboard(r.Context(), userID, year, month)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get dashboard")
		return
	}

	respondJSON(w, http.StatusOK, data)
}
