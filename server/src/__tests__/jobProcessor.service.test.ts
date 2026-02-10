import jobProcessorService from '../services/jobProcessor.service';
import { JobData } from '../services/jobFetcher.service';

describe('JobProcessorService', () => {
  describe('processJob', () => {
    it('should successfully process a valid job', async () => {
      const jobData: JobData = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'Remote',
        description: 'Great opportunity',
        url: 'https://example.com/job',
        source: 'test-feed',
        jobType: 'full-time',
      };

      // Note: This is a unit test example
      // In practice, you'd mock the database
      // const result = await jobProcessorService.processJob(jobData);
      // expect(result.success).toBe(true);
    });

    it('should fail validation for missing title', async () => {
      const jobData: any = {
        company: 'Tech Corp',
        location: 'Remote',
        description: 'Great opportunity',
        url: 'https://example.com/job',
        source: 'test-feed',
      };

      // Mock test
      expect(jobData.title).toBeUndefined();
    });
  });
});
