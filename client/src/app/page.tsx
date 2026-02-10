'use client';

import { useState, useEffect } from 'react';
import { importAPI } from '@/lib/api';
import type { Stats } from '@/types';
import ImportHistory from '@/components/ImportHistory';
import StatsCard from '@/components/StatsCard';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const response = await importAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      await importAPI.trigger();
      alert('Import started successfully!');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to start import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Importer Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage and monitor job imports from external feeds</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Imports" value={stats.totalImports} />
            <StatsCard title="Jobs Imported" value={stats.totalJobsImported} />
            <StatsCard title="New Jobs" value={stats.totalNewJobs} color="green" />
            <StatsCard title="Updated Jobs" value={stats.totalUpdatedJobs} color="blue" />
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={handleImport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Importing...' : 'Import Jobs'}
          </button>
        </div>

        <ImportHistory refreshTrigger={refreshTrigger} />
      </div>
    </main>
  );
}
