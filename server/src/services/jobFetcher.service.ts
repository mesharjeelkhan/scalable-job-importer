import axios from 'axios';
import xml2js from 'xml2js';
import logger from '../utils/logger';
import JobFeed from '../models/JobFeed';

export interface JobData {
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
}

export class JobFetcherService {
  private parser: xml2js.Parser;

  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      trim: true,
    });
  }

  /**
   * Fetch jobs from external API
   */
  async fetchFeed(url: string): Promise<JobData[]> {
    try {
      logger.info(`Fetching jobs from: ${url}`);

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Job-Importer/1.0',
        },
      });

      const jobs = await this.parseXML(response.data, url);
      
      // Update feed metadata
      await this.updateFeedMetadata(url, jobs.length, true);

      logger.info(`Fetched ${jobs.length} jobs from ${url}`);
      return jobs;
    } catch (error) {
      logger.error(`Failed to fetch from ${url}:`, error);
      await this.updateFeedMetadata(url, 0, false);
      throw error;
    }
  }

  /**
   * Parse XML to JSON
   */
  private async parseXML(xml: string, source: string): Promise<JobData[]> {
    try {
      const result = await this.parser.parseStringPromise(xml);
      
      // Handle different XML structures
      let items: any[] = [];

      if (result.rss?.channel?.item) {
        items = Array.isArray(result.rss.channel.item)
          ? result.rss.channel.item
          : [result.rss.channel.item];
      } else if (result.feed?.entry) {
        items = Array.isArray(result.feed.entry)
          ? result.feed.entry
          : [result.feed.entry];
      }

      return items.map((item) => this.normalizeJob(item, source));
    } catch (error) {
      logger.error('XML parsing error:', error);
      throw new Error('Failed to parse XML');
    }
  }

  /**
   * Normalize job data from different feed formats
   */
  private normalizeJob(rawJob: any, source: string): JobData {
    // Handle Jobicy format
    if (rawJob.title && rawJob.description) {
      return {
        title: this.extractText(rawJob.title),
        company: this.extractText(rawJob['job_listing:company']) || 
                 this.extractText(rawJob.company) || 
                 'Unknown',
        location: this.extractText(rawJob['job_listing:location']) || 
                  this.extractText(rawJob.location) || 
                  'Remote',
        description: this.extractText(rawJob.description) || 
                     this.extractText(rawJob['content:encoded']) || 
                     '',
        salary: this.extractText(rawJob['job_listing:salary']) || 
                this.extractText(rawJob.salary),
        jobType: this.extractText(rawJob['job_listing:job_type']) || 
                 this.extractText(rawJob.job_type) || 
                 'full-time',
        category: this.extractText(rawJob.category) || 
                  this.extractCategoryFromUrl(source),
        url: this.extractText(rawJob.link) || 
             this.extractText(rawJob.guid),
        companyUrl: this.extractText(rawJob['job_listing:company_website']) || 
                    this.extractText(rawJob.company_website),
        postedDate: this.parseDate(rawJob.pubDate || rawJob.published),
        expiryDate: this.parseDate(rawJob['job_listing:application_deadline']),
        source,
        sourceId: this.extractText(rawJob.guid) || 
                  this.extractText(rawJob.id),
      };
    }

    // Handle HigherEdJobs format (Atom feed)
    if (rawJob.id && rawJob.summary) {
      return {
        title: this.extractText(rawJob.title),
        company: this.extractText(rawJob.author?.name) || 'Unknown',
        location: this.extractLocation(rawJob),
        description: this.extractText(rawJob.summary) || 
                     this.extractText(rawJob.content),
        url: this.extractLink(rawJob.link),
        postedDate: this.parseDate(rawJob.published || rawJob.updated),
        source,
        sourceId: this.extractText(rawJob.id),
        jobType: 'full-time',
        category: 'higher-education',
      };
    }

    // Generic fallback
    return {
      title: this.extractText(rawJob.title) || 'Untitled',
      company: 'Unknown',
      location: 'Unknown',
      description: this.extractText(rawJob.description) || '',
      url: this.extractText(rawJob.link) || '',
      source,
      jobType: 'full-time',
    };
  }

  /**
   * Extract text from various formats
   */
  private extractText(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (value._) return value._.trim();
    if (value['#text']) return value['#text'].trim();
    if (typeof value === 'object' && value.toString) {
      return value.toString().trim();
    }
    return '';
  }

  /**
   * Extract category from URL
   */
  private extractCategoryFromUrl(url: string): string {
    const categoryMatch = url.match(/job_categories=([^&]+)/);
    return categoryMatch ? categoryMatch[1] : 'general';
  }

  /**
   * Extract location from Atom feed
   */
  private extractLocation(item: any): string {
    if (item.location) return this.extractText(item.location);
    
    // Try to extract from summary/content
    const text = this.extractText(item.summary) || this.extractText(item.content);
    const locationMatch = text.match(/Location[:\s]+([^<\n]+)/i);
    return locationMatch ? locationMatch[1].trim() : 'Unknown';
  }

  /**
   * Extract link from Atom feed
   */
  private extractLink(link: any): string {
    if (!link) return '';
    if (typeof link === 'string') return link;
    if (Array.isArray(link)) {
      const altLink = link.find((l) => l.$.rel === 'alternate');
      return altLink?.$.href || link[0]?.$.href || '';
    }
    if (link.$ && link.$.href) return link.$.href;
    return '';
  }

  /**
   * Parse date string
   */
  private parseDate(dateString: any): Date | undefined {
    if (!dateString) return undefined;
    const text = this.extractText(dateString);
    const date = new Date(text);
    return isNaN(date.getTime()) ? undefined : date;
  }

  /**
   * Update feed metadata
   */
  private async updateFeedMetadata(
    url: string,
    jobCount: number,
    success: boolean
  ): Promise<void> {
    try {
      const feed = await JobFeed.findOne({ url });

      if (feed) {
        feed.lastFetchedAt = new Date();
        feed.fetchCount += 1;

        if (success) {
          feed.lastSuccessfulFetch = new Date();
          feed.totalJobsEverFetched += jobCount;
          feed.averageJobsPerFetch =
            Math.round(feed.totalJobsEverFetched / feed.fetchCount);
        } else {
          feed.failureCount += 1;
        }

        await feed.save();
      } else {
        // Create new feed record
        await JobFeed.create({
          url,
          name: this.extractFeedName(url),
          category: this.extractCategoryFromUrl(url),
          active: true,
          lastFetchedAt: new Date(),
          lastSuccessfulFetch: success ? new Date() : undefined,
          fetchCount: 1,
          failureCount: success ? 0 : 1,
          totalJobsEverFetched: jobCount,
          averageJobsPerFetch: jobCount,
        });
      }
    } catch (error) {
      logger.error('Failed to update feed metadata:', error);
    }
  }

  /**
   * Extract friendly name from URL
   */
  private extractFeedName(url: string): string {
    const categoryMatch = url.match(/job_categories=([^&]+)/);
    if (categoryMatch) {
      return `Jobicy - ${categoryMatch[1]}`;
    }
    if (url.includes('higheredjobs')) {
      return 'HigherEdJobs';
    }
    return new URL(url).hostname;
  }
}

export default new JobFetcherService();
