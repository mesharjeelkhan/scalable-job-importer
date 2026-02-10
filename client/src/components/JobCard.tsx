import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: {
    _id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    salary?: string;
    jobType?: string;
    category?: string;
    url: string;
    postedDate?: string;
    createdAt: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
  };

  const getJobTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'full-time':
        return 'bg-green-100 text-green-800';
      case 'part-time':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      case 'freelance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition">
            {job.title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <span>🏢</span>
              {job.company}
            </span>
            <span className="flex items-center gap-1">
              <span>📍</span>
              {job.location}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 text-sm line-clamp-3">
          {stripHtml(job.description)}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {job.jobType && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.jobType)}`}>
            {job.jobType}
          </span>
        )}
        {job.category && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {job.category}
          </span>
        )}
        {job.salary && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            💰 {job.salary}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Posted {formatDistanceToNow(new Date(job.postedDate || job.createdAt), { addSuffix: true })}
        </span>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition flex items-center gap-2"
        >
          Apply Now
          <span>→</span>
        </a>
      </div>
    </div>
  );
}
