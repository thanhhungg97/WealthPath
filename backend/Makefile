.PHONY: run build test migrate

# Run the server
run:
	go run cmd/api/main.go

# Build the binary
build:
	go build -o bin/api cmd/api/main.go

# Run tests
test:
	go test -v ./...

# Run migrations
migrate:
	psql -d wealthpath -f migrations/001_initial.sql

# Download dependencies
deps:
	go mod tidy

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run


