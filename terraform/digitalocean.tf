# DigitalOcean Provider Configuration

provider "digitalocean" {
  token = var.provider_choice == "digitalocean" ? var.do_token : "placeholder"
}

# SSH Key
resource "digitalocean_ssh_key" "wealthpath" {
  count      = var.provider_choice == "digitalocean" ? 1 : 0
  name       = var.ssh_key_name
  public_key = var.ssh_public_key
}

# Firewall
resource "digitalocean_firewall" "wealthpath" {
  count = var.provider_choice == "digitalocean" ? 1 : 0
  name  = "${local.app_name}-firewall"

  droplet_ids = [digitalocean_droplet.wealthpath[0].id]

  # SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # All outbound
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# Droplet
resource "digitalocean_droplet" "wealthpath" {
  count    = var.provider_choice == "digitalocean" ? 1 : 0
  image    = "ubuntu-22-04-x64"
  name     = local.app_name
  region   = var.region
  size     = "s-1vcpu-1gb"  # $6/mo - upgrade to s-1vcpu-2gb for $12/mo
  ssh_keys = [digitalocean_ssh_key.wealthpath[0].fingerprint]
  
  user_data = local.user_data

  tags = [local.app_name]
}

# Optional: Domain & DNS
resource "digitalocean_domain" "wealthpath" {
  count = var.provider_choice == "digitalocean" && var.domain != "" ? 1 : 0
  name  = var.domain
}

resource "digitalocean_record" "wealthpath_a" {
  count  = var.provider_choice == "digitalocean" && var.domain != "" ? 1 : 0
  domain = digitalocean_domain.wealthpath[0].id
  type   = "A"
  name   = "@"
  value  = digitalocean_droplet.wealthpath[0].ipv4_address
  ttl    = 300
}

resource "digitalocean_record" "wealthpath_www" {
  count  = var.provider_choice == "digitalocean" && var.domain != "" ? 1 : 0
  domain = digitalocean_domain.wealthpath[0].id
  type   = "A"
  name   = "www"
  value  = digitalocean_droplet.wealthpath[0].ipv4_address
  ttl    = 300
}

