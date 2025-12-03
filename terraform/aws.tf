# AWS Provider Configuration

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

# Get latest Ubuntu 22.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# SSH Key Pair
resource "aws_key_pair" "wealthpath" {
  key_name   = var.ssh_key_name
  public_key = var.ssh_public_key
}

# Security Group
resource "aws_security_group" "wealthpath" {
  name        = "${local.app_name}-sg"
  description = "Security group for WealthPath"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.app_name}-sg"
  }
}

# EC2 Instance
resource "aws_instance" "wealthpath" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.aws_instance_type
  key_name               = aws_key_pair.wealthpath.key_name
  vpc_security_group_ids = [aws_security_group.wealthpath.id]

  user_data = <<-EOF
    #!/bin/bash
    # WealthPath EC2 Bootstrap - Minimal setup for Ansible
    # Full deployment handled by: cd ansible && ansible-playbook playbook.yml
    
    set -ex
    
    # Install Python for Ansible
    apt-get update -qq
    apt-get install -y -qq python3 python3-pip
    
    echo "Server ready for Ansible provisioning"
  EOF

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name = local.app_name
  }
}

# Elastic IP
resource "aws_eip" "wealthpath" {
  instance = aws_instance.wealthpath.id
  domain   = "vpc"

  tags = {
    Name = "${local.app_name}-eip"
  }
}
