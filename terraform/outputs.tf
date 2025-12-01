# Outputs

locals {
  server_ip = (
    var.provider_choice == "digitalocean" ? (
      length(digitalocean_droplet.wealthpath) > 0 ? digitalocean_droplet.wealthpath[0].ipv4_address : null
    ) : var.provider_choice == "hetzner" ? (
      length(hcloud_server.wealthpath) > 0 ? hcloud_server.wealthpath[0].ipv4_address : null
    ) : var.provider_choice == "aws" ? (
      length(aws_eip.wealthpath) > 0 ? aws_eip.wealthpath[0].public_ip : null
    ) : null
  )
}

output "server_ip" {
  description = "Public IP address of the server"
  value       = local.server_ip
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = local.server_ip != null ? "ssh ${var.provider_choice == "aws" ? "ubuntu" : "root"}@${local.server_ip}" : null
}

output "app_url" {
  description = "Application URL"
  value       = var.domain != "" ? "https://${var.domain}" : (local.server_ip != null ? "http://${local.server_ip}:3000" : null)
}

output "provider" {
  description = "Cloud provider used"
  value       = var.provider_choice
}

output "next_steps" {
  description = "What to do next"
  value = <<-EOF
    
    ✅ Server created on ${upper(var.provider_choice)}!
    
    Next steps:
    
    1. Wait 2-3 minutes for setup to complete
    
    2. SSH into server:
       ssh ${var.provider_choice == "aws" ? "ubuntu" : "root"}@${local.server_ip}
    
    3. Check deployment status:
       cat /var/log/wealthpath-setup.log
       ${var.provider_choice == "aws" ? "sudo " : ""}docker ps
    
    4. Point your domain DNS A record to: ${local.server_ip}
    
    5. Access your app: ${var.domain != "" ? "https://${var.domain}" : "http://${local.server_ip}:3000"}
    
  EOF
}
