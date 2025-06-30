import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

interface SystemOverview {
  totalTenants: number;
  activeTenants: number;
  totalDrivers: number;
  activeDrivers: number;
  totalTransports: number;
  totalMessages: number;
  monthlyRevenue: number;
}

interface TenantStat {
  tenantId: string;
  companyName: string;
  activeDrivers: number;
  totalTransports: number;
  totalMessages: number;
  monthlyBilling: number;
  serviceTier: string;
}

interface PricingTier {
  id: string;
  name: string;
  description?: string;
  pricePerDriver: number;
  minDrivers: number;
  maxDrivers?: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin authentication
  const { data: admin, isLoading: adminLoading, error: adminError } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  // System overview data
  const { data: overview, isLoading: overviewLoading } = useQuery<SystemOverview>({
    queryKey: ["/api/admin/dashboard/overview"],
    enabled: !!admin,
  });

  // Tenant statistics
  const { data: tenantStats, isLoading: tenantsLoading } = useQuery<TenantStat[]>({
    queryKey: ["/api/admin/dashboard/tenants"],
    enabled: !!admin,
  });

  // Pricing tiers
  const { data: pricingTiers, isLoading: pricingLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/admin/pricing/tiers"],
    enabled: !!admin && activeTab === "pricing",
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
    },
  });

  // Handle authentication check
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (adminError || !admin) {
    setLocation("/admin/login");
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tenants", label: "Fleet Operators" },
    { id: "pricing", label: "Pricing Management" },
    { id: "billing", label: "Billing & Reports" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Fleet.Chat Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {admin.name}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <OverviewTab overview={overview} loading={overviewLoading} />
        )}
        
        {activeTab === "tenants" && (
          <TenantsTab tenantStats={tenantStats} loading={tenantsLoading} />
        )}
        
        {activeTab === "pricing" && (
          <PricingTab 
            pricingTiers={pricingTiers} 
            loading={pricingLoading}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing/tiers"] })}
          />
        )}
        
        {activeTab === "billing" && (
          <BillingTab />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ overview, loading }: { overview?: SystemOverview; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!overview) return null;

  const stats = [
    { label: "Total Fleet Operators", value: overview.totalTenants, color: "text-blue-600" },
    { label: "Active Fleet Operators", value: overview.activeTenants, color: "text-green-600" },
    { label: "Total Drivers", value: overview.totalDrivers, color: "text-purple-600" },
    { label: "Active Drivers", value: overview.activeDrivers, color: "text-emerald-600" },
    { label: "Total Transports", value: overview.totalTransports, color: "text-orange-600" },
    { label: "Total Messages", value: overview.totalMessages, color: "text-pink-600" },
    { 
      label: "Monthly Revenue", 
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(overview.monthlyRevenue), 
      color: "text-emerald-600" 
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
        <p className="text-gray-600">Current system statistics and performance metrics</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TenantsTab({ tenantStats, loading }: { tenantStats?: TenantStat[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fleet Operators</h2>
        <p className="text-gray-600">Active fleet operators and their usage statistics</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Drivers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transports
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Messages
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monthly Billing
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenantStats?.map((tenant) => (
              <tr key={tenant.tenantId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{tenant.companyName}</div>
                  <div className="text-sm text-gray-500">{tenant.tenantId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    tenant.serviceTier === 'enterprise' 
                      ? 'bg-purple-100 text-purple-800'
                      : tenant.serviceTier === 'professional'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tenant.serviceTier}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tenant.activeDrivers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tenant.totalTransports}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tenant.totalMessages}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(tenant.monthlyBilling)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PricingTab({ 
  pricingTiers, 
  loading, 
  onUpdate 
}: { 
  pricingTiers?: PricingTier[]; 
  loading: boolean;
  onUpdate: () => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const { toast } = useToast();

  const createTierMutation = useMutation({
    mutationFn: async (tierData: any) => {
      return await apiRequest("POST", "/api/admin/pricing/tiers", tierData);
    },
    onSuccess: () => {
      toast({
        title: "Pricing Tier Created",
        description: "New pricing tier has been created successfully",
      });
      setShowCreateForm(false);
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create pricing tier",
        variant: "destructive",
      });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return await apiRequest("PUT", `/api/admin/pricing/tiers/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Pricing Tier Updated",
        description: "Pricing tier has been updated successfully",
      });
      setEditingTier(null);
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update pricing tier",
        variant: "destructive",
      });
    },
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pricing Management</h2>
          <p className="text-gray-600">Configure pricing tiers and driver billing rates</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Create New Tier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pricingTiers?.map((tier) => (
          <div key={tier.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                tier.isActive 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {tier.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {tier.description && (
              <p className="text-gray-600 text-sm mb-4">{tier.description}</p>
            )}
            
            <div className="space-y-2 mb-4">
              <div className="text-2xl font-bold text-emerald-600">
                ${tier.pricePerDriver}/driver/month
              </div>
              <div className="text-sm text-gray-500">
                Min: {tier.minDrivers} drivers
                {tier.maxDrivers && ` • Max: ${tier.maxDrivers} drivers`}
              </div>
            </div>
            
            {tier.features.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-emerald-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              onClick={() => setEditingTier(tier)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Edit Tier
            </button>
          </div>
        ))}
      </div>

      {/* Create/Edit Form Modal would go here */}
      {(showCreateForm || editingTier) && (
        <PricingTierForm
          tier={editingTier}
          onSubmit={(data) => {
            if (editingTier) {
              updateTierMutation.mutate({ id: editingTier.id, ...data });
            } else {
              createTierMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingTier(null);
          }}
          loading={createTierMutation.isPending || updateTierMutation.isPending}
        />
      )}
    </div>
  );
}

function BillingTab() {
  const { data: billingRecords, isLoading } = useQuery({
    queryKey: ["/api/admin/billing/records"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Billing & Reports</h2>
        <p className="text-gray-600">Monthly billing records and usage reports</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Billing Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Drivers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billingRecords?.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.billingPeriod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.tenantId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.activeDrivers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.pricePerDriver}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PricingTierForm({ 
  tier, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  tier?: PricingTier | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: tier?.name || "",
    description: tier?.description || "",
    pricePerDriver: tier?.pricePerDriver?.toString() || "",
    minDrivers: tier?.minDrivers?.toString() || "1",
    maxDrivers: tier?.maxDrivers?.toString() || "",
    features: tier?.features?.join("\n") || "",
    isActive: tier?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      pricePerDriver: parseFloat(formData.pricePerDriver),
      minDrivers: parseInt(formData.minDrivers),
      maxDrivers: formData.maxDrivers ? parseInt(formData.maxDrivers) : null,
      features: formData.features.split("\n").filter(f => f.trim()),
    };
    
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {tier ? "Edit Pricing Tier" : "Create Pricing Tier"}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Professional"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder="Describe this pricing tier..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Driver (USD)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.pricePerDriver}
              onChange={(e) => setFormData({ ...formData, pricePerDriver: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="3.00"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Drivers
              </label>
              <input
                type="number"
                required
                value={formData.minDrivers}
                onChange={(e) => setFormData({ ...formData, minDrivers: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Drivers (optional)
              </label>
              <input
                type="number"
                value={formData.maxDrivers}
                onChange={(e) => setFormData({ ...formData, maxDrivers: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Features (one per line)
            </label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
              placeholder="WhatsApp Business API included&#10;Real-time messaging&#10;Document processing"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active tier
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Saving..." : tier ? "Update Tier" : "Create Tier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}