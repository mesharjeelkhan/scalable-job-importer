interface FilterPanelProps {
  filters: {
    category: string;
    jobType: string;
  };
  onChange: (filterType: string, value: string) => void;
  onClear: () => void;
}

export default function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const categories = [
    'design-multimedia',
    'data-science',
    'copywriting',
    'business',
    'management',
    'smm',
    'seller',
    'higher-education',
  ];

  const jobTypes = ['full-time', 'part-time', 'contract', 'freelance'];

  const hasActiveFilters = filters.category || filters.jobType;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🎯</span>
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Category
        </label>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() =>
                onChange('category', filters.category === category ? '' : category)
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                filters.category === category
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Job Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Job Type
        </label>
        <div className="space-y-2">
          {jobTypes.map((type) => (
            <button
              key={type}
              onClick={() =>
                onChange('jobType', filters.jobType === type ? '' : type)
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                filters.jobType === type
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {type.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
