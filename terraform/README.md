# WealthPath Terraform Infrastructure

Deploy WealthPath to DigitalOcean or Hetzner Cloud with one command.

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads) installed
2. Account on [DigitalOcean](https://digitalocean.com) or [Hetzner](https://hetzner.cloud)
3. API token from your provider
4. SSH key pair (`ssh-keygen -t rsa -b 4096`)

## Quick Start

```bash
cd terraform

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy!
terraform apply
```

## Configuration

Edit `terraform.tfvars`:

| Variable | Description | Example |
|----------|-------------|---------|
| `provider_choice` | `digitalocean` or `hetzner` | `digitalocean` |
| `do_token` | DigitalOcean API token | `dop_v1_xxx` |
| `hcloud_token` | Hetzner API token | `xxx` |
| `ssh_public_key` | Your SSH public key | `ssh-rsa AAAA...` |
| `domain` | Your domain (optional) | `app.example.com` |
| `region` | Server region | `nyc1` |

## Costs

| Provider | Spec | Cost |
|----------|------|------|
| Hetzner CX11 | 1 vCPU, 2GB RAM | €4.51/mo |
| DigitalOcean | 1 vCPU, 1GB RAM | $6/mo |
| DigitalOcean | 1 vCPU, 2GB RAM | $12/mo |

## Commands

```bash
# Deploy
terraform apply

# Destroy
terraform destroy

# Show outputs
terraform output

# SSH to server
ssh root@$(terraform output -raw server_ip)
```

## What Gets Deployed

1. **VPS** with Ubuntu 22.04
2. **Docker** + Docker Compose
3. **Caddy** for SSL/reverse proxy
4. **WealthPath** app (auto-cloned and started)
5. **Firewall** rules (22, 80, 443)

## After Deployment

1. Wait 2-3 minutes for setup to complete
2. Point your domain's DNS A record to the server IP
3. Access your app at `https://your-domain.com`

## Updating the App

SSH into server and run:

```bash
cd /opt/wealthpath
git pull
docker compose -f docker-compose.prod.yaml up --build -d
```



