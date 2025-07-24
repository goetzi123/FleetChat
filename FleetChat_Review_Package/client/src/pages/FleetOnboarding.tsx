import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Truck, Settings, CreditCard, CheckCircle, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fleetSetupSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { z } from "zod";

type FleetSetupData = z.infer<typeof fleetSetupSchema>;

interface SamsaraDriver {
  id: string;
  name: string;
  username: string;
  phone?: string;
  isActive: boolean;
}

interface SetupProgress {
  step: 'company' | 'samsara' | 'billing' | 'complete';
  tenantId?: string;
  samsaraConnected: boolean;
  driversFound: number;
  whatsappAssigned: boolean;
  paymentConfigured: boolean;
}

export default function FleetOnboarding() {
  const { toast } = useToast();
  const [progress, setProgress] = useState<SetupProgress>({
    step: 'company',
    samsaraConnected: false,
    driversFound: 0,
    whatsappAssigned: false,
    paymentConfigured: false
  });

  const form = useForm<FleetSetupData>({
    resolver: zodResolver(fleetSetupSchema),
    defaultValues: {
      serviceTier: "professional",
      autoPayment: true
    }
  });

  // Samsara drivers query
  const { data: samsaraDrivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['/api/samsara/drivers', progress.tenantId],
    enabled: !!progress.tenantId && progress.samsaraConnected,
  });

  // Fleet setup mutation
  const setupMutation = useMutation({
    mutationFn: async (data: FleetSetupData) => {
      return apiRequest('POST', '/api/fleet/setup', data);
    },
    onSuccess: (result) => {
      setProgress({
        ...progress,
        step: 'samsara',
        tenantId: result.tenantId,
        samsaraConnected: true,
        driversFound: result.driversCount,
        whatsappAssigned: true
      });
      toast({
        title: "Fleet Configuration Created",
        description: `Found ${result.driversCount} drivers in your Samsara fleet.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/samsara/drivers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Driver onboarding mutation
  const driverOnboardingMutation = useMutation({
    mutationFn: async (driverIds: string[]) => {
      return apiRequest('POST', '/api/fleet/drivers/onboard', { 
        tenantId: progress.tenantId,
        driverIds 
      });
    },
    onSuccess: (result) => {
      setProgress({
        ...progress,
        step: 'billing'
      });
      toast({
        title: "Drivers Onboarded",
        description: `${result.onboardedCount} drivers will receive WhatsApp invitations.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Driver Onboarding Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Payment setup mutation
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: {
      tenantId: string;
      billingEmail: string;
    }) => {
      return apiRequest('POST', '/api/fleet/billing/setup', paymentData);
    },
    onSuccess: () => {
      setProgress({
        ...progress,
        step: 'complete',
        paymentConfigured: true
      });
      toast({
        title: "Payment Configured",
        description: "Fleet.Chat is now fully operational for your fleet."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Setup Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: FleetSetupData) => {
    setupMutation.mutate(data);
  };

  const handleDriverOnboarding = (selectedDrivers: string[]) => {
    driverOnboardingMutation.mutate(selectedDrivers);
  };

  const handlePaymentSetup = (billingEmail: string) => {
    if (!progress.tenantId) return;
    paymentMutation.mutate({
      tenantId: progress.tenantId,
      billingEmail
    });
  };

  const getServiceTierPricing = (tier: string) => {
    switch (tier) {
      case 'basic': return '$15/driver/month';
      case 'professional': return '$25/driver/month';
      case 'enterprise': return '$35/driver/month';
      default: return '$25/driver/month';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Fleet.Chat Setup</h1>
          <p className="text-lg text-gray-600">Connect your Samsara fleet to WhatsApp in 3 simple steps</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${progress.step === 'company' ? 'text-blue-600' : progress.samsaraConnected ? 'text-green-600' : 'text-gray-400'}`}>
              <Settings className="w-6 h-6 mr-2" />
              <span className="font-medium">Company Setup</span>
            </div>
            <div className={`flex items-center ${progress.step === 'samsara' ? 'text-blue-600' : progress.driversFound > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <Truck className="w-6 h-6 mr-2" />
              <span className="font-medium">Samsara Integration</span>
            </div>
            <div className={`flex items-center ${progress.step === 'billing' ? 'text-blue-600' : progress.paymentConfigured ? 'text-green-600' : 'text-gray-400'}`}>
              <CreditCard className="w-6 h-6 mr-2" />
              <span className="font-medium">Billing Setup</span>
            </div>
            <div className={`flex items-center ${progress.step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircle className="w-6 h-6 mr-2" />
              <span className="font-medium">Complete</span>
            </div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: progress.step === 'company' ? '25%' : 
                       progress.step === 'samsara' ? '50%' : 
                       progress.step === 'billing' ? '75%' : '100%' 
              }}
            />
          </div>
        </div>

        <Tabs value={progress.step} className="space-y-6">
          {/* Company Setup */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Company & Samsara Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Trucking Company" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="admin@yourcompany.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Samsara API Configuration</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Required: Samsara API Token</p>
                            <p>Get your API token from Samsara Dashboard → Settings → API Tokens</p>
                          </div>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="samsaraApiToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Samsara API Token</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="samsara_api_xxxxxxxx" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="samsaraGroupId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Samsara Group ID (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Leave blank for all groups" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Service Tier</h3>
                      <FormField
                        control={form.control}
                        name="serviceTier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Choose Your Plan</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic">
                                  Basic - $15/driver/month
                                </SelectItem>
                                <SelectItem value="professional">
                                  Professional - $25/driver/month (Recommended)
                                </SelectItem>
                                <SelectItem value="enterprise">
                                  Enterprise - $35/driver/month
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="billingEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="billing@yourcompany.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={setupMutation.isPending}
                    >
                      {setupMutation.isPending ? 'Connecting...' : 'Connect to Samsara'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Samsara Integration */}
          <TabsContent value="samsara">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Driver Discovery & Onboarding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">
                        Samsara Connected Successfully
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {progress.driversFound} drivers found
                    </Badge>
                  </div>

                  {driversLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                      <p>Discovering drivers in your Samsara fleet...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Select Drivers for Fleet.Chat
                      </h3>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">WhatsApp Invitation Process</p>
                            <p>Selected drivers will receive SMS invitations to join Fleet.Chat via WhatsApp. Only consenting drivers will be billed.</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 max-h-60 overflow-y-auto">
                        {samsaraDrivers.map((driver: SamsaraDriver) => (
                          <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`driver-${driver.id}`}
                                className="mr-3"
                                defaultChecked={driver.isActive}
                              />
                              <div>
                                <p className="font-medium">{driver.name}</p>
                                <p className="text-sm text-gray-600">
                                  {driver.username} {driver.phone && `• ${driver.phone}`}
                                </p>
                              </div>
                            </div>
                            <Badge variant={driver.isActive ? "default" : "secondary"}>
                              {driver.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Monthly cost: {getServiceTierPricing(form.watch('serviceTier'))} × {progress.driversFound} drivers
                        </div>
                        <Button 
                          onClick={() => handleDriverOnboarding(samsaraDrivers.map((d: SamsaraDriver) => d.id))}
                          disabled={driverOnboardingMutation.isPending}
                        >
                          {driverOnboardingMutation.isPending ? 'Onboarding...' : 'Continue to Billing'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Setup */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Automated Billing Summary</h3>
                    <div className="space-y-2 text-blue-800">
                      <p>• Service Tier: <strong>{form.watch('serviceTier').charAt(0).toUpperCase() + form.watch('serviceTier').slice(1)}</strong></p>
                      <p>• Rate: <strong>{getServiceTierPricing(form.watch('serviceTier'))}</strong></p>
                      <p>• Active Drivers: <strong>{progress.driversFound}</strong></p>
                      <p>• Estimated Monthly Cost: <strong>${((progress.driversFound) * (form.watch('serviceTier') === 'basic' ? 15 : form.watch('serviceTier') === 'enterprise' ? 35 : 25)).toFixed(2)}</strong></p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Payment Features:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>✓ Only pay for drivers who actively use WhatsApp</li>
                      <li>✓ Automatic monthly billing on the 1st of each month</li>
                      <li>✓ Detailed usage reports and billing statements</li>
                      <li>✓ Cancel anytime with 30-day notice</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={() => handlePaymentSetup(form.watch('billingEmail'))}
                      className="w-full"
                      disabled={paymentMutation.isPending}
                    >
                      {paymentMutation.isPending ? 'Setting up payment...' : 'Complete Fleet.Chat Setup'}
                    </Button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      You will be redirected to our secure payment processor to add your payment method.
                      No charges will occur until drivers begin using the service.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complete */}
          <TabsContent value="complete">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Fleet.Chat Setup Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Your Fleet.Chat Service is Now Active</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="text-left">
                        <h4 className="font-medium text-green-800 mb-2">What happens next:</h4>
                        <ul className="space-y-1 text-green-700">
                          <li>✓ WhatsApp number assigned to your fleet</li>
                          <li>✓ Driver invitations sent via SMS</li>
                          <li>✓ Samsara webhooks configured</li>
                          <li>✓ Automated billing activated</li>
                        </ul>
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-green-800 mb-2">Timeline:</h4>
                        <ul className="space-y-1 text-green-700">
                          <li>• Day 1: Driver invitations</li>
                          <li>• Day 2: Active messaging begins</li>
                          <li>• Day 3: Full operational status</li>
                          <li>• Month 1: First billing cycle</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                      Go to Dashboard
                    </Button>
                    <Button onClick={() => window.location.href = '/support'}>
                      Contact Support
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