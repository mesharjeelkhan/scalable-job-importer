'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import JobCard from '@/components/JobCard';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Job {
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
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    jobType: '',
  });

  useEffect(() => {
    fetchJobs();
  }, [page, filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.jobType) params.jobType = filters.jobType;

      const response = await axios.get(`${API_URL}/api/jobs`, { params });
      
      setJobs(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters({ ...filters, search: searchTerm });
    setPage(1);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters({ ...filters, [filterType]: value });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', category: '', jobType: '' });
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-blue-600">💼</span>
            Browse Jobs
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Explore {jobs.length > 0 && `${jobs.length} available`} job opportunities
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} initialValue={filters.search} />
        </div>

        <div className="flex gap-6">
          {/* Filter Panel */}
          <aside className="w-64 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </aside>

          {/* Jobs Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={handleClearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job) => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>

                    <div className="flex gap-2">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`py-2 px-4 rounded-lg font-medium transition ${
                              page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
