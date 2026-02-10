# Quick Start Guide

## 🚀 Fastest Way to Get Started

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd scalable-job-importer

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# Select option 2 (Docker Compose)

# 3. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Option 2: Local Development

**Prerequisites:**
- Node.js 18+
- MongoDB running on localhost:27017
- Redis running on localhost:6379

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd scalable-job-importer

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# Select option 1 (Local development)

# 3. Start Backend (Terminal 1)
cd server
npm run dev

# 4. Start Frontend (Terminal 2)
cd client
npm run dev

# 5. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## 📋 What You Get

After setup, you'll have:
- ✅ Full-stack application running
- ✅ MongoDB database ready
- ✅ Redis queue system active
- ✅ Worker processes running
- ✅ Cron job for hourly imports
- ✅ Real-time dashboard

## 🎯 First Steps

1. **Open Dashboard**: Navigate to http://localhost:3000
2. **Trigger Import**: Click "Import Jobs" button
3. **Watch Progress**: See real-time updates as jobs are imported
4. **View History**: Scroll down to see import history with statistics

## 📊 Understanding the Dashboard

### Stats Cards
- **Total Imports**: Number of import operations run
- **Jobs Imported**: Total jobs successfully imported
- **New Jobs**: Fresh job postings added to database
- **Updated Jobs**: Existing jobs that were refreshed

### Import History Table
- **Feed URL**: Source of the job data
- **Status**: Current state (in_progress, completed, failed)
- **Total**: Number of jobs fetched from feed
- **New**: New jobs created
- **Updated**: Existing jobs updated
- **Failed**: Jobs that couldn't be processed
- **Time**: When the import was triggered

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-importer
REDIS_HOST=localhost
REDIS_PORT=6379
QUEUE_CONCURRENCY=5    # Number of parallel workers
BATCH_SIZE=100         # Jobs per batch
ENABLE_CRON=true       # Auto-import every hour
```

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# For Docker:
docker ps | grep mongo
```

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# For Docker:
docker ps | grep redis
```

### Port Already in Use
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env file
```

### Queue Jobs Not Processing
```bash
# Clear Redis queue
redis-cli
> FLUSHALL
> exit

# Restart backend server
```

## 📚 Next Steps

1. **Read Architecture**: Check `docs/architecture.md` for system design
2. **Customize Feeds**: Edit feed URLs in `server/src/services/import.service.ts`
3. **Adjust Concurrency**: Modify `QUEUE_CONCURRENCY` in `.env`
4. **Scale Up**: Deploy to cloud (see README.md for deployment guides)

## 🎓 Learn More

- [Full README](../README.md)
- [Architecture Documentation](../docs/architecture.md)
- [API Documentation](#) (Coming soon)

## 💡 Tips

- **First Import**: May take 2-5 minutes for all feeds
- **Cron Job**: Runs every hour automatically (if enabled)
- **Scalability**: System handles 1M+ records efficiently
- **Real-time**: Dashboard updates automatically during imports

## 🆘 Need Help?

- Check logs: `server/logs/combined.log`
- View queue status: http://localhost:5000/api/health
- Open GitHub issue for bugs

---

**Happy Importing! 🎉**
