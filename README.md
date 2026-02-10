# Scalable Job Importer with Queue Processing

A production-ready, scalable job import system that fetches jobs from external APIs, processes them using Redis queues, stores them in MongoDB, and provides comprehensive import history tracking.

## 🎯 System Overview

This system is designed to handle **1M+ job records** efficiently with:
- **Queue-based processing** using Redis Bull for background jobs
- **Automatic deduplication** and smart upsert logic
- **Real-time progress tracking** with Socket.IO
- **Comprehensive error handling** and retry mechanisms
- **Import history tracking** with detailed analytics
- **Scalable architecture** ready for microservices migration

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Next.js   │◄────►│   Express    │◄────►│   MongoDB   │
│  Frontend   │      │   Backend    │      │  Database   │
└─────────────┘      └──────┬───────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │     Redis    │
                     │  Bull Queue  │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Worker    │
                     │  Processes   │
                     └──────────────┘
```

See [docs/architecture.md](./docs/architecture.md) for detailed system design.

## 📋 Features

### Core Features
- ✅ Multi-source job API integration (9 different feeds)
- ✅ XML to JSON conversion and normalization
- ✅ Redis-based queue processing with Bull
- ✅ Configurable worker concurrency (default: 5)
- ✅ Smart upsert logic (avoids duplicates)
- ✅ Comprehensive import history with filtering
- ✅ Real-time progress updates via Socket.IO
- ✅ Automatic retry with exponential backoff
- ✅ Hourly cron jobs for auto-sync
- ✅ Batch processing for large datasets

### Advanced Features
- 🚀 Environment-configurable batch sizes
- 🚀 Rate limiting and throttling
- 🚀 Comprehensive error logging
- 🚀 Health check endpoints
- 🚀 Docker containerization
- 🚀 Production-ready deployment configs

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time updates
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - REST API server
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database and ODM
- **Bull** - Redis-based queue management
- **Socket.IO** - Real-time communication
- **node-cron** - Scheduled tasks
- **xml2js** - XML parsing
- **Winston** - Logging

### Infrastructure
- **Redis** - Queue and cache store
- **Docker** - Containerization
- **MongoDB Atlas** - Cloud database (optional)
- **Redis Cloud** - Managed Redis (optional)

## 📦 Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **MongoDB** >= 6.x (local or Atlas)
- **Redis** >= 6.x (local or cloud)
- **Docker** (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd scalable-job-importer
```

### 2. Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/job-importer
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job-importer

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# Or for Redis Cloud:
# REDIS_HOST=redis-xxxxx.cloud.redislabs.com
# REDIS_PORT=12345
# REDIS_PASSWORD=your-password

# Queue Configuration
QUEUE_CONCURRENCY=5
BATCH_SIZE=100
MAX_RETRIES=3

# CORS
CORS_ORIGIN=http://localhost:3000

# Cron (hourly sync)
ENABLE_CRON=true
CRON_SCHEDULE=0 * * * *
```

**Start Backend:**

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../client
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Required Environment Variables:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Start Frontend:**

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Frontend will run on `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This starts:
- MongoDB (port 27017)
- Redis (port 6379)
- Backend (port 5000)
- Frontend (port 3000)

### Manual Docker Build

```bash
# Backend
cd server
docker build -t job-importer-backend .
docker run -p 5000:5000 --env-file .env job-importer-backend

# Frontend
cd ../client
docker build -t job-importer-frontend .
docker run -p 3000:3000 --env-file .env.local job-importer-frontend
```

## 📊 Usage Guide

### 1. Trigger Manual Import

Navigate to `http://localhost:3000` and click "Import Jobs" to trigger manual import from all configured feeds.

### 2. View Import History

The dashboard shows:
- **Total jobs** processed
- **New jobs** created
- **Updated jobs** modified
- **Failed jobs** with error details
- **Processing time** and status

### 3. Real-time Updates

Progress bars and statistics update in real-time using Socket.IO during import operations.

### 4. Filter and Search

- Filter by status (Success, Failed, In Progress)
- Search by filename/URL
- Pagination for large datasets

## 🔧 API Endpoints

### Import Endpoints
- `POST /api/import/trigger` - Trigger new import
- `GET /api/import/history` - Get import history (paginated)
- `GET /api/import/history/:id` - Get specific import details
- `GET /api/import/stats` - Get overall statistics

### Job Endpoints
- `GET /api/jobs` - Get all jobs (paginated)
- `GET /api/jobs/:id` - Get job by ID
- `GET /api/jobs/search` - Search jobs

### Health Check
- `GET /api/health` - System health status
- `GET /api/health/redis` - Redis connection status
- `GET /api/health/mongodb` - MongoDB connection status

## 🏗️ Project Structure

```
scalable-job-importer/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/              # App router pages
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities and API client
│   │   └── types/            # TypeScript types
│   ├── public/               # Static assets
│   └── package.json
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── models/           # Mongoose models
│   │   ├── services/         # Business logic
│   │   ├── controllers/      # Route handlers
│   │   ├── routes/           # API routes
│   │   ├── workers/          # Queue workers
│   │   ├── middleware/       # Express middleware
│   │   ├── utils/            # Helper functions
│   │   └── index.ts          # Entry point
│   └── package.json
│
├── docs/
│   └── architecture.md       # System design documentation
│
├── docker-compose.yml        # Docker orchestration
└── README.md                 # This file
```

## 🧪 Testing

### Backend Tests

```bash
cd server
npm test                      # Run all tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report
```

### Frontend Tests

```bash
cd client
npm test
npm run test:coverage
```

## 📈 Performance Considerations

### Scalability Features

1. **Batch Processing**: Configurable batch sizes (default: 100 jobs/batch)
2. **Concurrent Workers**: Adjustable concurrency (default: 5 workers)
3. **Connection Pooling**: MongoDB connection pool optimized
4. **Indexing**: Strategic indexes on frequently queried fields
5. **Caching**: Redis caching for frequently accessed data

### Handling 1M+ Records

The system is optimized for large-scale operations:
- Bulk write operations for batch inserts
- Upsert logic to prevent duplicates
- Efficient indexing strategy
- Memory-efficient streaming for large payloads
- Queue-based processing to prevent memory overflow

### Configuration for Scale

```env
# Recommended for 1M+ records
QUEUE_CONCURRENCY=10
BATCH_SIZE=500
MAX_RETRIES=5
MONGODB_POOL_SIZE=20
```

## 🔍 Monitoring and Logging

Logs are stored in `server/logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only
- `queue.log` - Queue processing logs

**Log Levels:**
- `error` - Critical errors
- `warn` - Warnings
- `info` - General information
- `debug` - Detailed debug info

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB is running
mongosh
# Or for Docker
docker ps | grep mongo
```

**Redis Connection Failed**
```bash
# Check Redis is running
redis-cli ping
# Should return "PONG"
```

**Port Already in Use**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
# Or change PORT in .env
```

**Queue Jobs Stuck**
```bash
# Clear Redis queue
redis-cli
> FLUSHALL
```

## 🎓 Assumptions and Design Decisions

1. **Job Uniqueness**: Jobs are identified by a combination of `title`, `company`, and `location`. This ensures proper deduplication.

2. **Update Strategy**: If a job with the same identifier exists, we update it. This handles cases where job details change (salary, description, etc.).

3. **Error Handling**: Failed jobs are logged but don't stop the entire import. Each job failure is recorded with reason.

4. **Cron Schedule**: Default is hourly (`0 * * * *`). Adjust based on feed update frequency.

5. **Rate Limiting**: Not implemented on external API calls. Add if APIs have rate limits.

6. **Data Retention**: Import logs are kept indefinitely. Consider implementing archival strategy for production.

## 🚀 Deployment

### Vercel (Frontend)

```bash
cd client
vercel --prod
```

### Render (Backend)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `cd server && npm install && npm run build`
4. Set start command: `cd server && npm start`
5. Add environment variables from `.env`

### MongoDB Atlas

1. Create cluster at mongodb.com
2. Add connection string to `MONGODB_URI`
3. Whitelist IP addresses

### Redis Cloud

1. Create database at redis.com
2. Add connection details to `.env`

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions welcome! Please follow the existing code style and add tests for new features.

## 📧 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ for scalable job processing**
