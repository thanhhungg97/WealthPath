# Outputs

output "server_ip" {
  description = "Public IP address of the server"
  value = var.provider_choice == "digitalocean" ? (
    length(digitalocean_droplet.wealthpath) > 0 ? digitalocean_droplet.wealthpath[0].ipv4_address : null
  ) : (
    length(hcloud_server.wealthpath) > 0 ? hcloud_server.wealthpath[0].ipv4_address : null
  )
}

output "ssh_command" {
  description = "SSH command to connect"
  value = var.provider_choice == "digitalocean" ? (
    length(digitalocean_droplet.wealthpath) > 0 ? "ssh root@${digitalocean_droplet.wealthpath[0].ipv4_address}" : null
  ) : (
    length(hcloud_server.wealthpath) > 0 ? "ssh root@${hcloud_server.wealthpath[0].ipv4_address}" : null
  )
}

output "app_url" {
  description = "Application URL"
  value       = var.domain != "" ? "https://${var.domain}" : (
    var.provider_choice == "digitalocean" ? (
      length(digitalocean_droplet.wealthpath) > 0 ? "http://${digitalocean_droplet.wealthpath[0].ipv4_address}:3000" : null
    ) : (
      length(hcloud_server.wealthpath) > 0 ? "http://${hcloud_server.wealthpath[0].ipv4_address}:3000" : null
    )
  )
}

output "next_steps" {
  description = "What to do next"
  value = <<-EOF
    
    ✅ Server created! Next steps:
    
    1. Wait 2-3 minutes for setup to complete
    
    2. SSH into server:
       ${var.provider_choice == "digitalocean" ? (length(digitalocean_droplet.wealthpath) > 0 ? "ssh root@${digitalocean_droplet.wealthpath[0].ipv4_address}" : "") : (length(hcloud_server.wealthpath) > 0 ? "ssh root@${hcloud_server.wealthpath[0].ipv4_address}" : "")}
    
    3. Check deployment status:
       cat /var/log/wealthpath-setup.log
       docker ps
    
    4. Point your domain DNS to: ${var.provider_choice == "digitalocean" ? (length(digitalocean_droplet.wealthpath) > 0 ? digitalocean_droplet.wealthpath[0].ipv4_address : "") : (length(hcloud_server.wealthpath) > 0 ? hcloud_server.wealthpath[0].ipv4_address : "")}
    
    5. Access your app: ${var.domain != "" ? "https://${var.domain}" : "http://<server-ip>:3000"}
    
  EOF
}

