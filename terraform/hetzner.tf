# Hetzner Cloud Provider Configuration

provider "hcloud" {
  token = var.provider_choice == "hetzner" ? var.hcloud_token : "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}

# SSH Key
resource "hcloud_ssh_key" "wealthpath" {
  count      = var.provider_choice == "hetzner" ? 1 : 0
  name       = var.ssh_key_name
  public_key = var.ssh_public_key
}

# Firewall
resource "hcloud_firewall" "wealthpath" {
  count = var.provider_choice == "hetzner" ? 1 : 0
  name  = "${local.app_name}-firewall"

  # SSH
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTP
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Outbound
  rule {
    direction       = "out"
    protocol        = "tcp"
    port            = "any"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "udp"
    port            = "any"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "icmp"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }
}

# Server
resource "hcloud_server" "wealthpath" {
  count       = var.provider_choice == "hetzner" ? 1 : 0
  name        = local.app_name
  image       = "ubuntu-22.04"
  server_type = "cx11"  # €4.5/mo - 1vCPU, 2GB RAM
  location    = var.region == "nyc1" ? "nbg1" : var.region  # Default to Nuremberg
  ssh_keys    = [hcloud_ssh_key.wealthpath[0].id]
  
  user_data = local.user_data

  firewall_ids = [hcloud_firewall.wealthpath[0].id]

  labels = {
    app = local.app_name
  }
}

