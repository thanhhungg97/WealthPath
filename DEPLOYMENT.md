# Deploying WealthPath to Production

## Option 1: Railway (Recommended - Easiest)

Railway offers a generous free tier and simple deployment.

### Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   cd WealthPath
   railway init
   ```

3. **Add PostgreSQL**
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Copy the `DATABASE_URL` connection string

4. **Deploy Backend**
   ```bash
   cd backend
   railway up
   ```
   
   Set environment variables in Railway dashboard:
   - `DATABASE_URL` - from PostgreSQL service
   - `JWT_SECRET` - generate a strong secret: `openssl rand -hex 32`
   - `ALLOWED_ORIGINS` - your frontend URL (e.g., `https://your-app.up.railway.app`)
   - `PORT` - Railway sets this automatically

5. **Deploy Frontend**
   ```bash
   cd frontend
   railway up
   ```
   
   Set environment variables:
   - `NEXT_PUBLIC_API_URL` - your backend URL (e.g., `https://your-backend.up.railway.app`)

6. **Run Database Migrations**
   - Use Railway's PostgreSQL web interface or connect via CLI
   - Run `backend/migrations/001_initial.sql`

---

## Option 2: Render

### Steps:

1. **Create Render Account** at [render.com](https://render.com)

2. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Copy the Internal Database URL

3. **Deploy Backend**
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `go build -o api ./cmd/api`
   - Start Command: `./api`
   
   Environment Variables:
   ```
   DATABASE_URL=<postgres-internal-url>
   JWT_SECRET=<generate-strong-secret>
   ALLOWED_ORIGINS=https://your-frontend.onrender.com
   ```

4. **Deploy Frontend**
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   
   Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

---

## Option 3: DigitalOcean Droplet (VPS)

Best for full control and cost-effectiveness at scale.

### Steps:

1. **Create Droplet**
   - Ubuntu 22.04
   - Minimum: 2GB RAM, 1 vCPU ($12/month)

2. **SSH into server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

4. **Clone and Deploy**
   ```bash
   git clone https://github.com/thanhhungg97/WealthPath.git
   cd WealthPath
   
   # Create production env file
   cat > .env << EOF
   POSTGRES_USER=wealthpath
   POSTGRES_PASSWORD=$(openssl rand -hex 16)
   POSTGRES_DB=wealthpath
   JWT_SECRET=$(openssl rand -hex 32)
   ALLOWED_ORIGINS=https://yourdomain.com
   EOF
   
   # Deploy
   docker-compose -f docker-compose.prod.yaml up -d
   ```

5. **Setup Domain & SSL**
   ```bash
   # Install Caddy (auto SSL)
   apt install -y caddy
   
   # Configure reverse proxy
   cat > /etc/caddy/Caddyfile << EOF
   yourdomain.com {
       reverse_proxy localhost:3000
   }
   EOF
   
   systemctl restart caddy
   ```

---

## Option 4: Fly.io

### Steps:

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Create Apps**
   ```bash
   # Backend
   cd backend
   fly launch --name wealthpath-api
   
   # Frontend  
   cd ../frontend
   fly launch --name wealthpath-web
   ```

3. **Create PostgreSQL**
   ```bash
   fly postgres create --name wealthpath-db
   fly postgres attach wealthpath-db --app wealthpath-api
   ```

4. **Set Secrets**
   ```bash
   fly secrets set JWT_SECRET=$(openssl rand -hex 32) --app wealthpath-api
   fly secrets set ALLOWED_ORIGINS=https://wealthpath-web.fly.dev --app wealthpath-api
   fly secrets set NEXT_PUBLIC_API_URL=https://wealthpath-api.fly.dev --app wealthpath-web
   ```

5. **Deploy**
   ```bash
   cd backend && fly deploy
   cd ../frontend && fly deploy
   ```

---

## Environment Variables Reference

### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT tokens (32+ chars) | `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | Frontend URL for CORS | `https://app.example.com` |
| `PORT` | Server port | `8080` |

### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.example.com` |

---

## Post-Deployment Checklist

- [ ] Run database migrations
- [ ] Test user registration/login
- [ ] Verify CORS is working
- [ ] Set up monitoring (optional: Sentry, LogRocket)
- [ ] Configure custom domain
- [ ] Enable SSL/HTTPS
- [ ] Set up database backups

---

## Cost Comparison

| Platform | Free Tier | Paid Starting |
|----------|-----------|---------------|
| Railway | $5 credit/month | $5/month |
| Render | 750 hrs/month | $7/month |
| Fly.io | 3 shared VMs | $1.94/month |
| DigitalOcean | None | $12/month |
| Vercel + Supabase | Generous | $20/month |



