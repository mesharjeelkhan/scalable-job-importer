import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  jobType?: string;
  category?: string;
  url: string;
  companyUrl?: string;
  postedDate?: Date;
  expiryDate?: Date;
  source: string;
  sourceId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    salary: {
      type: String,
      trim: true,
    },
    jobType: {
      type: String,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    companyUrl: {
      type: String,
      trim: true,
    },
    postedDate: {
      type: Date,
      index: true,
    },
    expiryDate: {
      type: Date,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    sourceId: {
      type: String,
      trim: true,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for deduplication
JobSchema.index(
  { title: 1, company: 1, location: 1 },
  { unique: true, name: 'unique_job_idx' }
);

// Index for source tracking
JobSchema.index({ source: 1, sourceId: 1 });

// Index for common queries
JobSchema.index({ category: 1, jobType: 1 });
JobSchema.index({ postedDate: -1 });
JobSchema.index({ createdAt: -1 });

export default mongoose.model<IJob>('Job', JobSchema);
