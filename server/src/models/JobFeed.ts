import mongoose, { Document, Schema } from 'mongoose';

export interface IJobFeed extends Document {
  url: string;
  name: string;
  category?: string;
  active: boolean;
  lastFetchedAt?: Date;
  lastSuccessfulFetch?: Date;
  fetchCount: number;
  failureCount: number;
  totalJobsEverFetched: number;
  averageJobsPerFetch: number;
  fetchInterval: number;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const JobFeedSchema = new Schema<IJobFeed>(
  {
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastFetchedAt: Date,
    lastSuccessfulFetch: Date,
    fetchCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    totalJobsEverFetched: {
      type: Number,
      default: 0,
    },
    averageJobsPerFetch: {
      type: Number,
      default: 0,
    },
    fetchInterval: {
      type: Number,
      default: 60, // minutes
    },
    priority: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active feeds
JobFeedSchema.index({ active: 1, lastFetchedAt: 1 });

export default mongoose.model<IJobFeed>('JobFeed', JobFeedSchema);
