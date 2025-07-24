import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Shield, Eye, EyeOff, UserCheck } from "lucide-react";
import type { User } from "@shared/schema";

function UserCard({ user }: { user: User }) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'driver':
        return '🚛';
      case 'dispatcher':
        return '📋';
      case 'yard_operator':
        return '🏭';
      case 'manager':
        return '👔';
      default:
        return '👤';
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "status-badge";
    switch (role) {
      case 'driver':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'dispatcher':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'yard_operator':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300`;
      case 'manager':
        return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
    }
  };

  return (
    <div className="workflow-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getRoleIcon(user.role)}</div>
          <div>
            <h3 className="font-semibold">
              {user.isAnonymous ? `Anonymous Driver ${user.pseudoId}` : user.name}
            </h3>
            <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
          </div>
        </div>
        <span className={getRoleBadge(user.role)}>
          {user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Phone:</span>
          <span>{user.phone || 'Not provided'}</span>
        </div>
        

        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created:</span>
          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>

        {user.isAnonymous && (
          <div className="flex items-center space-x-2 mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700 dark:text-blue-300">GDPR Protected</span>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors">
          <Eye className="h-4 w-4" />
          <span>View Details</span>
        </button>
        
        {user.role === 'driver' && (
          <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <UserCheck className="h-4 w-4" />
            <span>Workflows</span>
          </button>
        )}
      </div>
    </div>
  );
}

function CreateUserForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'driver',
    isAnonymous: false,
    whatsappNumber: ''
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required={!formData.isAnonymous}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp Number</label>
            <input
              type="tel"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              placeholder="+1234567890"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="driver">Driver</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="yard_operator">Yard Operator</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          

          
          {formData.role === 'driver' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="rounded border-border"
              />
              <label htmlFor="anonymous" className="text-sm font-medium">
                Anonymous Driver (GDPR Compliant)
              </label>
            </div>
          )}
          
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
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.pseudoId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  const userStats = users ? {
    total: users.length,
    drivers: users.filter(u => u.role === 'driver').length,
    dispatchers: users.filter(u => u.role === 'dispatcher').length,
    yardOperators: users.filter(u => u.role === 'yard_operator').length,
    managers: users.filter(u => u.role === 'manager').length,
    anonymous: users.filter(u => u.isAnonymous).length
  } : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New User</span>
        </button>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="workflow-card text-center">
            <div className="text-2xl font-bold">{userStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="workflow-card text-center">
            <div className="text-2xl font-bold">{userStats.drivers}</div>
            <div className="text-sm text-muted-foreground">Drivers</div>
          </div>
          <div className="workflow-card text-center">
            <div className="text-2xl font-bold">{userStats.dispatchers}</div>
            <div className="text-sm text-muted-foreground">Dispatchers</div>
          </div>
          <div className="workflow-card text-center">
            <div className="text-2xl font-bold">{userStats.yardOperators}</div>
            <div className="text-sm text-muted-foreground">Yard Ops</div>
          </div>
          <div className="workflow-card text-center">
            <div className="text-2xl font-bold">{userStats.managers}</div>
            <div className="text-sm text-muted-foreground">Managers</div>
          </div>
          <div className="workflow-card text-center">
            <div className="text-2xl font-bold">{userStats.anonymous}</div>
            <div className="text-sm text-muted-foreground">Anonymous</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
          />
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="all">All Roles</option>
          <option value="driver">Drivers</option>
          <option value="dispatcher">Dispatchers</option>
          <option value="yard_operator">Yard Operators</option>
          <option value="manager">Managers</option>
        </select>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="workflow-card animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 h-8 bg-muted rounded"></div>
                <div className="flex-1 h-8 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || roleFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Create your first user to get started'
            }
          </p>
          {!searchTerm && roleFilter === 'all' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Create User
            </button>
          )}
        </div>
      )}

      {showCreateForm && (
        <CreateUserForm onClose={() => setShowCreateForm(false)} />
      )}

      {/* GDPR Notice */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">GDPR Compliance</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Driver anonymity is protected through pseudonymization. Personal data is encrypted and access is logged.
              Users can request data deletion or modification at any time through the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}