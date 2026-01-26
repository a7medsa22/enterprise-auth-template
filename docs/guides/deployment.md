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
#### Step 1: Build and Push Image

```bash
# Build
docker build -t auth-template:latest .

# Tag
docker tag auth-template:latest your-repo:latest

# Push
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
        { "name": "NODE_ENV", "value": "production" },
        { "name": "DB_HOST", "value": "your-rds-endpoint" }
      ],
      "secrets": [
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
#### Step 3: Create ECS Service
```bash
aws ecs create-service \
  --cluster production \
  --service-name auth-api \
  --task-definition auth-template:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=arn:aws:...,containerName=api,containerPort=3000
  ```


### Option 2: Kubernetes

#### deployment.yaml

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
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: auth-config
              key: db-host
        - name: JWT_ACCESS_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: jwt-access-secret
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
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
---
apiVersion: v1
kind: Service
metadata:
  name: auth-api-service
spec:
  selector:
    app: auth-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
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
### Deploy
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