# WealthPath Ansible Deployment

Deploy and manage WealthPath infrastructure using Ansible.

## Prerequisites

```bash
# Install Ansible
pip install ansible

# Install required collections
cd ansible
ansible-galaxy install -r requirements.yml
```

## Quick Start

```bash
cd ansible

# Set your server IP (or edit inventory.yml)
export SERVER_IP="52.220.155.187"

# Deploy
ansible-playbook playbook.yml --ask-vault-pass
```

## Playbooks

### Main Deployment (`playbook.yml`)
Regular deployment playbook - use this for normal deployments.

```bash
ansible-playbook playbook.yml --ask-vault-pass
```

### Database Migration (`migrate-db-playbook.yml`)
**One-time only** - Migrates data from Docker PostgreSQL to host PostgreSQL.

```bash
# Run BEFORE main playbook if migrating
ansible-playbook migrate-db-playbook.yml --ask-vault-pass
```

**When to use:**
- First time moving from Docker PostgreSQL to host PostgreSQL
- Only needed once per server
- Run before the main deployment playbook

## Configuration

Set environment variables or edit `inventory.yml`:

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_IP` | Target server IP | `13.228.119.0` |
| `DOMAIN` | Custom domain | Auto (sslip.io) |
| `USE_SSL` | Enable HTTPS | `true` |
| `USE_ZEROSSL` | Use ZeroSSL CA | `true` |
| `ADMIN_EMAIL` | Email for certs | `admin@example.com` |

## Secrets Management (Ansible Vault)

Store sensitive data securely with Ansible Vault:

### Setup

```bash
cd ansible

# 1. Copy the example secrets file
cp secrets.yml.example secrets.yml

# 2. Edit with your actual secrets
nano secrets.yml

# 3. Encrypt the file
ansible-vault encrypt secrets.yml
```

### secrets.yml contents

```yaml
# OAuth - Google
google_client_id: "xxx.apps.googleusercontent.com"
google_client_secret: "xxx"

# OAuth - Facebook
facebook_app_id: "xxx"
facebook_app_secret: "xxx"

# AI Chat
openai_api_key: "sk-xxx"
```

### Deploy with vault

```bash
# Prompt for vault password
ansible-playbook playbook.yml --ask-vault-pass

# Or use a password file (don't commit this!)
echo "your-password" > .vault_pass
ansible-playbook playbook.yml --vault-password-file .vault_pass
```

### Edit encrypted secrets

```bash
ansible-vault edit secrets.yml
```

## Usage Examples

### Deploy with custom domain
```bash
DOMAIN=wealthpath.example.com ansible-playbook playbook.yml
```

### Deploy with ZeroSSL (for DuckDNS)
```bash
DOMAIN=wealthpath.duckdns.org \
USE_ZEROSSL=true \
ADMIN_EMAIL=you@example.com \
ansible-playbook playbook.yml
```

### Run specific task modules

You can run individual task files for testing or partial updates:

```bash
# Test system setup only
ansible-playbook playbook.yml --start-at-task "System Setup"

# Skip to deployment (assumes system/docker/postgres already set up)
ansible-playbook playbook.yml --start-at-task "Deploy Application"

# Run only configuration tasks
ansible-playbook playbook.yml --start-at-task "Configuration" --end-at-task "Configuration"
```

### Check connectivity
```bash
ansible all -m ping
```

### Run ad-hoc commands
```bash
# Check containers
ansible wealthpath -m shell -a "docker ps"

# View logs
ansible wealthpath -m shell -a "docker compose -f /opt/wealthpath/docker-compose.deploy.yaml logs --tail=50"

# Restart services
ansible wealthpath -m shell -a "docker compose -f /opt/wealthpath/docker-compose.deploy.yaml restart"
```

## When to Split Playbooks

Split playbooks when tasks have different:

| Criteria | Example | Split? |
|----------|---------|--------|
| **Frequency** | One-time migration vs regular deployment | ✅ Yes |
| **Purpose** | Setup vs maintenance vs backup | ✅ Yes |
| **Scope** | Full deployment vs partial update | ✅ Yes |
| **Environment** | Dev vs staging vs production | ✅ Yes |
| **Dependencies** | Requires different prerequisites | ✅ Yes |

### Examples

**✅ Split into separate playbook:**
- Database migration (one-time)
- Backup/restore operations
- Security updates
- Disaster recovery

**❌ Keep in main playbook:**
- Regular deployment tasks
- Configuration updates
- Service restarts
- Health checks

## Configuration Flow

The deployment uses a pipeline to inject secrets and generate the `.env` file on the server:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TWO WAYS TO PROVIDE SECRETS                      │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐         ┌──────────────────────┐
  │   GitHub Secrets     │         │   secrets.yml        │
  │   (CI/CD Pipeline)   │         │   (Local/Manual)     │
  │                      │         │                      │
  │  ADMIN_PASSWORD      │         │  admin_password      │
  │  GOOGLE_CLIENT_ID    │         │  google_client_id    │
  │  OPENAI_API_KEY      │         │  openai_api_key      │
  │  ...                 │         │  ...                 │
  └──────────┬───────────┘         └──────────┬───────────┘
             │                                 │
             │  export as env vars             │  --ask-vault-pass
             │                                 │
             ▼                                 ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │                        deploy-ansible.yml                              │
  │                        (GitHub Actions)                                │
  │   OR                                                                   │
  │                        ansible-playbook playbook.yml                   │
  │                        (Manual run)                                    │
  └───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │                        tasks/config.yml                                │
  │                                                                        │
  │  1. Detect server IP and domain                                        │
  │  2. Read secrets from env vars OR secrets.yml                          │
  │  3. Generate/preserve JWT_SECRET and POSTGRES_PASSWORD                 │
  │  4. Render env.j2 template                                             │
  └───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │                        templates/env.j2                                │
  │                        (Jinja2 Template)                               │
  │                                                                        │
  │  POSTGRES_PASSWORD={{ postgres_password }}                             │
  │  JWT_SECRET={{ jwt_secret }}                                           │
  │  GOOGLE_CLIENT_ID={{ google_client_id }}                               │
  │  ADMIN_PASSWORD={{ admin_password }}                                   │
  │  ...                                                                   │
  └───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │                        /opt/wealthpath/.env                            │
  │                        (Generated on Server)                           │
  │                                                                        │
  │  POSTGRES_PASSWORD=abc123def456...                                     │
  │  JWT_SECRET=xyz789...                                                  │
  │  GOOGLE_CLIENT_ID=123.apps.googleusercontent.com                       │
  │  ADMIN_PASSWORD=supersecret123                                         │
  │  ...                                                                   │
  └───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │                        Docker Compose Services                         │
  │                                                                        │
  │  backend, frontend, admin, caddy, flyway                               │
  │  (All read from .env file)                                             │
  └───────────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `templates/env.j2` | Jinja2 template defining `.env` structure |
| `tasks/config.yml` | Logic to gather variables and render template |
| `secrets.yml` | Encrypted local secrets (for manual deploys) |
| GitHub Secrets | CI/CD secrets (for automated deploys) |

### Adding New Secrets

1. **Add to GitHub Secrets** (for CI/CD):
   ```bash
   gh secret set NEW_SECRET_NAME
   ```

2. **Add to workflow** (`.github/workflows/deploy-ansible.yml`):
   ```yaml
   env:
     NEW_SECRET_NAME: ${{ secrets.NEW_SECRET_NAME }}
   ```

3. **Add to config.yml** (read from env var):
   ```yaml
   - name: Set new secret from env
     set_fact:
       new_secret: "{{ lookup('env', 'NEW_SECRET_NAME') or new_secret | default('') }}"
   ```

4. **Add to env.j2** (output to .env):
   ```jinja2
   {% if new_secret is defined and new_secret %}
   NEW_SECRET_NAME={{ new_secret }}
   {% endif %}
   ```

5. **Add to secrets.yml.example** (for documentation):
   ```yaml
   new_secret: "your-secret-here"
   ```

## File Structure

```
ansible/
├── ansible.cfg              # Ansible configuration
├── inventory.yml            # Host and variable definitions
├── playbook.yml             # Main deployment playbook (regular use)
├── migrate-db-playbook.yml  # One-time database migration
├── requirements.yml         # Galaxy dependencies
├── secrets.yml              # 🔒 Encrypted secrets (git-ignored)
├── secrets.yml.example      # Template for secrets
├── tasks/                   # Modular task files
│   ├── system.yml          # System setup and packages
│   ├── docker.yml          # Docker installation
│   ├── postgresql.yml      # PostgreSQL setup
│   ├── migrate-db.yml      # Database migration tasks
│   ├── app.yml             # Application directory and git
│   ├── config.yml          # Domain, secrets, .env generation
│   ├── deploy.yml          # Docker Compose deployment
│   └── health.yml          # Health checks
├── handlers/
│   └── main.yml            # Handler definitions (for reference)
├── templates/
│   └── env.j2              # .env file template
└── README.md
```

### Task File Organization

Each task file handles a specific aspect of deployment:

- **`tasks/system.yml`** - Base system packages and updates
- **`tasks/docker.yml`** - Docker Engine and Compose installation
- **`tasks/postgresql.yml`** - PostgreSQL installation, database, and user creation
- **`tasks/app.yml`** - Application directory and repository cloning
- **`tasks/config.yml`** - Server info, domain resolution, secrets, .env file
- **`tasks/deploy.yml`** - Docker Compose image pulling and service startup
- **`tasks/health.yml`** - Service health verification

This modular structure makes it easy to:
- Understand what each step does
- Modify specific parts without affecting others
- Reuse tasks in other playbooks
- Debug issues by focusing on specific modules

## Integration with Terraform

After `terraform apply` creates the server:

```bash
cd ansible
export SERVER_IP=$(cd ../terraform && terraform output -raw server_ip)
ansible-playbook playbook.yml
```

## Troubleshooting

### SSH connection issues
```bash
# Test SSH manually
ssh -i ~/.ssh/wealthpath_key ubuntu@$SERVER_IP

# Verbose Ansible
ansible-playbook playbook.yml -vvv
```

### Docker permission denied
```bash
# Re-run with become
ansible-playbook playbook.yml --become
```

