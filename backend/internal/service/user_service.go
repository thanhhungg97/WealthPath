package service

import (
	"context"
	"errors"
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

// Supported currencies
var SupportedCurrencies = []string{"USD", "EUR", "GBP", "VND", "JPY", "CNY", "KRW", "SGD", "AUD", "CAD"}

type UpdateSettingsInput struct {
	Name     *string `json:"name"`
	Currency *string `json:"currency"`
}

func (s *UserService) UpdateSettings(ctx context.Context, userID uuid.UUID, input UpdateSettingsInput) (*model.User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if input.Name != nil && *input.Name != "" {
		user.Name = *input.Name
	}

	if input.Currency != nil && *input.Currency != "" {
		// Validate currency
		valid := false
		for _, c := range SupportedCurrencies {
			if c == *input.Currency {
				valid = true
				break
			}
		}
		if !valid {
			return nil, errors.New("unsupported currency")
		}
		user.Currency = *input.Currency
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
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

// ============ GENERIC OAUTH ============

// OAuthLogin handles OAuth login for any provider using authorization code
func (s *UserService) OAuthLogin(ctx context.Context, providerName, code string) (*AuthResponse, error) {
	provider, ok := OAuthProviders[providerName]
	if !ok {
		return nil, ErrOAuthFailed
	}

	accessToken, err := provider.ExchangeCode(code)
	if err != nil {
		return nil, err
	}

	return s.OAuthLoginWithToken(ctx, providerName, accessToken)
}

// OAuthLoginWithToken handles OAuth login using an access token
func (s *UserService) OAuthLoginWithToken(ctx context.Context, providerName, accessToken string) (*AuthResponse, error) {
	provider, ok := OAuthProviders[providerName]
	if !ok {
		return nil, ErrOAuthFailed
	}

	oauthUser, err := provider.GetUser(accessToken)
	if err != nil {
		return nil, err
	}

	// Check if user exists with this OAuth ID
	user, err := s.repo.GetByOAuth(ctx, providerName, oauthUser.ID)
	if err == nil {
		token, err := generateToken(user.ID)
		if err != nil {
			return nil, err
		}
		return &AuthResponse{Token: token, User: user}, nil
	}

	// Check if email exists (link accounts)
	if oauthUser.Email != "" {
		existingUser, err := s.repo.GetByEmail(ctx, oauthUser.Email)
		if err == nil {
			existingUser.OAuthProvider = &providerName
			existingUser.OAuthID = &oauthUser.ID
			if oauthUser.AvatarURL != "" {
				existingUser.AvatarURL = &oauthUser.AvatarURL
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
	user = &model.User{
		Email:         oauthUser.Email,
		Name:          oauthUser.Name,
		Currency:      "USD",
		OAuthProvider: &providerName,
		OAuthID:       &oauthUser.ID,
	}
	if oauthUser.AvatarURL != "" {
		user.AvatarURL = &oauthUser.AvatarURL
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

// Legacy methods for backward compatibility
func (s *UserService) FacebookLogin(ctx context.Context, code string) (*AuthResponse, error) {
	return s.OAuthLogin(ctx, "facebook", code)
}

func (s *UserService) FacebookLoginWithToken(ctx context.Context, accessToken string) (*AuthResponse, error) {
	return s.OAuthLoginWithToken(ctx, "facebook", accessToken)
}

func (s *UserService) GoogleLogin(ctx context.Context, code string) (*AuthResponse, error) {
	return s.OAuthLogin(ctx, "google", code)
}

func (s *UserService) GoogleLoginWithToken(ctx context.Context, accessToken string) (*AuthResponse, error) {
	return s.OAuthLoginWithToken(ctx, "google", accessToken)
}
