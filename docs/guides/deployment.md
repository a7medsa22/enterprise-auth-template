# Deployment Guide

## Production Checklist

### Security

- [ ] Change default JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- [ ] Enable HTTPS
- [ ] Configure CORS origins
- [ ] Set up rate limiting
- [ ] Enable audit logging

### Database

- [ ] Connect to managed database (Neon PostgreSQL or AWS RDS) with SSL
- [ ] Set up backups & retention policy
- [ ] Configure connection pooling (`max: 20`)

### Managed Redis / Queue

- [ ] Configure Redis / Upstash Redis with TLS (`rediss://`)
- [ ] Verify Bull queue connection for async email jobs

### Infrastructure

- [ ] Set up health checks (`/health`)
- [ ] Configure PM2 process management & auto-restart
- [ ] Set up load balancer & SSL termination
- [ ] Configure monitoring & alerting

---

## Deployment Options

### Option 1: AWS EC2 with PM2 & GitHub Actions (Automated CI/CD)

The repository includes a GitHub Actions workflow (`.github/workflows/build.yml`) that deploys directly to AWS EC2 using PM2.

#### Environment Setup on EC2

```bash
# 1. Install Node.js 24 and PNPM
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm pm2

# 2. Setup project directory
mkdir -p /var/www/auth-template
cd /var/www/auth-template

# 3. Configure production .env
cat << 'EOF' > .env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:password@xxx.upstash.io:6379
JWT_ACCESS_SECRET=your-production-access-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_SECURE=false
SMTP_FROM="Auth App <noreply@yourdomain.com>"
EOF
```

#### GitHub Actions Deployment Setup

In your GitHub repository settings, configure secrets:

- `EC2_HOST`: Elastic IP of your EC2 instance
- `EC2_USERNAME`: SSH user (e.g. `ubuntu` or `ec2-user`)
- `EC2_SSH_KEY`: Private key content for SSH connection

When code is pushed to `main`, `.github/workflows/build.yml` will automatically build the monorepo using `pnpm build`, upload artifacts via SSH, and run:

```bash
pnpm install --frozen-lockfile --prod
pm2 restart auth-api || pm2 start dist/main.js --name "auth-api"
```

---

### Option 2: Managed Cloud Databases & Cache

#### Neon PostgreSQL Setup

Set `DATABASE_URL` in `.env`:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

TypeORM and `@auth-template/typeorm` automatically parse SSL configuration for Neon endpoints.

#### Upstash Redis Setup

Set `REDIS_URL` or `UPSTASH_REDIS_URL` in `.env`:

```env
CACHE_PROVIDER=redis
REDIS_URL=rediss://default:password@endpoint.upstash.io:6379
```

NestJS `AuthModule` automatically enables TLS configuration when detecting `rediss://` or `upstash.com` endpoints.

---

### Option 3: Docker on AWS ECS

#### Step 1: Build and Push Image

```bash
# Build
docker build -t auth-template:latest -f docker/Dockerfile .

# Tag & Push
docker tag auth-template:latest your-repo:latest
docker push your-repo:latest
```

#### Step 2: Create ECS Task Definition

```json
{
  "family": "auth-template",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/auth-template:latest",
      "memory": 512,
      "cpu": 256,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:db-url"
        },
        {
          "name": "JWT_ACCESS_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:jwt-access"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

---

### Option 4: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-api
  template:
    metadata:
      labels:
        app: auth-api
    spec:
      containers:
        - name: api
          image: your-repo/auth-template:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: auth-config
            - secretRef:
                name: auth-secrets
          resources:
            limits:
              memory: '512Mi'
              cpu: '500m'
            requests:
              memory: '256Mi'
              cpu: '250m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

Deploy:

```bash
kubectl apply -f k8s/deployment.yaml
```

---

## Monitoring & Health Checks

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

Expected Response:
```json
{
  "status": "ok",
  "timestamp": "2026-07-20T22:00:00.000Z"
}
```

### Key Metrics to Monitor

- **HTTP Request Latency**: P95 < 100ms for protected endpoints
- **Database Connection Pool**: Active connection count & idle timeout
- **Redis & Bull Queue**: Queue size (`email` queue depth) and job failure rates
- **Process Memory**: Node.js heap usage under PM2

## Backup Strategy

```bash
# PostgreSQL Dump
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Retain for 30 days
find /backups -name "backup_*.sql" -mtime +30 -delete
```

