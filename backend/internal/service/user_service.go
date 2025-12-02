package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/wealthpath/backend/internal/model"
	"github.com/wealthpath/backend/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailTaken         = errors.New("email already taken")
	ErrOAuthFailed        = errors.New("OAuth authentication failed")
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Currency string `json:"currency"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
}

func (s *UserService) Register(ctx context.Context, input RegisterInput) (*AuthResponse, error) {
	exists, err := s.repo.EmailExists(ctx, input.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	hashStr := string(hash)
	user := &model.User{
		Email:        input.Email,
		PasswordHash: &hashStr,
		Name:         input.Name,
		Currency:     input.Currency,
	}
	if user.Currency == "" {
		user.Currency = "USD"
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	token, err := generateToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{Token: token, User: user}, nil
}

func (s *UserService) Login(ctx context.Context, input LoginInput) (*AuthResponse, error) {
	user, err := s.repo.GetByEmail(ctx, input.Email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// Check if user has a password (not OAuth-only user)
	if user.PasswordHash == nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := generateToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{Token: token, User: user}, nil
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	return s.repo.GetByID(ctx, id)
}

func generateToken(userID uuid.UUID) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-in-production"
	}

	claims := jwt.MapClaims{
		"sub": userID.String(),
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(),
		"iat": time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ValidateToken(tokenString string) (uuid.UUID, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-in-production"
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return uuid.Nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.Nil, errors.New("invalid claims")
	}

	userID, err := uuid.Parse(claims["sub"].(string))
	if err != nil {
		return uuid.Nil, errors.New("invalid user id in token")
	}

	return userID, nil
}

// FacebookLogin exchanges an authorization code for user info and logs in or registers
func (s *UserService) FacebookLogin(ctx context.Context, code string) (*AuthResponse, error) {
	// Exchange code for access token
	accessToken, err := s.exchangeFacebookCode(code)
	if err != nil {
		return nil, err
	}

	return s.FacebookLoginWithToken(ctx, accessToken)
}

// FacebookLoginWithToken authenticates using a Facebook access token
func (s *UserService) FacebookLoginWithToken(ctx context.Context, accessToken string) (*AuthResponse, error) {
	// Get user info from Facebook
	fbUser, err := s.getFacebookUser(accessToken)
	if err != nil {
		return nil, err
	}

	// Check if user already exists with this Facebook ID
	user, err := s.repo.GetByOAuth(ctx, "facebook", fbUser.ID)
	if err == nil {
		// User exists, generate token
		token, err := generateToken(user.ID)
		if err != nil {
			return nil, err
		}
		return &AuthResponse{Token: token, User: user}, nil
	}

	// Check if email already exists (user registered with email/password)
	if fbUser.Email != "" {
		existingUser, err := s.repo.GetByEmail(ctx, fbUser.Email)
		if err == nil {
			// Link Facebook to existing account
			provider := "facebook"
			existingUser.OAuthProvider = &provider
			existingUser.OAuthID = &fbUser.ID
			if fbUser.Picture.Data.URL != "" {
				existingUser.AvatarURL = &fbUser.Picture.Data.URL
			}
			if err := s.repo.Update(ctx, existingUser); err != nil {
				return nil, err
			}
			token, err := generateToken(existingUser.ID)
			if err != nil {
				return nil, err
			}
			return &AuthResponse{Token: token, User: existingUser}, nil
		}
	}

	// Create new user
	provider := "facebook"
	user = &model.User{
		Email:         fbUser.Email,
		Name:          fbUser.Name,
		Currency:      "USD",
		OAuthProvider: &provider,
		OAuthID:       &fbUser.ID,
	}
	if fbUser.Picture.Data.URL != "" {
		user.AvatarURL = &fbUser.Picture.Data.URL
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	token, err := generateToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{Token: token, User: user}, nil
}

type facebookUser struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture struct {
		Data struct {
			URL string `json:"url"`
		} `json:"data"`
	} `json:"picture"`
}

func (s *UserService) exchangeFacebookCode(code string) (string, error) {
	clientID := os.Getenv("FACEBOOK_APP_ID")
	clientSecret := os.Getenv("FACEBOOK_APP_SECRET")
	redirectURI := os.Getenv("FACEBOOK_REDIRECT_URI")

	tokenURL := fmt.Sprintf(
		"https://graph.facebook.com/v18.0/oauth/access_token?client_id=%s&redirect_uri=%s&client_secret=%s&code=%s",
		clientID, url.QueryEscape(redirectURI), clientSecret, code,
	)

	resp, err := http.Get(tokenURL)
	if err != nil {
		return "", ErrOAuthFailed
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", ErrOAuthFailed
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		Error       struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", ErrOAuthFailed
	}

	if tokenResp.AccessToken == "" {
		return "", ErrOAuthFailed
	}

	return tokenResp.AccessToken, nil
}

func (s *UserService) getFacebookUser(accessToken string) (*facebookUser, error) {
	userURL := fmt.Sprintf(
		"https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=%s",
		accessToken,
	)

	resp, err := http.Get(userURL)
	if err != nil {
		return nil, ErrOAuthFailed
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, ErrOAuthFailed
	}

	var fbUser facebookUser
	if err := json.Unmarshal(body, &fbUser); err != nil {
		return nil, ErrOAuthFailed
	}

	if fbUser.ID == "" {
		return nil, ErrOAuthFailed
	}

	return &fbUser, nil
}


