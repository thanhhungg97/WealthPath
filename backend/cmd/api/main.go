package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"

	"github.com/wealthpath/backend/internal/handler"
	"github.com/wealthpath/backend/internal/repository"
	"github.com/wealthpath/backend/internal/service"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://localhost:5432/wealthpath?sslmode=disable"
	}

	db, err := sqlx.Connect("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	budgetRepo := repository.NewBudgetRepository(db)
	savingsRepo := repository.NewSavingsGoalRepository(db)
	debtRepo := repository.NewDebtRepository(db)

	// Initialize services
	userService := service.NewUserService(userRepo)
	transactionService := service.NewTransactionService(transactionRepo)
	budgetService := service.NewBudgetService(budgetRepo)
	savingsService := service.NewSavingsGoalService(savingsRepo)
	debtService := service.NewDebtService(debtRepo)
	dashboardService := service.NewDashboardService(transactionRepo, budgetRepo, savingsRepo, debtRepo)
	aiService := service.NewAIService(transactionService, budgetService, savingsService)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(userService)
	oauthHandler := handler.NewOAuthHandler(userService)
	transactionHandler := handler.NewTransactionHandler(transactionService)
	budgetHandler := handler.NewBudgetHandler(budgetService)
	savingsHandler := handler.NewSavingsGoalHandler(savingsService)
	debtHandler := handler.NewDebtHandler(debtService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	aiHandler := handler.NewAIHandler(aiService)

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	// CORS - allow frontend origin from env or default
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3000"
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{allowedOrigins},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Public routes
	r.Post("/api/auth/register", authHandler.Register)
	r.Post("/api/auth/login", authHandler.Login)

	// OAuth routes - supports facebook, google, etc.
	r.Get("/api/auth/{provider}", oauthHandler.OAuthLogin)
	r.Get("/api/auth/{provider}/callback", oauthHandler.OAuthCallback)
	r.Post("/api/auth/{provider}/token", oauthHandler.OAuthToken)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(handler.AuthMiddleware)

		// Current user
		r.Get("/api/auth/me", authHandler.Me)

		// Dashboard
		r.Get("/api/dashboard", dashboardHandler.GetDashboard)
		r.Get("/api/dashboard/monthly/{year}/{month}", dashboardHandler.GetMonthlyDashboard)

		// Transactions
		r.Get("/api/transactions", transactionHandler.List)
		r.Post("/api/transactions", transactionHandler.Create)
		r.Get("/api/transactions/{id}", transactionHandler.Get)
		r.Put("/api/transactions/{id}", transactionHandler.Update)
		r.Delete("/api/transactions/{id}", transactionHandler.Delete)

		// Budgets
		r.Get("/api/budgets", budgetHandler.List)
		r.Post("/api/budgets", budgetHandler.Create)
		r.Get("/api/budgets/{id}", budgetHandler.Get)
		r.Put("/api/budgets/{id}", budgetHandler.Update)
		r.Delete("/api/budgets/{id}", budgetHandler.Delete)

		// Savings Goals
		r.Get("/api/savings-goals", savingsHandler.List)
		r.Post("/api/savings-goals", savingsHandler.Create)
		r.Get("/api/savings-goals/{id}", savingsHandler.Get)
		r.Put("/api/savings-goals/{id}", savingsHandler.Update)
		r.Delete("/api/savings-goals/{id}", savingsHandler.Delete)
		r.Post("/api/savings-goals/{id}/contribute", savingsHandler.Contribute)

		// Debt Management
		r.Get("/api/debts", debtHandler.List)
		r.Post("/api/debts", debtHandler.Create)
		r.Get("/api/debts/{id}", debtHandler.Get)
		r.Put("/api/debts/{id}", debtHandler.Update)
		r.Delete("/api/debts/{id}", debtHandler.Delete)
		r.Post("/api/debts/{id}/payment", debtHandler.MakePayment)
		r.Get("/api/debts/{id}/payoff-plan", debtHandler.GetPayoffPlan)
		r.Get("/api/debts/calculator", debtHandler.InterestCalculator)

		// AI Chat
		r.Post("/api/chat", aiHandler.Chat)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
