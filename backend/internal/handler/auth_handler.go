package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/wealthpath/backend/internal/model"
	"github.com/wealthpath/backend/internal/service"
)

// AuthServiceInterface for handler testing
type AuthServiceInterface interface {
	Register(ctx context.Context, input service.RegisterInput) (*service.AuthResponse, error)
	Login(ctx context.Context, input service.LoginInput) (*service.AuthResponse, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.User, error)
	UpdateSettings(ctx context.Context, userID uuid.UUID, input service.UpdateSettingsInput) (*model.User, error)
}

type AuthHandler struct {
	userService AuthServiceInterface
}

func NewAuthHandler(userService AuthServiceInterface) *AuthHandler {
	return &AuthHandler{userService: userService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input service.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Email == "" || input.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	resp, err := h.userService.Register(r.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			respondError(w, http.StatusConflict, "email already in use")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to register")
		return
	}

	respondJSON(w, http.StatusCreated, resp)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input service.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.userService.Login(r.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			respondError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to login")
		return
	}

	respondJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.userService.GetByID(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r.Context())
	if userID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var input service.UpdateSettingsInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.userService.UpdateSettings(r.Context(), userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update settings: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, user)
}
