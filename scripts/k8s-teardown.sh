#!/bin/bash
set -e

echo "🧹 WealthPath K8s Teardown"
echo "=========================="

# Delete namespace (this removes everything)
echo "🗑️  Deleting wealthpath namespace..."
kubectl delete namespace wealthpath --ignore-not-found

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "To also delete the cluster:"
echo "  minikube delete"
echo "  or"
echo "  kind delete cluster --name wealthpath"



