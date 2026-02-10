# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently no authentication required. In production, implement JWT or API key authentication.

---

## Import Endpoints

### Trigger Import
Start a new import process for all configured job feeds.

**Endpoint:** `POST /import/trigger`

**Request Body:**
```json
{
  "triggeredBy": "manual",  // Optional: "manual" | "cron" | "api"
  "importType": "full"      // Optional: "full" | "incremental"
}
```

**Response:** `202 Accepted`
```json
{
  "success": true,
  "message": "Import started successfully",
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "fileName": "https://jobicy.com/?feed=job_feed",
      "status": "in_progress",
      "totalFetched": 100,
      "startTime": "2026-02-09T10:30:00.000Z",
      "triggeredBy": "manual"
    }
  ]
}
```

**Rate Limit:** 10 requests per 15 minutes

---

### Get Import History
Retrieve paginated list of import logs with optional filtering.

**Endpoint:** `GET /import/history`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status ("in_progress" | "completed" | "failed")
- `fileName` (string): Search by feed URL/name
- `startDate` (ISO date string): Filter imports after this date
- `endDate` (ISO date string): Filter imports before this date

**Example:**
```
GET /import/history?page=1&limit=20&status=completed
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "fileName": "https://jobicy.com/?feed=job_feed",
      "status": "completed",
      "totalFetched": 150,
      "totalImported": 145,
      "newJobs": 120,
      "updatedJobs": 25,
      "failedJobs": 5,
      "startTime": "2026-02-09T10:30:00.000Z",
      "endTime": "2026-02-09T10:45:00.000Z",
      "duration": 900000,
      "errors": [],
      "triggeredBy": "manual",
      "createdAt": "2026-02-09T10:30:00.000Z",
      "updatedAt": "2026-02-09T10:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### Get Import by ID
Retrieve detailed information about a specific import.

**Endpoint:** `GET /import/history/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "fileName": "https://jobicy.com/?feed=job_feed",
    "status": "completed",
    "totalFetched": 150,
    "totalImported": 145,
    "newJobs": 120,
    "updatedJobs": 25,
    "failedJobs": 5,
    "errors": [
      {
        "jobId": "job-123",
        "reason": "Validation error: Missing required field 'company'",
        "timestamp": "2026-02-09T10:35:00.000Z"
      }
    ],
    "duration": 900000
  }
}
```

**Error:** `404 Not Found`
```json
{
  "success": false,
  "message": "Import log not found"
}
```

---

### Get Import Statistics
Get aggregate statistics across all imports.

**Endpoint:** `GET /import/stats`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalImports": 45,
    "completedImports": 42,
    "failedImports": 1,
    "inProgressImports": 2,
    "totalJobsImported": 125000,
    "totalNewJobs": 100000,
    "totalUpdatedJobs": 25000,
    "totalFailedJobs": 500,
    "averageDuration": 850000
  }
}
```

---

## Job Endpoints

### Get Jobs
Retrieve paginated list of jobs with optional filtering and search.

**Endpoint:** `GET /jobs`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `category` (string): Filter by category
- `jobType` (string): Filter by job type
- `search` (string): Search in title, company, or location

**Example:**
```
GET /jobs?page=1&limit=20&category=data-science&search=python
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Senior Data Scientist",
      "company": "Tech Corp",
      "location": "Remote",
      "description": "We are looking for...",
      "salary": "$120k - $150k",
      "jobType": "full-time",
      "category": "data-science",
      "url": "https://example.com/jobs/123",
      "companyUrl": "https://techcorp.com",
      "postedDate": "2026-02-01T00:00:00.000Z",
      "source": "https://jobicy.com/?feed=job_feed",
      "createdAt": "2026-02-01T10:00:00.000Z",
      "updatedAt": "2026-02-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "pages": 63
  }
}
```

---

### Get Job by ID
Retrieve detailed information about a specific job.

**Endpoint:** `GET /jobs/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Senior Data Scientist",
    "company": "Tech Corp",
    "location": "Remote",
    "description": "<p>Full job description...</p>",
    "salary": "$120k - $150k",
    "jobType": "full-time",
    "category": "data-science",
    "url": "https://example.com/jobs/123"
  }
}
```

**Error:** `404 Not Found`
```json
{
  "success": false,
  "message": "Job not found"
}
```

---

## Health Endpoints

### System Health
Check system health and connectivity status.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "uptime": 3600,
  "mongodb": "connected",
  "redis": "connected",
  "queue": {
    "waiting": 150,
    "active": 5,
    "completed": 10000,
    "failed": 25,
    "delayed": 0,
    "total": 10180
  },
  "timestamp": "2026-02-09T12:00:00.000Z"
}
```

---

## WebSocket Events

### Connection
Connect to WebSocket server for real-time updates.

**URL:** `ws://localhost:5000`

**Client Events:**
- `connect`: Fired when connection established
- `disconnect`: Fired when connection closed
- `import:cancel`: Cancel ongoing import

**Server Events:**

#### import:progress
Fired periodically during import process.

```javascript
{
  "importLogId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "processed": 50,
  "total": 150,
  "status": "Processing jobs..."
}
```

#### import:complete
Fired when import completes successfully.

```javascript
{
  "importLogId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "totalImported": 145,
  "newJobs": 120,
  "updatedJobs": 25,
  "failedJobs": 5,
  "duration": 900000
}
```

#### import:failed
Fired when import fails.

```javascript
{
  "importLogId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "error": "Failed to fetch feed: Network error"
}
```

#### job:processed
Fired when individual job is processed.

```javascript
{
  "importLogId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "jobTitle": "Senior Data Scientist",
  "isNew": true
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes
- `200` - Success
- `202` - Accepted (async operation started)
- `400` - Bad Request
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Rate Limiting

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

**Limits:**
- Import trigger: 10 requests per 15 minutes
- General API: 100 requests per 15 minutes
- WebSocket: 60 messages per minute

---

## Example Usage

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Trigger import
const triggerImport = async () => {
  const response = await axios.post(`${API_URL}/import/trigger`);
  return response.data;
};

// Get jobs
const getJobs = async (page = 1) => {
  const response = await axios.get(`${API_URL}/jobs`, {
    params: { page, limit: 20 }
  });
  return response.data;
};
```

### cURL
```bash
# Trigger import
curl -X POST http://localhost:5000/api/import/trigger

# Get import history
curl "http://localhost:5000/api/import/history?page=1&limit=10"

# Get jobs with filters
curl "http://localhost:5000/api/jobs?category=data-science&jobType=full-time"
```

---

## Best Practices

1. **Pagination**: Always use pagination for large datasets
2. **Rate Limiting**: Respect rate limits to avoid 429 errors
3. **WebSocket**: Use for real-time updates instead of polling
4. **Error Handling**: Implement retry logic with exponential backoff
5. **Search**: Debounce search requests (500ms recommended)
6. **Caching**: Cache responses when appropriate (stats, history)

---

## Support

For issues or questions:
- Check logs: `server/logs/combined.log`
- Health endpoint: `GET /api/health`
- GitHub Issues: [Project Repository](#)
