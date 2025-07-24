import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, MapPin, Clock, User, Truck, Package } from "lucide-react";
import type { Transport } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-badge status-pending';
      case 'en_route':
      case 'dispatched':
        return 'status-badge status-en-route';
      case 'delivered':
      case 'completed':
        return 'status-badge status-delivered';
      case 'cancelled':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <span className={getStatusStyle(status)}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

function TransportCard({ transport }: { transport: Transport }) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ transportId, status }: { transportId: string; status: string }) => {
      const response = await fetch(`/api/transports/${transportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transports'] });
    }
  });

  const quickStatusUpdate = (status: string) => {
    updateStatusMutation.mutate({ transportId: transport.id, status });
  };

  return (
    <div className="workflow-card hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">{transport.loadReference || transport.id}</h3>
          <p className="text-sm text-muted-foreground">{transport.workflowType.toUpperCase()}</p>
        </div>
        <StatusBadge status={transport.status} />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">From:</span>
          <span>{transport.pickupLocation}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">To:</span>
          <span>{transport.deliveryLocation}</span>
        </div>
        {transport.loadDescription && (
          <div className="flex items-center space-x-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{transport.loadDescription}</span>
          </div>
        )}
        {transport.pickupEta && (
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>ETA: {new Date(transport.pickupEta).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {transport.status === 'pending' && (
        <div className="flex space-x-2 pt-3 border-t">
          <button
            onClick={() => quickStatusUpdate('dispatched')}
            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            disabled={updateStatusMutation.isPending}
          >
            Dispatch
          </button>
        </div>
      )}

      {transport.status === 'dispatched' && (
        <div className="flex space-x-2 pt-3 border-t">
          <button
            onClick={() => quickStatusUpdate('en_route')}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            disabled={updateStatusMutation.isPending}
          >
            Start Journey
          </button>
        </div>
      )}
    </div>
  );
}

function CreateTransportForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    pickupLocation: '',
    deliveryLocation: '',
    loadDescription: '',
    workflowType: 'ftl',
    priority: 0
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/transports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create transport');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transports'] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Transport</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pickup Location</label>
            <input
              type="text"
              value={formData.pickupLocation}
              onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Delivery Location</label>
            <input
              type="text"
              value={formData.deliveryLocation}
              onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Load Description</label>
            <input
              type="text"
              value={formData.loadDescription}
              onChange={(e) => setFormData({ ...formData, loadDescription: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Workflow Type</label>
            <select
              value={formData.workflowType}
              onChange={(e) => setFormData({ ...formData, workflowType: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="ftl">FTL (Full Truck Load)</option>
              <option value="ltl">LTL (Less Than Truck Load)</option>
              <option value="yard">Yard Operation</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transports() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: transports, isLoading } = useQuery<Transport[]>({
    queryKey: ['/api/transports'],
    queryFn: async () => {
      const response = await fetch('/api/transports');
      if (!response.ok) throw new Error('Failed to fetch transports');
      return response.json();
    }
  });

  const filteredTransports = transports?.filter(transport => {
    const matchesSearch = !searchTerm || 
      transport.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transport.deliveryLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transport.loadReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transport.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transport.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Transport Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Transport</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
            <option value="en_route">En Route</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Transport Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="workflow-card animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTransports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTransports.map(transport => (
            <TransportCard key={transport.id} transport={transport} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No transports found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Create your first transport to get started'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Create Transport
            </button>
          )}
        </div>
      )}

      {showCreateForm && (
        <CreateTransportForm onClose={() => setShowCreateForm(false)} />
      )}
    </div>
  );
}