#!/bin/bash
set -e

echo "🚀 WealthPath K8s Local Setup"
echo "=============================="

# Check for minikube or kind
if command -v minikube &> /dev/null; then
    K8S_TOOL="minikube"
    echo "✅ Using minikube"
elif command -v kind &> /dev/null; then
    K8S_TOOL="kind"
    echo "✅ Using kind"
else
    echo "❌ Neither minikube nor kind found. Please install one:"
    echo "   brew install minikube"
    echo "   or"
    echo "   brew install kind"
    exit 1
fi

# Start cluster if not running
if [ "$K8S_TOOL" = "minikube" ]; then
    if ! minikube status &> /dev/null; then
        echo "📦 Starting minikube..."
        minikube start --memory=4096 --cpus=2
    fi
    
    echo "🔧 Enabling ingress addon..."
    minikube addons enable ingress
    
    echo "🐳 Setting docker env to minikube..."
    eval $(minikube docker-env)
else
    # Kind setup
    if ! kind get clusters | grep -q wealthpath; then
        echo "📦 Creating kind cluster..."
        cat <<EOF | kind create cluster --name wealthpath --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF
    fi
    
    echo "🔧 Installing ingress-nginx for kind..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    echo "⏳ Waiting for ingress controller..."
    kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=120s
fi

echo ""
echo "🏗️  Building Docker images..."

# Build backend
echo "📦 Building backend image..."
docker build -t wealthpath-backend:latest ./backend

# Build frontend
echo "📦 Building frontend image..."
docker build -t wealthpath-frontend:latest ./frontend

# Load images into kind (if using kind)
if [ "$K8S_TOOL" = "kind" ]; then
    echo "📤 Loading images into kind..."
    kind load docker-image wealthpath-backend:latest --name wealthpath
    kind load docker-image wealthpath-frontend:latest --name wealthpath
fi

echo ""
echo "🚢 Deploying to Kubernetes..."

# Apply all manifests
kubectl apply -k ./k8s/

# Wait for pods
echo "⏳ Waiting for pods to be ready..."
kubectl wait --namespace wealthpath \
  --for=condition=ready pod \
  --selector=app=postgres \
  --timeout=120s

kubectl wait --namespace wealthpath \
  --for=condition=ready pod \
  --selector=app=backend \
  --timeout=120s

kubectl wait --namespace wealthpath \
  --for=condition=ready pod \
  --selector=app=frontend \
  --timeout=120s

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Pod status:"
kubectl get pods -n wealthpath

echo ""
echo "🌐 Services:"
kubectl get services -n wealthpath

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$K8S_TOOL" = "minikube" ]; then
    echo "🔗 Access the application:"
    echo ""
    echo "Option 1 - Add to /etc/hosts:"
    MINIKUBE_IP=$(minikube ip)
    echo "   echo '$MINIKUBE_IP wealthpath.local' | sudo tee -a /etc/hosts"
    echo "   Then open: http://wealthpath.local"
    echo ""
    echo "Option 2 - Port forward:"
    echo "   kubectl port-forward -n wealthpath svc/frontend 3000:3000"
    echo "   Then open: http://localhost:3000"
else
    echo "🔗 Access the application:"
    echo ""
    echo "Option 1 - Add to /etc/hosts:"
    echo "   echo '127.0.0.1 wealthpath.local' | sudo tee -a /etc/hosts"
    echo "   Then open: http://wealthpath.local"
    echo ""
    echo "Option 2 - Port forward:"
    echo "   kubectl port-forward -n wealthpath svc/frontend 3000:3000"
    echo "   Then open: http://localhost:3000"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"



