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
| `USE_ZEROSSL` | Use ZeroSSL CA | `false` |
| `ADMIN_EMAIL` | Email for certs | `admin@example.com` |

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

