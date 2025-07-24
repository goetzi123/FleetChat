import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, CreditCard, Settings, Shield, Phone, Users } from "lucide-react";

// Validation schemas
const samsaraConfigSchema = z.object({
  apiToken: z.string().min(10, "Samsara API token is required"),
  groupId: z.string().min(1, "Group ID is required"),
  webhookSecret: z.string().min(8, "Webhook secret must be at least 8 characters"),
  organizationName: z.string().min(1, "Organization name is required"),
  contactEmail: z.string().email("Valid email address required"),
});

const paymentConfigSchema = z.object({
  serviceTier: z.enum(["basic", "professional", "enterprise"]),
  cardNumber: z.string().min(13, "Valid card number required"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Format: MM/YY"),
  cvv: z.string().min(3, "CVV required"),
  cardHolderName: z.string().min(1, "Cardholder name required"),
  billingEmail: z.string().email("Valid billing email required"),
  companyName: z.string().min(1, "Company name required"),
  billingAddress: z.string().min(1, "Billing address required"),
  autoPayment: z.boolean().default(true),
});

type SamsaraConfig = z.infer<typeof samsaraConfigSchema>;
type PaymentConfig = z.infer<typeof paymentConfigSchema>;

interface FleetSetupStatus {
  samsaraConfigured: boolean;
  paymentConfigured: boolean;
  whatsappAssigned: boolean;
  driverCount: number;
  estimatedMonthlyCost: number;
}

const serviceTiers = {
  basic: { price: 15, name: "Basic", features: ["Standard templates", "Basic reporting", "Business hours support"] },
  professional: { price: 25, name: "Professional", features: ["Custom templates", "Advanced analytics", "24/7 support", "Multi-language"] },
  enterprise: { price: 35, name: "Enterprise", features: ["Multi-fleet management", "Dedicated account manager", "Custom integrations", "White-label options"] }
};

export default function FleetSetup() {
  const { toast } = useToast();
  const [setupStatus, setSetupStatus] = useState<FleetSetupStatus>({
    samsaraConfigured: false,
    paymentConfigured: false,
    whatsappAssigned: false,
    driverCount: 0,
    estimatedMonthlyCost: 0
  });
  const [currentStep, setCurrentStep] = useState<"samsara" | "payment" | "complete">("samsara");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const samsaraForm = useForm<SamsaraConfig>({
    resolver: zodResolver(samsaraConfigSchema),
    defaultValues: {
      apiToken: "",
      groupId: "",
      webhookSecret: "",
      organizationName: "",
      contactEmail: "",
    },
  });

  const paymentForm = useForm<PaymentConfig>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      serviceTier: "professional",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardHolderName: "",
      billingEmail: "",
      companyName: "",
      billingAddress: "",
      autoPayment: true,
    },
  });

  const selectedTier = paymentForm.watch("serviceTier");
  
  useEffect(() => {
    const tier = serviceTiers[selectedTier];
    const estimatedCost = setupStatus.driverCount * tier.price;
    setSetupStatus(prev => ({ ...prev, estimatedMonthlyCost: estimatedCost }));
  }, [selectedTier, setupStatus.driverCount]);

  const onSamsaraSubmit = async (data: SamsaraConfig) => {
    setIsSubmitting(true);
    try {
      // Simulate API call to configure Samsara integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate driver count retrieval from Samsara
      const simulatedDriverCount = Math.floor(Math.random() * 100) + 25;
      
      setSetupStatus(prev => ({
        ...prev,
        samsaraConfigured: true,
        driverCount: simulatedDriverCount,
        whatsappAssigned: true
      }));
      
      setCurrentStep("payment");
      toast({
        title: "Samsara Integration Configured",
        description: `Connected successfully. Found ${simulatedDriverCount} drivers in your fleet.`,
      });
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: "Please check your Samsara credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPaymentSubmit = async (data: PaymentConfig) => {
    setIsSubmitting(true);
    try {
      // Simulate payment method validation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSetupStatus(prev => ({ ...prev, paymentConfigured: true }));
      setCurrentStep("complete");
      
      toast({
        title: "Payment Method Configured",
        description: "Your fleet is now ready for automated driver communication.",
      });
    } catch (error) {
      toast({
        title: "Payment Setup Failed",
        description: "Please verify your payment details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatusBadge = ({ configured, label }: { configured: boolean; label: string }) => (
    <Badge variant={configured ? "default" : "secondary"} className="flex items-center gap-1">
      {configured ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label}
    </Badge>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fleet Setup</h1>
        <p className="text-gray-600 mt-2">Configure your FleetChat integration in two simple steps</p>
      </div>

      {/* Setup Status Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <StatusBadge configured={setupStatus.samsaraConfigured} label="Samsara API" />
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge configured={setupStatus.paymentConfigured} label="Payment Method" />
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge configured={setupStatus.whatsappAssigned} label="WhatsApp Number" />
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">{setupStatus.driverCount} Drivers</span>
            </div>
          </div>
          
          {setupStatus.estimatedMonthlyCost > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Estimated Monthly Cost:</strong> ${setupStatus.estimatedMonthlyCost.toLocaleString()} 
                <span className="text-blue-600 ml-1">
                  ({setupStatus.driverCount} active drivers × ${serviceTiers[selectedTier].price}/month)
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="samsara" disabled={false}>
            1. Samsara Integration
          </TabsTrigger>
          <TabsTrigger value="payment" disabled={!setupStatus.samsaraConfigured}>
            2. Payment Setup
          </TabsTrigger>
          <TabsTrigger value="complete" disabled={!setupStatus.paymentConfigured}>
            3. Complete
          </TabsTrigger>
        </TabsList>

        {/* Samsara Configuration */}
        <TabsContent value="samsara">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Samsara API Configuration
              </CardTitle>
              <CardDescription>
                Connect your Samsara fleet management system to FleetChat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...samsaraForm}>
                <form onSubmit={samsaraForm.handleSubmit(onSamsaraSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={samsaraForm.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Trucking Company" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={samsaraForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="fleet@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={samsaraForm.control}
                    name="apiToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Samsara API Token</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your Samsara API token" {...field} />
                        </FormControl>
                        <FormDescription>
                          Generate this token in your Samsara dashboard under Settings → API Tokens
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={samsaraForm.control}
                      name="groupId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fleet Group ID</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormDescription>
                            Found in Samsara under Organization → Groups
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={samsaraForm.control}
                      name="webhookSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Webhook Secret</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter webhook secret" {...field} />
                          </FormControl>
                          <FormDescription>
                            Create a secure secret for webhook verification
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">What happens next:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• FleetChat will configure webhook endpoints in your Samsara account</li>
                      <li>• We'll retrieve your driver list and phone numbers</li>
                      <li>• A dedicated WhatsApp Business number will be assigned to your fleet</li>
                      <li>• Driver communication templates will be pre-configured</li>
                    </ul>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Configuring Samsara Integration..." : "Configure Samsara Integration"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Configuration */}
        <TabsContent value="payment">
          <div className="space-y-6">
            {/* Service Tier Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Service Tier</CardTitle>
                <CardDescription>
                  Select the plan that best fits your fleet communication needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(serviceTiers).map(([key, tier]) => (
                    <div
                      key={key}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedTier === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => paymentForm.setValue("serviceTier", key as any)}
                    >
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">{tier.name}</h3>
                        <div className="text-3xl font-bold text-blue-600 my-2">
                          ${tier.price}
                          <span className="text-sm text-gray-500">/driver/month</span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1 text-left">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                <CardDescription>
                  Secure payment processing for automated monthly billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="ABC Trucking Company" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="billingEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Billing Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="billing@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={paymentForm.control}
                      name="billingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="cardHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cardholder Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <Input placeholder="1234 5678 9012 3456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/YY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Billing Summary</h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <p><strong>Service Tier:</strong> {serviceTiers[selectedTier].name}</p>
                        <p><strong>Active Drivers:</strong> {setupStatus.driverCount}</p>
                        <p><strong>Monthly Cost:</strong> ${setupStatus.estimatedMonthlyCost.toLocaleString()}</p>
                        <p><strong>Billing Date:</strong> 1st of each month</p>
                        <p><strong>Next Billing:</strong> {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Processing Payment Information..." : "Complete Payment Setup"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Setup Complete */}
        <TabsContent value="complete">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Fleet Setup Complete!</CardTitle>
              <CardDescription>
                Your FleetChat integration is now active and ready for driver communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp Configuration
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    <p><strong>Business Number:</strong> +1-555-FLEET-001</p>
                    <p><strong>Message Templates:</strong> Transport Standard v2</p>
                    <p><strong>Active Drivers:</strong> {setupStatus.driverCount}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Billing Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    <p><strong>Service Tier:</strong> {serviceTiers[selectedTier].name}</p>
                    <p><strong>Monthly Cost:</strong> ${setupStatus.estimatedMonthlyCost.toLocaleString()}</p>
                    <p><strong>Next Billing:</strong> {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">What's happening now:</h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                    Driver invitation messages are being sent via WhatsApp
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                    Samsara webhook endpoints are configured and active
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                    Real-time message routing is now operational
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                    Driver communication templates are ready for use
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button className="flex-1">
                  View Dashboard
                </Button>
                <Button variant="outline" className="flex-1">
                  Download Setup Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}