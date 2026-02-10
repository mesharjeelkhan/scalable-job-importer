import mongoose, { Document, Schema } from 'mongoose';

export interface IImportError {
  jobId?: string;
  reason: string;
  timestamp: Date;
  stackTrace?: string;
}

export interface IImportLog extends Document {
  fileName: string;
  status: 'in_progress' | 'completed' | 'failed';
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errors: IImportError[];
  triggeredBy: 'manual' | 'cron' | 'api';
  importType: 'full' | 'incremental';
  createdAt: Date;
  updatedAt: Date;
}

const ImportErrorSchema = new Schema<IImportError>(
  {
    jobId: String,
    reason: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    stackTrace: String,
  },
  { _id: false }
);

const ImportLogSchema = new Schema<IImportLog>(
  {
    fileName: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed'],
      default: 'in_progress',
      index: true,
    },
    totalFetched: {
      type: Number,
      default: 0,
    },
    totalImported: {
      type: Number,
      default: 0,
    },
    newJobs: {
      type: Number,
      default: 0,
    },
    updatedJobs: {
      type: Number,
      default: 0,
    },
    failedJobs: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    duration: Number,
    errors: [ImportErrorSchema],
    triggeredBy: {
      type: String,
      enum: ['manual', 'cron', 'api'],
      default: 'manual',
    },
    importType: {
      type: String,
      enum: ['full', 'incremental'],
      default: 'full',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
ImportLogSchema.index({ createdAt: -1 });
ImportLogSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IImportLog>('ImportLog', ImportLogSchema);
