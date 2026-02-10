interface ProgressBarProps {
  current: number;
  total: number;
  status: string;
  onCancel?: () => void;
}

export default function ProgressBar({ current, total, status, onCancel }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="animate-spin">⚙️</span>
            Import In Progress
          </h3>
          <p className="text-sm text-gray-600 mt-1">{status}</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {current.toLocaleString()} / {total.toLocaleString()} jobs
          </span>
          <span className="text-sm font-bold text-blue-600">
            {percentage}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>Started: {new Date().toLocaleTimeString()}</span>
          <span>Estimated time: {Math.ceil((total - current) / 10)} min</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
