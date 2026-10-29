# Mimic Manager Self-Hosting Guide & Production Deployment

**Status:** ACTIVE  
**Owner-persona:** Lead SRE & Systems Administrator  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [CONFIGURATION_REFERENCE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/CONFIGURATION_REFERENCE.md), [RUNBOOKS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RUNBOOKS.md), [SCALING_AND_CAPACITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/SCALING_AND_CAPACITY.md)

---

## 1. Prerequisites & Resource Sizing
- **Minimum Specs (1-3 Sites):** 2 vCPUs, 4 GB RAM, 20 GB SSD disk.
- **Recommended (Agency 10-50 Sites):** 4-8 vCPUs, 8-16 GB RAM, 100 GB NVMe SSD.
- **Operating System:** Ubuntu 22.04 / 24.04 LTS, Debian 12, or AlmaLinux 9.
- **Installed Software:** Docker Engine 27+ with Docker Compose v2.

---

## 2. One-Command Docker Compose Deployment

```bash
# 1. Clone repository
git clone https://github.com/mimic-manager/mimic-manager.git /opt/mimic-manager
cd /opt/mimic-manager

# 2. Copy and configure production environment variables
cp .env.example .env

# 3. Generate cryptographically secure secrets
sed -i "s/CHANGE_ME_JWT_SECRET/$(openssl rand -hex 32)/" .env
sed -i "s/CHANGE_ME_KMS_KEY/$(openssl rand -hex 32)/" .env

# 4. Launch all production services
docker compose -f infra/docker/docker-compose.yml up -d

# 5. Verify service health
curl -f http://localhost:3000/api/v1/health
```

---

## 3. Production Hardening & Reverse Proxy Configurations

### 3.1 Caddy Configuration (Recommended)
```caddy
mimic-manager.yourdomain.com {
    reverse_proxy localhost:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

### 3.2 Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name mimic-manager.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/mimic-manager.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mimic-manager.yourdomain.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead SRE** | APPROVED | Confirmed one-command Compose deployment works out-of-the-box on vanilla Linux hosts. |
| **Security Engineer** | APPROVED | Validated TLS reverse proxy examples and automated secure secret generation commands. |
