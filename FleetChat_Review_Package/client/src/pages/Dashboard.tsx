import { useQuery } from "@tanstack/react-query";
import { Truck, Users, FileText, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalTransports: number;
  activeTransports: number;
  completedTransports: number;
  totalDrivers: number;
  totalDispatchers: number;
  pendingDocuments: number;
  transportsByStatus: {
    pending: number;
    enRoute: number;
    delivered: number;
    completed: number;
  };
}

function StatCard({ title, value, icon: Icon, trend }: {
  title: string;
  value: number;
  icon: any;
  trend?: string;
}) {
  return (
    <div className="workflow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </div>
  );
}

function StatusChart({ data }: { data: DashboardStats['transportsByStatus'] }) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  
  return (
    <div className="workflow-card">
      <h3 className="text-lg font-semibold mb-4">Transport Status Distribution</h3>
      <div className="space-y-3">
        {Object.entries(data).map(([status, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'pending' ? 'bg-yellow-500' :
                  status === 'enRoute' ? 'bg-blue-500' :
                  status === 'delivered' ? 'bg-green-500' :
                  'bg-gray-500'
                }`} />
                <span className="text-sm capitalize">{status.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{count}</span>
                <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load dashboard</h3>
            <p className="text-muted-foreground">Unable to fetch dashboard statistics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">FleetChat Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Transports"
              value={stats.totalTransports}
              icon={Truck}
              trend={`${stats.activeTransports} active`}
            />
            <StatCard
              title="Drivers"
              value={stats.totalDrivers}
              icon={Users}
              trend="GDPR compliant"
            />
            <StatCard
              title="Dispatchers"
              value={stats.totalDispatchers}
              icon={Users}
            />
            <StatCard
              title="Completed Transports"
              value={stats.completedTransports}
              icon={TrendingUp}
              trend="This month"
            />
            <StatCard
              title="Pending Documents"
              value={stats.pendingDocuments}
              icon={FileText}
              trend="Needs approval"
            />
            <StatCard
              title="Active Workflows"
              value={stats.activeTransports}
              icon={Truck}
              trend="In progress"
            />
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusChart data={stats.transportsByStatus} />
            
            <div className="workflow-card">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Transport completed</p>
                    <p className="text-xs text-muted-foreground">Driver submitted POD</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2 min ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Location update</p>
                    <p className="text-xs text-muted-foreground">Driver arrived at pickup</p>
                  </div>
                  <span className="text-xs text-muted-foreground">5 min ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document pending</p>
                    <p className="text-xs text-muted-foreground">Load slip needs approval</p>
                  </div>
                  <span className="text-xs text-muted-foreground">12 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}