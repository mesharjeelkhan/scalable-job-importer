interface StatsCardProps {
  title: string;
  value: number;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({ title, value, icon, color = 'blue', trend }: StatsCardProps) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 text-white',
    green: 'from-green-500 to-green-600 text-white',
    yellow: 'from-yellow-500 to-yellow-600 text-white',
    red: 'from-red-500 to-red-600 text-white',
    purple: 'from-purple-500 to-purple-600 text-white',
  };

  const shadowColors = {
    blue: 'shadow-blue-200',
    green: 'shadow-green-200',
    yellow: 'shadow-yellow-200',
    red: 'shadow-red-200',
    purple: 'shadow-purple-200',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 shadow-lg ${shadowColors[color]} transform hover:scale-105 transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-4xl font-bold mt-3">{value.toLocaleString()}</p>
          
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span className={trend.isPositive ? '↑' : '↓'}>
                {trend.isPositive ? '↑' : '↓'}
              </span>
              <span className="text-sm opacity-90">
                {Math.abs(trend.value)}% from last week
              </span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="text-4xl opacity-80">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
