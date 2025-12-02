package handler

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/wealthpath/backend/internal/service"
)

type OAuthHandler struct {
	userService *service.UserService
}

func NewOAuthHandler(userService *service.UserService) *OAuthHandler {
	return &OAuthHandler{userService: userService}
}

// FacebookLogin initiates the Facebook OAuth flow
func (h *OAuthHandler) FacebookLogin(w http.ResponseWriter, r *http.Request) {
	clientID := os.Getenv("FACEBOOK_APP_ID")
	redirectURI := os.Getenv("FACEBOOK_REDIRECT_URI")
	
	if clientID == "" || redirectURI == "" {
		respondError(w, http.StatusInternalServerError, "Facebook OAuth not configured")
		return
	}

	// Redirect to Facebook OAuth
	authURL := "https://www.facebook.com/v18.0/dialog/oauth?" +
		"client_id=" + clientID +
		"&redirect_uri=" + redirectURI +
		"&scope=email,public_profile" +
		"&response_type=code"

	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// FacebookCallback handles the OAuth callback from Facebook
func (h *OAuthHandler) FacebookCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		// Handle error - redirect to frontend with error
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:3000"
		}
		http.Redirect(w, r, frontendURL+"/login?error=oauth_failed", http.StatusTemporaryRedirect)
		return
	}

	// Exchange code for user info and login/register
	resp, err := h.userService.FacebookLogin(r.Context(), code)
	if err != nil {
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:3000"
		}
		http.Redirect(w, r, frontendURL+"/login?error="+err.Error(), http.StatusTemporaryRedirect)
		return
	}

	// Redirect to frontend with token
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	http.Redirect(w, r, frontendURL+"/login?token="+resp.Token, http.StatusTemporaryRedirect)
}

// FacebookLoginToken handles token-based Facebook login (for frontend SDK)
func (h *OAuthHandler) FacebookLoginToken(w http.ResponseWriter, r *http.Request) {
	var input struct {
		AccessToken string `json:"accessToken"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.AccessToken == "" {
		respondError(w, http.StatusBadRequest, "access token is required")
		return
	}

	resp, err := h.userService.FacebookLoginWithToken(r.Context(), input.AccessToken)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, resp)
}

