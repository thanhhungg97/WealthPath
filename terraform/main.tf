# WealthPath Infrastructure
# Supports: DigitalOcean, Hetzner, AWS

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
}

# Variables
variable "provider_choice" {
  description = "Cloud provider: digitalocean or hetzner"
  type        = string
  default     = "digitalocean"
}

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ssh_key_name" {
  description = "Name of SSH key"
  type        = string
  default     = "wealthpath-key"
}

variable "ssh_public_key" {
  description = "SSH public key content"
  type        = string
}

variable "domain" {
  description = "Domain name for the app"
  type        = string
  default     = ""
}

variable "region" {
  description = "Region for deployment"
  type        = string
  default     = "nyc1" # DO: nyc1, sfo1, etc. Hetzner: nbg1, fsn1, hel1
}

# Local variables
locals {
  app_name = "wealthpath"
  
  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Update system
    apt update && apt upgrade -y
    
    # Install Docker
    curl -fsSL https://get.docker.com | sh
    
    # Install Docker Compose plugin
    apt install -y docker-compose-plugin git
    
    # Install Caddy
    apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update && apt install -y caddy
    
    # Clone app
    mkdir -p /opt/wealthpath
    cd /opt/wealthpath
    git clone https://github.com/thanhhungg97/WealthPath.git .
    
    # Generate secrets
    JWT_SECRET=$(openssl rand -hex 32)
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    
    # Create .env
    cat > .env << ENVEOF
    POSTGRES_USER=wealthpath
    POSTGRES_PASSWORD=$${POSTGRES_PASSWORD}
    POSTGRES_DB=wealthpath
    JWT_SECRET=$${JWT_SECRET}
    ALLOWED_ORIGINS=https://${var.domain}
    ENVEOF
    
    # Configure Caddy
    cat > /etc/caddy/Caddyfile << CADDYEOF
    ${var.domain} {
        reverse_proxy localhost:3000
        encode gzip
    }
    CADDYEOF
    
    # Start services
    systemctl restart caddy
    cd /opt/wealthpath
    docker compose -f docker-compose.prod.yaml up -d
    
    echo "WealthPath deployed successfully!" > /var/log/wealthpath-setup.log
  EOF
}

