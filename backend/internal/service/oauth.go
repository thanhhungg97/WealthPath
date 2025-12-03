package service

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
)

// OAuthProvider defines the interface for OAuth providers
type OAuthProvider interface {
	Name() string
	AuthURL() string
	ExchangeCode(code string) (string, error)
	GetUser(accessToken string) (*OAuthUser, error)
}

// OAuthUser represents a user from any OAuth provider
type OAuthUser struct {
	ID        string
	Email     string
	Name      string
	AvatarURL string
}

// ============ FACEBOOK ============

type FacebookProvider struct{}

func (p *FacebookProvider) Name() string { return "facebook" }

func (p *FacebookProvider) AuthURL() string {
	clientID := os.Getenv("FACEBOOK_APP_ID")
	redirectURI := os.Getenv("FACEBOOK_REDIRECT_URI")

	// Validate required environment variables
	if clientID == "" || redirectURI == "" {
		return ""
	}

	return "https://www.facebook.com/v18.0/dialog/oauth?" +
		"client_id=" + clientID +
		"&redirect_uri=" + url.QueryEscape(redirectURI) +
		"&scope=email,public_profile" +
		"&response_type=code"
}

func (p *FacebookProvider) ExchangeCode(code string) (string, error) {
	clientID := os.Getenv("FACEBOOK_APP_ID")
	clientSecret := os.Getenv("FACEBOOK_APP_SECRET")
	redirectURI := os.Getenv("FACEBOOK_REDIRECT_URI")

	tokenURL := "https://graph.facebook.com/v18.0/oauth/access_token?" +
		"client_id=" + clientID +
		"&redirect_uri=" + url.QueryEscape(redirectURI) +
		"&client_secret=" + clientSecret +
		"&code=" + code

	resp, err := http.Get(tokenURL)
	if err != nil {
		return "", ErrOAuthFailed
	}
	defer func() { _ = resp.Body.Close() }()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil || tokenResp.AccessToken == "" {
		return "", ErrOAuthFailed
	}
	return tokenResp.AccessToken, nil
}

func (p *FacebookProvider) GetUser(accessToken string) (*OAuthUser, error) {
	userURL := "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=" + accessToken

	resp, err := http.Get(userURL)
	if err != nil {
		return nil, ErrOAuthFailed
	}
	defer func() { _ = resp.Body.Close() }()

	var fbUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture struct {
			Data struct {
				URL string `json:"url"`
			} `json:"data"`
		} `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&fbUser); err != nil || fbUser.ID == "" {
		return nil, ErrOAuthFailed
	}

	return &OAuthUser{
		ID:        fbUser.ID,
		Email:     fbUser.Email,
		Name:      fbUser.Name,
		AvatarURL: fbUser.Picture.Data.URL,
	}, nil
}

// ============ GOOGLE ============

type GoogleProvider struct{}

func (p *GoogleProvider) Name() string { return "google" }

func (p *GoogleProvider) AuthURL() string {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")

	// Validate required environment variables
	if clientID == "" || redirectURI == "" {
		return ""
	}

	return "https://accounts.google.com/o/oauth2/v2/auth?" +
		"client_id=" + clientID +
		"&redirect_uri=" + url.QueryEscape(redirectURI) +
		"&scope=" + url.QueryEscape("openid email profile") +
		"&response_type=code" +
		"&access_type=offline"
}

func (p *GoogleProvider) ExchangeCode(code string) (string, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil {
		return "", ErrOAuthFailed
	}
	defer func() { _ = resp.Body.Close() }()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil || tokenResp.AccessToken == "" {
		return "", ErrOAuthFailed
	}
	return tokenResp.AccessToken, nil
}

func (p *GoogleProvider) GetUser(accessToken string) (*OAuthUser, error) {
	req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return nil, ErrOAuthFailed
	}
	defer func() { _ = resp.Body.Close() }()

	body, _ := io.ReadAll(resp.Body)

	var gUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if err := json.Unmarshal(body, &gUser); err != nil || gUser.ID == "" {
		return nil, ErrOAuthFailed
	}

	return &OAuthUser{
		ID:        gUser.ID,
		Email:     gUser.Email,
		Name:      gUser.Name,
		AvatarURL: gUser.Picture,
	}, nil
}

// Provider registry
var OAuthProviders = map[string]OAuthProvider{
	"facebook": &FacebookProvider{},
	"google":   &GoogleProvider{},
}
