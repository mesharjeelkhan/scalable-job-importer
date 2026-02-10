export interface ImportLog {
  _id: string;
  fileName: string;
  status: 'in_progress' | 'completed' | 'failed';
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  triggeredBy: 'manual' | 'cron' | 'api';
  createdAt: string;
}

export interface Stats {
  totalImports: number;
  completedImports: number;
  totalJobsImported: number;
  totalNewJobs: number;
  totalUpdatedJobs: number;
}
