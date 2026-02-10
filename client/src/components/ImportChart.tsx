'use client';

import { useState, useEffect } from 'react';
import { importAPI } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';

interface Props {
  refreshTrigger: number;
}

export default function ImportChart({ refreshTrigger }: Props) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    fetchChartData();
  }, [refreshTrigger]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await importAPI.getHistory({ limit: 10 });
      const logs = response.data.data;

      const data = logs.reverse().map((log: any) => ({
        date: format(new Date(log.createdAt), 'MMM dd'),
        'New Jobs': log.newJobs,
        'Updated Jobs': log.updatedJobs,
        'Failed Jobs': log.failedJobs,
        Total: log.totalImported,
      }));

      setChartData(data);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span>📈</span>
          Import Trends
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              chartType === 'line'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Line Chart
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No data available. Run an import to see trends.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="New Jobs" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Updated Jobs" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Failed Jobs" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="New Jobs"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Updated Jobs"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Failed Jobs"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
