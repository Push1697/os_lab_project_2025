import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Types for chart data
interface GrowthData {
  date: string;
  users: number;
}

interface TrendData {
  date: string;
  approved: number;
  pending: number;
  rejected: number;
}

interface StatusData {
  approved: number;
  pending: number;
  rejected: number;
}

interface ActivityData {
  _id: { hour: number; date: string };
  verifications: number;
}

interface PerformanceData {
  processing: {
    averageTime: number;
    totalProcessed: number;
  };
  success: {
    rate: number;
  };
}

interface ChartProps<T> {
  data?: T;
  loading?: boolean;
}

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Common chart options with glassmorphism theme
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 12,
          family: 'Inter, system-ui, sans-serif'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'rgba(255, 255, 255, 0.9)',
      bodyColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
        font: {
          size: 11
        }
      }
    }
  }
};

// User Growth Line Chart with Enhanced Styling
export const UserGrowthChart: React.FC<ChartProps<GrowthData[]>> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center relative">
        {/* Animated Loading with Glowing Effect */}
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-cyan-400 border-r-purple-400 shadow-[0_0_30px_rgba(34,211,238,0.6)]"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-cyan-400/20"></div>
        </div>
        <div className="ml-4 text-white/80 animate-pulse">
          <div className="h-2 bg-gradient-to-r from-cyan-400/40 to-purple-400/40 rounded w-24 mb-2"></div>
          <div className="h-2 bg-gradient-to-r from-purple-400/40 to-pink-400/40 rounded w-16"></div>
        </div>
      </div>
    );
  }

  // Enhanced chart data with gradient and glow effects
  const chartData = {
    labels: data?.map((item: GrowthData) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'New Users',
        data: data?.map((item: GrowthData) => item.users) || [],
        borderColor: 'rgba(34, 211, 238, 1)',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(34, 211, 238, 0.4)');
          gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
          gradient.addColorStop(1, 'rgba(236, 72, 153, 0.1)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 211, 238, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 10,
        pointHoverBackgroundColor: 'rgba(34, 211, 238, 1)',
        pointHoverBorderColor: 'rgba(255, 255, 255, 1)',
        pointHoverBorderWidth: 4,
        // Add shadow effect to points
        pointStyle: 'circle',
        segment: {
          borderColor: (ctx: any) => {
            const trend = ctx.p1.parsed.y > ctx.p0.parsed.y;
            return trend ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)';
          }
        }
      }
    ]
  };

  // Enhanced options with animations and glow effects
  const enhancedOptions = {
    ...commonOptions,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
      onProgress: function(animation: any) {
        // Add glow effect during animation
        const ctx = animation.chart.ctx;
        ctx.save();
        ctx.shadowColor = 'rgba(34, 211, 238, 0.8)';
        ctx.shadowBlur = 20;
        ctx.restore();
      }
    },
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        labels: {
          ...commonOptions.plugins.legend.labels,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: function(chart: any) {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            
            labels.forEach((label: any) => {
              label.fillStyle = 'rgba(34, 211, 238, 1)';
              label.strokeStyle = 'rgba(255, 255, 255, 0.8)';
              label.lineWidth = 2;
            });
            
            return labels;
          }
        }
      },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'rgba(34, 211, 238, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(34, 211, 238, 0.8)',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: true,
        mode: 'nearest' as const,
        intersect: false,
        animation: {
          duration: 300
        },
        callbacks: {
          title: function(context: any) {
            return `📅 ${context[0].label}`;
          },
          label: function(context: any) {
            const value = context.raw;
            const previousValue = context.dataIndex > 0 ? 
              context.dataset.data[context.dataIndex - 1] : value;
            const change = value - previousValue;
            const changePercent = previousValue > 0 ? 
              ((change / previousValue) * 100).toFixed(1) : '0';
            
            return [
              `👥 New Users: ${value}`,
              change !== 0 ? `📈 Change: ${change > 0 ? '+' : ''}${change} (${changePercent}%)` : ''
            ].filter(Boolean);
          }
        }
      }
    },
    scales: {
      x: {
        ...commonOptions.scales.x,
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          borderColor: 'rgba(34, 211, 238, 0.3)',
          borderWidth: 2,
          drawBorder: true,
          drawOnChartArea: true,
          lineWidth: 1
        },
        ticks: {
          ...commonOptions.scales.x.ticks,
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: 'bold' as const,
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 10
        }
      },
      y: {
        ...commonOptions.scales.y,
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          borderColor: 'rgba(34, 211, 238, 0.3)',
          borderWidth: 2,
          drawBorder: true,
          drawOnChartArea: true,
          lineWidth: 1
        },
        ticks: {
          ...commonOptions.scales.y.ticks,
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: 'bold' as const,
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 10,
          callback: function(value: any) {
            return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    hover: {
      mode: 'nearest' as const,
      intersect: false,
      animationDuration: 200
    }
  };

  return (
    <div className="h-64 relative group chart-container">
      {/* Enhanced Background Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl animate-background-drift"></div>
      
      {/* Rotating Glow Ring */}
      <div className="absolute -inset-2 opacity-0 group-hover:opacity-60 transition-opacity duration-700">
        <div className="w-full h-full border-2 border-transparent bg-gradient-to-r from-cyan-400/30 via-purple-400/30 to-pink-400/30 rounded-xl animate-rotate-glow blur-sm"></div>
      </div>
      
      {/* Chart Container with Enhanced Styling */}
      <div className="relative h-full p-2 rounded-xl glass-enhanced group-hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] transition-all duration-700 animate-float">
        <div className="animate-chart-glow">
          <Line data={chartData} options={enhancedOptions} />
        </div>
        
        {/* Enhanced Floating Stats Overlay */}
        {data && data.length > 0 && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-4 group-hover:translate-y-0">
            <div className="bg-gradient-to-br from-black/80 via-black/70 to-black/60 backdrop-blur-2xl rounded-xl px-4 py-3 border border-cyan-400/40 shadow-[0_0_30px_rgba(34,211,238,0.5)] animate-glow-pulse">
              <div className="text-xs text-cyan-300 font-bold mb-2 flex items-center animate-text-glow">
                <span className="mr-2">✨</span>
                Analytics Insights
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">Total Growth:</span>
                  <span className="text-sm text-cyan-200 font-bold">
                    +{data.reduce((sum, item) => sum + item.users, 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">Peak Day:</span>
                  <span className="text-sm text-purple-200 font-bold">
                    {Math.max(...data.map(item => item.users))}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">Average:</span>
                  <span className="text-sm text-pink-200 font-bold">
                    {Math.round(data.reduce((sum, item) => sum + item.users, 0) / data.length)}
                  </span>
                </div>
                
                {/* Trend Indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                  <span className="text-xs text-white/80">Trend:</span>
                  <div className="flex items-center">
                    {data.length > 1 && 
                     data[data.length - 1].users > data[data.length - 2].users ? (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                        <span className="text-xs text-green-300 font-semibold">Growing</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-1"></div>
                        <span className="text-xs text-red-300 font-semibold">Declining</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Bottom Glow Effect */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-48 h-3 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700 animate-shimmer"></div>
      
      {/* Side Glow Effects */}
      <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 w-2 h-24 bg-gradient-to-b from-transparent via-purple-400/50 to-transparent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 w-2 h-24 bg-gradient-to-b from-transparent via-pink-400/50 to-transparent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </div>
  );
};

// Verification Trends Bar Chart
export const VerificationTrendsChart: React.FC<ChartProps<TrendData[]>> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const chartData = {
    labels: data?.map((item: TrendData) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Approved',
        data: data?.map((item: TrendData) => item.approved) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      },
      {
        label: 'Pending',
        data: data?.map((item: TrendData) => item.pending) || [],
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: 'rgba(251, 191, 36, 1)',
        borderWidth: 1
      },
      {
        label: 'Rejected',
        data: data?.map((item: TrendData) => item.rejected) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={commonOptions} />
    </div>
  );
};

// Status Distribution Pie Chart
export const StatusDistributionChart: React.FC<ChartProps<StatusData>> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  const chartData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        data: [
          data?.approved || 0,
          data?.pending || 0,
          data?.rejected || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// System Activity Chart
export const SystemActivityChart: React.FC<ChartProps<ActivityData[]>> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  const chartData = {
    labels: data?.map((item: ActivityData) => `${item._id.hour}:00`) || [],
    datasets: [
      {
        label: 'Verifications',
        data: data?.map((item: ActivityData) => item.verifications) || [],
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={commonOptions} />
    </div>
  );
};

// Performance Metrics Chart
export const PerformanceChart: React.FC<ChartProps<PerformanceData>> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    );
  }

  const chartData = {
    labels: ['Average Time (hours)', 'Success Rate (%)', 'Total Processed'],
    datasets: [
      {
        label: 'Performance Metrics',
        data: [
          data?.processing?.averageTime || 0,
          data?.success?.rate || 0,
          Math.min(data?.processing?.totalProcessed || 0, 100) // Scale down for visualization
        ],
        backgroundColor: [
          'rgba(34, 211, 238, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgba(34, 211, 238, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const options = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        beginAtZero: true,
        max: 100
      }
    },
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: function(context: any) {
            if (context.dataIndex === 0) {
              return `Average Time: ${context.raw} hours`;
            } else if (context.dataIndex === 1) {
              return `Success Rate: ${context.raw}%`;
            } else {
              return `Total Processed: ${data?.processing?.totalProcessed || 0}`;
            }
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};