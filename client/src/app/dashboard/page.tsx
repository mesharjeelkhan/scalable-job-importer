'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { importAPI } from '@/lib/api';
import type { Stats } from '@/types';
import ImportHistory from '@/components/ImportHistory';
import StatsCard from '@/components/StatsCard';
import ProgressBar from '@/components/ProgressBar';
import ImportChart from '@/components/ImportChart';

export default function EnhancedDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    fetchStats();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const setupWebSocket = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const newSocket = io(apiUrl);

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
    });

    newSocket.on('import:progress', (data) => {
      console.log('Progress update:', data);
      setImportProgress({
        current: data.processed,
        total: data.total,
        status: data.status,
      });
    });

    newSocket.on('import:complete', (data) => {
      console.log('Import complete:', data);
      setImportProgress(null);
      setRefreshTrigger(prev => prev + 1);
      alert(`Import completed! ${data.totalImported} jobs processed.`);
    });

    newSocket.on('import:failed', (data) => {
      console.log('Import failed:', data);
      setImportProgress(null);
      alert(`Import failed: ${data.error}`);
    });

    setSocket(newSocket);
  };

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
      setImportProgress({
        current: 0,
        total: 100,
        status: 'Starting import...',
      });
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to start import');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelImport = () => {
    if (socket) {
      socket.emit('import:cancel');
      setImportProgress(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-blue-600">⚡</span>
                Job Importer Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage and monitor job imports from external feeds
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 transition flex items-center gap-2"
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {importProgress && (
          <div className="mb-6">
            <ProgressBar
              current={importProgress.current}
              total={importProgress.total}
              status={importProgress.status}
              onCancel={handleCancelImport}
            />
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Total Imports" 
              value={stats.totalImports} 
              icon="📊"
            />
            <StatsCard 
              title="Jobs Imported" 
              value={stats.totalJobsImported} 
              icon="💼"
              color="blue"
            />
            <StatsCard 
              title="New Jobs" 
              value={stats.totalNewJobs} 
              icon="✨"
              color="green"
            />
            <StatsCard 
              title="Updated Jobs" 
              value={stats.totalUpdatedJobs} 
              icon="🔄"
              color="yellow"
            />
          </div>
        )}

        {/* Chart */}
        <div className="mb-8">
          <ImportChart refreshTrigger={refreshTrigger} />
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={handleImport}
            disabled={loading || !!importProgress}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⚙️</span> Starting...
              </>
            ) : (
              <>
                <span></span> Import Jobs
              </>
            )}
          </button>
          
          {stats && stats.inProgressImports > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <span className="animate-pulse">⚠️</span>
              <span className="font-medium">
                {stats.inProgressImports} import(s) in progress
              </span>
            </div>
          )}
        </div>

        {/* Import History */}
        <ImportHistory refreshTrigger={refreshTrigger} />
      </div>
    </main>
  );
}
