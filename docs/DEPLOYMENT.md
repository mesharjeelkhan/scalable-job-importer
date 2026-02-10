# Deployment Guide

Complete guide for deploying Job Importer to various platforms.

## Table of Contents
1. [Render (Backend)](#render-backend)
2. [Vercel (Frontend)](#vercel-frontend)
3. [MongoDB Atlas](#mongodb-atlas)
4. [Redis Cloud](#redis-cloud)
5. [AWS](#aws-deployment)
6. [Docker Swarm](#docker-swarm)

---

## Render (Backend)

### Prerequisites
- Render account
- GitHub repository
- MongoDB Atlas connection string
- Redis Cloud connection string

### Steps

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   ```
   Name: job-importer-backend
   Environment: Node
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: server
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Environment Variables**
   Add these in the Render dashboard:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your-mongodb-atlas-uri>
   REDIS_HOST=<your-redis-cloud-host>
   REDIS_PORT=<your-redis-cloud-port>
   REDIS_PASSWORD=<your-redis-cloud-password>
   CORS_ORIGIN=https://your-frontend.vercel.app
   QUEUE_CONCURRENCY=10
   BATCH_SIZE=500
   ENABLE_CRON=true
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Note your backend URL (e.g., `https://job-importer-backend.onrender.com`)

---

## Vercel (Frontend)

### Prerequisites
- Vercel account
- GitHub repository
- Backend URL from Render

### Steps

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure Build**
   ```
   Framework Preset: Next.js
   Root Directory: client
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://job-importer-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Access your frontend at the provided URL

---

## MongoDB Atlas

### Setup

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create free M0 cluster
   - Choose your preferred region

2. **Database User**
   - Go to "Database Access"
   - Create user with read/write permissions
   - Note username and password

3. **Network Access**
   - Go to "Network Access"
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - Or add specific IPs for better security

4. **Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/job-importer?retryWrites=true&w=majority
   ```

5. **Collections**
   Collections will be auto-created on first use:
   - `jobs`
   - `import_logs`
   - `job_feeds`

---

## Redis Cloud

### Setup

1. **Create Database**
   - Go to [Redis Cloud](https://redis.com/try-free/)
   - Create free database (30MB)
   - Choose AWS/GCP region closest to your backend

2. **Get Connection Details**
   - Click on your database
   - Note:
     - Endpoint (host:port)
     - Password

3. **Configure**
   Use in your environment variables:
   ```
   REDIS_HOST=redis-12345.c123.us-east-1.cloud.redislabs.com
   REDIS_PORT=12345
   REDIS_PASSWORD=your-password-here
   ```

---

## AWS Deployment

### Using Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize**
   ```bash
   cd server
   eb init -p node.js job-importer-backend
   ```

3. **Create Environment**
   ```bash
   eb create job-importer-production
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv NODE_ENV=production \
     MONGODB_URI=<your-uri> \
     REDIS_HOST=<your-host> \
     REDIS_PORT=<your-port> \
     REDIS_PASSWORD=<your-password>
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

### Using ECS (Docker)

1. **Build and Push Images**
   ```bash
   # Build
   docker build -t job-importer-backend ./server
   docker build -t job-importer-frontend ./client
   
   # Tag
   docker tag job-importer-backend:latest <aws-account>.dkr.ecr.us-east-1.amazonaws.com/job-importer-backend:latest
   
   # Push to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws-account>.dkr.ecr.us-east-1.amazonaws.com
   docker push <aws-account>.dkr.ecr.us-east-1.amazonaws.com/job-importer-backend:latest
   ```

2. **Create ECS Task Definition**
   - Use AWS Console or AWS CLI
   - Define containers for backend, MongoDB, Redis
   - Set environment variables

3. **Create ECS Service**
   - Create cluster
   - Create service from task definition
   - Configure load balancer

---

## Docker Swarm

For production deployment with Docker Swarm:

### 1. Initialize Swarm

```bash
docker swarm init
```

### 2. Create Docker Stack File

Save as `docker-stack.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    volumes:
      - mongodb_data:/data/db
    networks:
      - job-importer-network
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    networks:
      - job-importer-network
    deploy:
      replicas: 1

  backend:
    image: job-importer-backend:latest
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/job-importer
      - REDIS_HOST=redis
    networks:
      - job-importer-network
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

  frontend:
    image: job-importer-frontend:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000
    networks:
      - job-importer-network
    deploy:
      replicas: 2

volumes:
  mongodb_data:
  redis_data:

networks:
  job-importer-network:
    driver: overlay
```

### 3. Deploy Stack

```bash
docker stack deploy -c docker-stack.yml job-importer
```

### 4. Scale Services

```bash
docker service scale job-importer_backend=5
```

---

## Environment Variables Reference

### Backend
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<connection-string>
REDIS_HOST=<host>
REDIS_PORT=<port>
REDIS_PASSWORD=<password>
CORS_ORIGIN=<frontend-url>
QUEUE_CONCURRENCY=10
BATCH_SIZE=500
MAX_RETRIES=3
ENABLE_CRON=true
CRON_SCHEDULE=0 * * * *
LOG_LEVEL=info
```

### Frontend
```env
NEXT_PUBLIC_API_URL=<backend-url>
```

---

## SSL/HTTPS Configuration

### Using Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Using Caddy

```
api.yourdomain.com {
    reverse_proxy localhost:5000
}
```

---

## Monitoring and Logging

### CloudWatch (AWS)
- Logs automatically sent to CloudWatch Logs
- Set up alarms for errors
- Create dashboards

### Datadog
```javascript
// Add to server/src/index.ts
import { StatsD } from 'hot-shots';

const dogstatsd = new StatsD({
  host: 'datadog-agent',
  port: 8125
});
```

### Sentry
```bash
npm install @sentry/node
```

```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## Performance Optimization

### Backend
1. Enable compression:
   ```javascript
   import compression from 'compression';
   app.use(compression());
   ```

2. Add caching:
   ```javascript
   import cache from 'express-cache-controller';
   app.use(cache({ maxAge: 3600 }));
   ```

### Frontend
1. Enable ISR in Next.js:
   ```javascript
   export const revalidate = 3600; // 1 hour
   ```

2. Optimize images:
   ```javascript
   import Image from 'next/image';
   ```

---

## Backup Strategy

### MongoDB
```bash
# Automated daily backups
mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)
```

### Redis
```bash
# Save snapshot
redis-cli BGSAVE
```

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check network access in Atlas
- Verify connection string
- Check credentials

**Redis Connection Failed**
- Verify host/port/password
- Check firewall rules
- Test with redis-cli

**Import Not Starting**
- Check queue connection
- Verify cron is enabled
- Check logs for errors

**High Memory Usage**
- Reduce QUEUE_CONCURRENCY
- Decrease BATCH_SIZE
- Add more RAM to server

---

## Scaling Strategies

### Horizontal Scaling
- Run multiple backend instances
- Use load balancer (Nginx, AWS ALB)
- Enable sticky sessions for WebSocket

### Vertical Scaling
- Increase server resources
- Optimize database indexes
- Use Redis clustering

### Database Sharding
- Shard by job category
- Shard by date range
- Use MongoDB sharding

---

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Enable CORS properly
- [ ] Implement rate limiting
- [ ] Use environment variables
- [ ] Enable MongoDB authentication
- [ ] Use Redis password
- [ ] Regular security updates
- [ ] Input validation
- [ ] SQL injection protection
- [ ] XSS protection

---

## Support

For deployment issues:
- Check logs first
- Review this guide
- Open GitHub issue
- Contact support@yourdomain.com
