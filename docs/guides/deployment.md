# Deployment Guide

## Production Checklist

### Security
- [ ] Change default JWT secrets
- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set up rate limiting
- [ ] Enable audit logging

### Database
- [ ] Set up backups
- [ ] Configure connection pooling
- [ ] Set up read replicas
- [ ] Enable SSL connections

### Infrastructure
- [ ] Set up health checks
- [ ] Configure auto-scaling
- [ ] Set up load balancer
- [ ] Configure monitoring

## Deployment Options

### Option 1: Docker on AWS ECS
```bash
# Build
docker build -t auth-template:latest .

# Tag
docker tag auth-template:latest your-repo:latest

# Push
docker push your-repo:latest

# Deploy
aws ecs update-service --cluster prod --service auth-api --force-new-deployment
```

### Option 2: Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: your-repo/auth-template:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

Deploy:
```bash
kubectl apply -f k8s/
```

### Option 3: Digital Ocean
```yaml
# app.yaml
name: auth-template
services:
- name: api
  instance_count: 2
  http_port: 3000
  health_check:
    http_path: /health
```
```bash
doctl apps create --spec app.yaml
```

## Monitoring

### Health Checks
```typescript
@Get('health')
async health() {
  return {
    status: 'ok',
    services: {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    },
  };
}
```

### Metrics to Track
- Request rate
- Response time
- Error rate
- Active users
- Database connections

## Backup Strategy
```bash
# Daily backups
pg_dump -h localhost -U postgres auth_db > backup_$(date +%Y%m%d).sql

# Retain for 30 days
find /backups -name "backup_*.sql" -mtime +30 -delete
```