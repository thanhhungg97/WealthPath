# Code Review - WealthPath

**Date:** December 3, 2025  
**Reviewer:** AI Assistant  
**Scope:** Full codebase review

## Executive Summary

Overall, the codebase is well-structured with good separation of concerns. However, there are several areas that need attention for production readiness, particularly around error handling, security, testing, and code consistency.

## 🟢 Strengths

1. **Clean Architecture**
   - Good separation: handlers → services → repositories
   - Clear package structure
   - Follows Go best practices

2. **Security Basics**
   - ✅ Password hashing with bcrypt
   - ✅ JWT authentication
   - ✅ SQL injection prevention (using parameterized queries)
   - ✅ CORS configured

3. **Modern Stack**
   - Next.js 14 with App Router
   - TypeScript for type safety
   - Good use of modern React patterns

4. **Infrastructure as Code**
   - Terraform for AWS
   - Ansible for configuration
   - Docker Compose for deployment

## 🟡 Issues & Recommendations

### 1. **Critical: Error Handling Inconsistency**

**Problem:** The `apperror` package exists but is **never used**. Handlers use inconsistent error handling patterns.

**Location:** `backend/internal/apperror/errors.go` (unused)

**Current State:**
```go
// Handlers use plain strings:
respondError(w, http.StatusBadRequest, "invalid request body")

// Instead of structured errors:
return apperror.BadRequest("invalid request body")
```

**Impact:** 
- Inconsistent error responses
- Harder to maintain
- No structured error logging

**Recommendation:**
- Use `apperror` package consistently across all handlers
- Update `respondError` to use `apperror.GetStatusCode()` and `apperror.GetMessage()`
- Add error logging with context

**Example Fix:**
```go
// In handler
if err != nil {
    appErr := apperror.Wrap(err, "failed to create transaction")
    respondError(w, apperror.GetStatusCode(appErr), apperror.GetMessage(appErr))
    logger.Error("transaction creation failed", "error", err, "user_id", userID)
    return
}
```

### 2. **Security: CORS Configuration**

**Problem:** CORS only allows a single origin from environment variable.

**Location:** `backend/cmd/api/main.go:67-78`

**Issue:**
```go
allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
if allowedOrigins == "" {
    allowedOrigins = "http://localhost:3000"
}
r.Use(cors.Handler(cors.Options{
    AllowedOrigins: []string{allowedOrigins}, // Single origin
    // ...
}))
```

**Recommendation:**
- Support multiple origins (comma-separated)
- Validate origins against allowlist
- Use config package instead of direct `os.Getenv`

**Fix:**
```go
allowedOrigins := strings.Split(
    getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
    ",",
)
// Trim spaces and validate
```

### 3. **Security: JWT Secret Default**

**Problem:** Weak default JWT secret in production code.

**Location:** `backend/internal/service/user_service.go:155-158`

**Issue:**
```go
secret := os.Getenv("JWT_SECRET")
if secret == "" {
    secret = "dev-secret-change-in-production" // ⚠️ Weak default
}
```

**Recommendation:**
- Fail fast if JWT_SECRET is not set in production
- Use config package to validate required env vars
- Add startup validation

**Fix:**
```go
secret := os.Getenv("JWT_SECRET")
if secret == "" {
    if os.Getenv("ENV") == "production" {
        log.Fatal("JWT_SECRET is required in production")
    }
    secret = "dev-secret-change-in-production"
}
```

### 4. **Missing: Rate Limiting**

**Problem:** No rate limiting on authentication endpoints.

**Risk:** Brute force attacks, DoS

**Recommendation:**
- Add rate limiting middleware (e.g., `github.com/didip/tollbooth`)
- Especially important for `/api/auth/login` and `/api/auth/register`
- Consider per-IP and per-user limits

### 5. **Missing: Input Validation**

**Problem:** Limited input validation and sanitization.

**Examples:**
- Email format not validated
- Password strength not enforced
- No max length checks on strings
- Currency validation exists but could be more robust

**Recommendation:**
- Add validation library (e.g., `github.com/go-playground/validator`)
- Validate all inputs at handler level
- Add max length constraints
- Enforce password policy (min length, complexity)

**Example:**
```go
type RegisterInput struct {
    Email    string `json:"email" validate:"required,email,max=255"`
    Password string `json:"password" validate:"required,min=8"`
    Name     string `json:"name" validate:"required,max=100"`
}
```

### 6. **Testing Coverage**

**Problem:** Only 1 test file exists (`transaction_service_test.go`)

**Current:** `backend/internal/service/transaction_service_test.go`

**Recommendation:**
- Add unit tests for all services
- Add integration tests for handlers
- Add repository tests
- Target: 70%+ coverage

**Priority Areas:**
- Authentication (critical security)
- Transaction operations (core business logic)
- OAuth flows
- Error handling paths

### 7. **Logging Inconsistency**

**Problem:** Logger package exists but not used consistently.

**Location:** `backend/internal/logger/logger.go` (exists but underused)

**Current State:**
- `main.go` uses `log.Printf` instead of structured logger
- Handlers don't log errors
- No request tracing

**Recommendation:**
- Use structured logger everywhere
- Add request ID to logs
- Log all errors with context
- Add log levels (debug, info, warn, error)

**Example:**
```go
// Instead of:
log.Printf("Server starting on port %s", port)

// Use:
logger.Info("server starting", "port", port)
```

### 8. **Configuration Management**

**Problem:** Mix of `os.Getenv()` and config package.

**Location:** Multiple files use `os.Getenv()` directly

**Recommendation:**
- Use `config.Load()` consistently
- Add validation for required env vars
- Fail fast on missing critical config

**Current Issues:**
- `main.go` uses `os.Getenv()` directly
- `user_service.go` uses `os.Getenv()` for JWT_SECRET
- Inconsistent defaults

### 9. **Code Duplication**

**Problem:** Some patterns repeated across handlers.

**Examples:**
- Error response pattern repeated
- UUID parsing repeated
- User ID extraction pattern

**Recommendation:**
- Create helper functions in handler package
- Extract common validation logic

**Example:**
```go
func parseUUIDParam(r *http.Request, param string) (uuid.UUID, error) {
    id, err := uuid.Parse(chi.URLParam(r, param))
    if err != nil {
        return uuid.Nil, apperror.BadRequest(fmt.Sprintf("invalid %s", param))
    }
    return id, nil
}
```

### 10. **Frontend: Error Handling**

**Problem:** Generic error messages, no error boundaries.

**Location:** `frontend/src/lib/api.ts:47-49`

**Issue:**
```typescript
if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }))
    throw new Error(error.error || "Request failed")
}
```

**Recommendation:**
- Add error boundaries for React components
- Provide more specific error messages
- Handle network errors gracefully
- Add retry logic for transient failures

### 11. **Type Safety: JWT Claims**

**Problem:** Type assertion without checking in JWT validation.

**Location:** `backend/internal/service/user_service.go:192`

**Issue:**
```go
userID, err := uuid.Parse(claims["sub"].(string)) // ⚠️ Panic risk
```

**Recommendation:**
- Use type assertion with ok check
- Validate claim types

**Fix:**
```go
sub, ok := claims["sub"].(string)
if !ok {
    return uuid.Nil, errors.New("invalid user id type in token")
}
userID, err := uuid.Parse(sub)
```

### 12. **Missing: Database Connection Pooling**

**Problem:** No explicit connection pool configuration.

**Location:** `backend/cmd/api/main.go:25`

**Recommendation:**
- Configure max open connections
- Set max idle connections
- Add connection timeout
- Monitor connection pool stats

**Example:**
```go
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
```

### 13. **Missing: Request Timeout**

**Problem:** No request timeout middleware.

**Recommendation:**
- Add timeout middleware
- Default: 30 seconds
- Configurable per route

### 14. **Documentation**

**Problem:** Limited inline documentation.

**Recommendation:**
- Add godoc comments to exported functions
- Document API endpoints (OpenAPI/Swagger)
- Add architecture diagrams
- Document deployment process

### 15. **Frontend: Duplicate Routes**

**Problem:** Both `app/(auth)` and `app/[locale]/(auth)` exist.

**Location:** Frontend app directory

**Recommendation:**
- Remove old non-localized routes
- Ensure all routes use locale prefix
- Update all internal links

## 🔴 Critical Issues

1. **apperror package unused** - Error handling inconsistency
2. **No rate limiting** - Security risk
3. **Weak JWT secret default** - Security risk
4. **Type assertion without check** - Potential panic
5. **No input validation** - Security and data integrity risk

## 📊 Metrics

- **Test Coverage:** ~1% (1 test file)
- **Code Duplication:** Medium
- **Security Score:** 6/10
- **Maintainability:** 7/10
- **Documentation:** 4/10

## 🎯 Priority Actions

### High Priority (Do First)
1. ✅ Use `apperror` package consistently
2. ✅ Add input validation
3. ✅ Fix JWT secret handling
4. ✅ Add rate limiting
5. ✅ Fix type assertion in JWT validation

### Medium Priority
6. ✅ Improve logging consistency
7. ✅ Add unit tests (start with auth)
8. ✅ Fix CORS to support multiple origins
9. ✅ Add request timeout middleware
10. ✅ Configure database connection pool

### Low Priority
11. ✅ Reduce code duplication
12. ✅ Add API documentation
13. ✅ Remove duplicate frontend routes
14. ✅ Add error boundaries in frontend

## 📝 Notes

- The codebase structure is solid
- Good use of modern patterns
- Security basics are in place but need hardening
- Testing is the biggest gap
- Error handling needs standardization

## 🔗 Related Files

- `backend/internal/apperror/errors.go` - Unused error package
- `backend/cmd/api/main.go` - Main entry point, needs refactoring
- `backend/internal/handler/response.go` - Should use apperror
- `backend/internal/service/user_service.go` - JWT secret issue
- `frontend/src/lib/api.ts` - Error handling improvements needed


