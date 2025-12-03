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
export SERVER_IP="13.228.119.0"

# Deploy
ansible-playbook playbook.yml
```

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

### Update application only (skip Docker install)
```bash
ansible-playbook playbook.yml --tags=app
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

## File Structure

```
ansible/
├── ansible.cfg          # Ansible configuration
├── inventory.yml        # Host and variable definitions
├── playbook.yml         # Main deployment playbook
├── requirements.yml     # Galaxy dependencies
├── secrets.yml          # 🔒 Encrypted secrets (git-ignored)
├── secrets.yml.example  # Template for secrets
├── templates/
│   └── env.j2          # .env file template
└── README.md
```

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

