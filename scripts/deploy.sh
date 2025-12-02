#!/bin/bash
# Deploy/update WealthPath
# Run from /opt/wealthpath

set -e

echo "🚀 Deploying WealthPath..."

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yaml down
docker compose -f docker-compose.prod.yaml up --build -d

# Show status
echo ""
echo "✅ Deployment complete!"
docker compose -f docker-compose.prod.yaml ps


