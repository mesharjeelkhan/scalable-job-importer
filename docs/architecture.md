# System Architecture Documentation

## 🏛️ High-Level Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Next.js Frontend (React 18)                     │  │
│  │  - Dashboard UI                                           │  │
│  │  - Real-time Updates (Socket.IO)                          │  │
│  │  - Import History Viewer                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Express.js REST API                          │  │
│  │  - Request validation                                     │  │
│  │  - Authentication/Authorization (future)                  │  │
│  │  - Rate limiting                                          │  │
│  │  - Error handling                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────┬──────────────────────────┘
             │                        │
             ▼                        ▼
┌─────────────────────┐  ┌────────────────────────────┐
│  Service Layer      │  │   Queue Management         │
│  ┌───────────────┐  │  │  ┌──────────────────────┐  │
│  │ Job Service   │  │  │  │   Bull Queue         │  │
│  │ - Fetch       │  │  │  │   (Redis-backed)     │  │
│  │ - Transform   │  │  │  │  - Job scheduling    │  │
│  │ - Validate    │  │  │  │  - Retry logic       │  │
│  └───────────────┘  │  │  │  - Concurrency       │  │
│  ┌───────────────┐  │  │  └──────────────────────┘  │
│  │ Import Service│  │  │           │                 │
│  │ - Orchestrate │  │  │           ▼                 │
│  │ - Track       │  │  │  ┌──────────────────────┐  │
│  │ - Log         │  │  │  │   Worker Processes   │  │
│  └───────────────┘  │  │  │  - Process jobs      │  │
└─────────┬───────────┘  │  │  - Insert/Update DB  │  │
          │              │  │  - Handle errors     │  │
          │              │  └──────────────────────┘  │
          │              └────────────┬───────────────┘
          │                           │
          ▼                           ▼
┌──────────────────────────────────────────────────────┐
│              Data Persistence Layer                   │
│  ┌────────────────────┐    ┌─────────────────────┐  │
│  │   MongoDB          │    │      Redis          │  │
│  │  - jobs            │    │  - Queue data       │  │
│  │  - import_logs     │    │  - Cache            │  │
│  │  - job_feeds       │    │  - Pub/Sub          │  │
│  └────────────────────┘    └─────────────────────┘  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│            External Integration Layer                 │
│  - Jobicy API (9 feeds)                              │
│  - HigherEdJobs API                                  │
│  - Future API integrations                           │
└──────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### Import Workflow

```
1. TRIGGER (Manual/Cron)
   │
   ├─► Import Controller receives request
   │
2. FETCH PHASE
   │
   ├─► Job Fetcher Service loops through all feed URLs
   │   ├─► Fetch XML from external API
   │   ├─► Parse XML to JSON (xml2js)
   │   ├─► Normalize data structure
   │   └─► Store raw feed in job_feeds collection
   │
3. QUEUE PHASE
   │
   ├─► Create import log entry (status: 'in_progress')
   │   
   ├─► For each job in feed:
   │   └─► Add to Bull queue with metadata
   │
4. PROCESSING PHASE (Worker)
   │
   ├─► Worker picks job from queue (concurrency: 5)
   │   │
   │   ├─► Validate job data
   │   │
   │   ├─► Check for duplicates (title + company + location)
   │   │
   │   ├─► Upsert to MongoDB
   │   │   ├─► If exists: UPDATE (increment updatedJobs counter)
   │   │   └─► If new: INSERT (increment newJobs counter)
   │   │
   │   ├─► On Success:
   │   │   ├─► Increment totalImported
   │   │   └─► Emit progress via Socket.IO
   │   │
   │   └─► On Failure:
   │       ├─► Log error details
   │       ├─► Increment failedJobs
   │       └─► Retry with exponential backoff (max: 3 times)
   │
5. COMPLETION PHASE
   │
   ├─► Update import log (status: 'completed' or 'failed')
   ├─► Calculate statistics
   └─► Emit final status via Socket.IO
```

## 🗄️ Database Schema

### MongoDB Collections

#### 1. jobs
```javascript
{
  _id: ObjectId,
  title: String,              // Job title
  company: String,            // Company name
  location: String,           // Job location
  description: String,        // Full job description (HTML/Text)
  salary: String,             // Salary information
  jobType: String,            // full-time, part-time, contract, etc.
  category: String,           // Job category
  url: String,                // Application URL
  companyUrl: String,         // Company website
  postedDate: Date,           // When job was posted
  expiryDate: Date,           // Application deadline
  source: String,             // Feed URL/source identifier
  sourceId: String,           // External job ID
  
  // Metadata
  createdAt: Date,            // First import timestamp
  updatedAt: Date,            // Last update timestamp
  lastSyncedAt: Date,         // Last sync from feed
  
  // Composite unique index
  // Index: { title: 1, company: 1, location: 1 }
  // Index: { source: 1, sourceId: 1 }
  // Index: { category: 1, jobType: 1 }
  // Index: { postedDate: -1 }
}
```

#### 2. import_logs
```javascript
{
  _id: ObjectId,
  fileName: String,           // Feed URL/name
  status: String,             // 'in_progress', 'completed', 'failed'
  
  // Counters
  totalFetched: Number,       // Total jobs in feed
  totalImported: Number,      // Successfully processed
  newJobs: Number,            // New records created
  updatedJobs: Number,        // Existing records updated
  failedJobs: Number,         // Failed to process
  
  // Timing
  startTime: Date,
  endTime: Date,
  duration: Number,           // Milliseconds
  
  // Error tracking
  errors: [{
    jobId: String,
    reason: String,
    timestamp: Date,
    stackTrace: String
  }],
  
  // Metadata
  triggeredBy: String,        // 'manual', 'cron', 'api'
  importType: String,         // 'full', 'incremental'
  
  createdAt: Date,
  updatedAt: Date,
  
  // Indexes
  // Index: { createdAt: -1 }
  // Index: { status: 1, createdAt: -1 }
  // Index: { fileName: 1 }
}
```

#### 3. job_feeds
```javascript
{
  _id: ObjectId,
  url: String,                // Feed URL (unique)
  name: String,               // Friendly name
  category: String,           // Feed category
  active: Boolean,            // Is feed enabled
  
  // Fetch metadata
  lastFetchedAt: Date,
  lastSuccessfulFetch: Date,
  fetchCount: Number,
  failureCount: Number,
  
  // Feed stats
  totalJobsEverFetched: Number,
  averageJobsPerFetch: Number,
  
  // Configuration
  fetchInterval: Number,      // Minutes
  priority: Number,           // Processing priority
  
  createdAt: Date,
  updatedAt: Date,
  
  // Index: { url: 1 } (unique)
  // Index: { active: 1, lastFetchedAt: 1 }
}
```

### Redis Data Structures

#### Queue Storage
```
bull:job-import:id:1          // Job data
bull:job-import:id:2
bull:job-import:active        // Active jobs set
bull:job-import:wait          // Waiting jobs list
bull:job-import:completed     // Completed jobs set
bull:job-import:failed        // Failed jobs set
bull:job-import:delayed       // Delayed jobs sorted set
```

#### Cache (Optional)
```
cache:job:{jobId}             // Individual job cache
cache:import-stats            // Dashboard statistics
cache:feed:{feedUrl}          // Feed cache (TTL: 1 hour)
```

## 🔧 Core Services

### 1. JobFetcherService
**Responsibility**: Fetch and parse external job feeds

```typescript
class JobFetcherService {
  async fetchFeed(url: string): Promise<JobFeed>
  async parseXML(xml: string): Promise<Job[]>
  async normalizeJob(rawJob: any): Job
  async storeFeedMetadata(feed: JobFeed): Promise<void>
}
```

**Key Logic**:
- HTTP client with retry and timeout
- XML to JSON conversion (xml2js)
- Data normalization across different feed formats
- Error handling for malformed feeds

### 2. JobImportService
**Responsibility**: Orchestrate import process

```typescript
class JobImportService {
  async triggerImport(options: ImportOptions): Promise<ImportLog>
  async createImportLog(fileName: string): Promise<ImportLog>
  async updateImportLog(id: string, updates: Partial<ImportLog>): Promise<void>
  async getImportHistory(filters: ImportFilters): Promise<ImportLog[]>
}
```

**Key Logic**:
- Create import log entry
- Queue jobs for processing
- Track progress and statistics
- Handle completion/failure

### 3. JobQueueService
**Responsibility**: Manage Bull queue

```typescript
class JobQueueService {
  async addJob(job: Job, options: JobOptions): Promise<void>
  async addBulk(jobs: Job[]): Promise<void>
  async getJobStatus(jobId: string): Promise<JobStatus>
  async retryFailedJobs(importLogId: string): Promise<void>
}
```

**Configuration**:
```typescript
{
  concurrency: 5,              // Parallel workers
  attempts: 3,                 // Retry attempts
  backoff: {
    type: 'exponential',
    delay: 2000                // 2s, 4s, 8s
  },
  removeOnComplete: true,      // Cleanup completed jobs
  removeOnFail: false          // Keep failed for analysis
}
```

### 4. JobProcessorService
**Responsibility**: Process individual jobs

```typescript
class JobProcessorService {
  async processJob(job: Job, importLogId: string): Promise<ProcessResult>
  async validateJob(job: Job): ValidationResult
  async upsertJob(job: Job): Promise<UpsertResult>
}
```

**Upsert Logic**:
```typescript
// Unique identifier
const uniqueKey = {
  title: job.title.toLowerCase().trim(),
  company: job.company.toLowerCase().trim(),
  location: job.location.toLowerCase().trim()
};

// Upsert operation
const result = await JobModel.findOneAndUpdate(
  uniqueKey,
  {
    $set: job,
    $setOnInsert: { createdAt: new Date() },
    $currentDate: { updatedAt: true }
  },
  {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  }
);

// Determine if new or updated
const isNew = !result.createdAt || 
              result.createdAt.getTime() === result.updatedAt.getTime();
```

## 🚀 Scalability Considerations

### Horizontal Scaling

**Current**: Single-server architecture
**Future**: Microservices-ready design

```
Potential Microservices Breakdown:
├── API Gateway Service (Express)
├── Job Fetcher Service (Separate process)
├── Queue Worker Service (Multiple instances)
├── Import Log Service
└── WebSocket Service (Socket.IO)
```

**Migration Path**:
1. Extract services to separate modules (✅ Done)
2. Add service-to-service communication layer (gRPC/HTTP)
3. Implement API gateway (Kong/Express Gateway)
4. Deploy services independently
5. Add service discovery (Consul/Eureka)
6. Implement distributed tracing (Jaeger)

### Handling 1M+ Records

#### Batch Processing Strategy
```typescript
const BATCH_SIZE = 500;      // Jobs per batch
const CONCURRENCY = 10;      // Parallel workers

// Process in batches to avoid memory overflow
for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
  const batch = jobs.slice(i, i + BATCH_SIZE);
  await queue.addBulk(batch);
}
```

#### Database Optimization
```javascript
// Bulk write operations
const bulkOps = jobs.map(job => ({
  updateOne: {
    filter: { title: job.title, company: job.company },
    update: { $set: job },
    upsert: true
  }
}));

await JobModel.bulkWrite(bulkOps, { ordered: false });
```

#### Index Strategy
```javascript
// Compound indexes for common queries
db.jobs.createIndex({ title: 1, company: 1, location: 1 }, { unique: true });
db.jobs.createIndex({ source: 1, sourceId: 1 });
db.jobs.createIndex({ category: 1, jobType: 1 });
db.jobs.createIndex({ postedDate: -1 });
db.jobs.createIndex({ createdAt: -1 });

// Import logs indexes
db.import_logs.createIndex({ createdAt: -1 });
db.import_logs.createIndex({ status: 1, createdAt: -1 });
```

#### Memory Management
- Stream large datasets instead of loading into memory
- Use MongoDB cursor iteration for large result sets
- Implement pagination for API responses
- Clear queue completed jobs periodically

### Performance Benchmarks

**Target Performance** (1M records):
- Fetch time: ~5-10 minutes
- Queue time: ~2-3 minutes
- Processing time: ~30-60 minutes (depends on concurrency)
- Total time: ~40-75 minutes

**Optimization Levers**:
1. Increase worker concurrency (10-20 workers)
2. Increase batch size (500-1000)
3. Use bulk operations
4. Optimize network I/O
5. Add caching layer

## 🔐 Security Considerations

### Current Implementation
- Environment variable configuration
- CORS protection
- Input validation
- Error sanitization (don't expose stack traces)

### Future Enhancements
- API authentication (JWT)
- Rate limiting per user/IP
- Request signing for webhooks
- Audit logging
- Data encryption at rest
- Secret management (Vault)

## 📊 Monitoring and Observability

### Logging Strategy
```
Winston Logger with multiple transports:
├── Console (development)
├── File (combined.log)
├── File (error.log)
└── File (queue.log)

Future: Send to ELK/Datadog/CloudWatch
```

### Metrics to Track
- Import duration
- Jobs processed per second
- Queue depth
- Worker utilization
- Error rate
- Database query performance
- API response times

### Health Checks
```typescript
GET /api/health
{
  status: 'healthy',
  uptime: 3600,
  mongodb: 'connected',
  redis: 'connected',
  queue: {
    waiting: 150,
    active: 5,
    completed: 1000,
    failed: 5
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
- Service layer logic
- Data transformation functions
- Validation logic

### Integration Tests
- API endpoints
- Database operations
- Queue processing

### End-to-End Tests
- Complete import workflow
- Error handling scenarios
- Real-time updates

## 🔄 Future Enhancements

1. **Advanced Deduplication**
   - Use fuzzy matching for job titles
   - ML-based duplicate detection

2. **Smart Scheduling**
   - Adaptive cron based on feed update frequency
   - Priority-based queue processing

3. **Data Enrichment**
   - Geocoding for locations
   - Salary normalization
   - Company metadata enrichment

4. **Analytics Dashboard**
   - Job trends over time
   - Source performance
   - Category distribution

5. **Webhook Support**
   - Notify external systems on import completion
   - Custom integrations

6. **Multi-tenancy**
   - Support multiple organizations
   - Isolated data per tenant

## 📚 References

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [MongoDB Bulk Operations](https://docs.mongodb.com/manual/core/bulk-write-operations/)
- [Next.js Best Practices](https://nextjs.org/docs)
- [Node.js Scaling](https://nodejs.org/en/docs/guides/scaling-applications/)
