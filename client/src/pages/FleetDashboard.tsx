import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  Users, 
  MessageCircle, 
  CreditCard, 
  Settings, 
  Activity,
  MapPin,
  FileText,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useParams } from "wouter";

interface DashboardData {
  tenant: {
    id: string;
    companyName: string;
    serviceTier: string;
    isActive: boolean;
    whatsappPhoneNumber?: string;
  };
  stats: {
    totalDrivers: number;
    activeDrivers: number;
    activeTransports: number;
    whatsappPhone?: string;
  };
  recentTransports: Array<{
    id: string;
    status: string;
    pickupLocation: string;
    deliveryLocation: string;
    driverName?: string;
    createdAt: string;
  }>;
  currentBilling?: {
    billingPeriod: string;
    activeDrivers: number;
    totalAmount: string;
    status: string;
  };
  isActive: boolean;
}

export default function FleetDashboard() {
  const { tenantId } = useParams();

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard', tenantId],
    enabled: !!tenantId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading Fleet.Chat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
            <p className="text-gray-600 mb-4">Unable to load fleet dashboard data.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { tenant, stats, recentTransports, currentBilling } = dashboardData;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'en_route':
      case 'loading':
      case 'departed_pickup':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant.companyName}</h1>
              <p className="text-gray-600">Fleet.Chat Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={tenant.isActive ? "default" : "secondary"}
                className={tenant.isActive ? "bg-green-100 text-green-800" : ""}
              >
                {tenant.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {tenant.serviceTier}
              </Badge>
              {tenant.whatsappPhoneNumber && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-1" />
                  {tenant.whatsappPhoneNumber}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalDrivers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeDrivers}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Transports</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.activeTransports}</p>
                </div>
                <Truck className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">WhatsApp Status</p>
                  <p className="text-sm font-semibold text-green-600">Connected</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="transports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transports" className="flex items-center">
              <Truck className="w-4 h-4 mr-2" />
              Transports
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Active Transports */}
          <TabsContent value="transports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Recent Transports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransports.length === 0 ? (
                  <div className="text-center py-12">
                    <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transports found</p>
                    <p className="text-sm text-gray-500">Transports will appear here once they're created in Samsara</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTransports.map((transport) => (
                      <div key={transport.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(transport.status)}>
                              {formatStatus(transport.status)}
                            </Badge>
                            <span className="font-medium">{transport.driverName || 'Unassigned'}</span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-1" />
                            {transport.pickupLocation} → {transport.deliveryLocation}
                          </div>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            Created {new Date(transport.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drivers */}
          <TabsContent value="drivers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Driver Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-blue-900">Driver Onboarding Status</h3>
                      <p className="text-sm text-blue-700">
                        {stats.activeDrivers} of {stats.totalDrivers} drivers have completed WhatsApp onboarding
                      </p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">
                        {Math.round((stats.activeDrivers / stats.totalDrivers) * 100)}% Complete
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Total Drivers</h4>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</p>
                      <p className="text-sm text-gray-600">Discovered in Samsara</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Active on WhatsApp</h4>
                      <p className="text-2xl font-bold text-green-600">{stats.activeDrivers}</p>
                      <p className="text-sm text-gray-600">Consented & messaging</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Billing Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentBilling ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-900">Current Period</h3>
                        <p className="text-lg font-bold text-green-700">{currentBilling.billingPeriod}</p>
                        <p className="text-sm text-green-600">Monthly billing cycle</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-900">Active Drivers</h3>
                        <p className="text-lg font-bold text-blue-700">{currentBilling.activeDrivers}</p>
                        <p className="text-sm text-blue-600">Billable this month</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-medium text-purple-900">Total Amount</h3>
                        <p className="text-lg font-bold text-purple-700">${currentBilling.totalAmount}</p>
                        <p className="text-sm text-purple-600">Current month charges</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Billing Details</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• Service Tier: <span className="font-medium capitalize">{tenant.serviceTier}</span></p>
                        <p>• Only active drivers who use WhatsApp are billed</p>
                        <p>• Automatic monthly charging on the 1st of each month</p>
                        <p>• Next billing: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No billing data available</p>
                    <p className="text-sm text-gray-500">Billing will start once drivers begin using WhatsApp</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Fleet Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Samsara Integration</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span>API Connection Active</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span>Webhooks Configured</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span>Driver Sync Enabled</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">WhatsApp Business</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span>Phone Number Assigned</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span>Message Templates Active</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span>Webhook Processing</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-4">Service Status</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="font-medium text-green-900">Fleet.Chat Operational</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        All systems are functioning normally. Real-time messaging between Samsara and drivers is active.
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      View Logs
                    </Button>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}