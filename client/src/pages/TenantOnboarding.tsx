import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Shield, Users, Webhook } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const samsaraConfigSchema = z.object({
  apiToken: z.string().min(1, "API token is required").min(40, "Invalid API token format"),
  orgId: z.string().optional()
});

type SamsaraConfigData = z.infer<typeof samsaraConfigSchema>;

interface ValidationResult {
  valid: boolean;
  error?: string;
  scopes: string[];
  requiredScopes: string[];
  hasRequiredScopes: boolean;
  orgId?: string;
  drivers?: number;
  vehicles?: number;
}

export default function TenantOnboarding() {
  const [step, setStep] = useState<'configure' | 'validate' | 'complete'>('configure');
  const [tenantId] = useState(() => crypto.randomUUID()); // In production, this would come from auth
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const form = useForm<SamsaraConfigData>({
    resolver: zodResolver(samsaraConfigSchema),
    defaultValues: {
      apiToken: "",
      orgId: ""
    }
  });

  // Validate token mutation
  const validateMutation = useMutation({
    mutationFn: async (data: SamsaraConfigData) => {
      const response = await apiRequest("POST", "/api/tenant/samsara/validate", data);
      return response.json();
    },
    onSuccess: (result: ValidationResult) => {
      setValidationResult(result);
      if (result.valid && result.hasRequiredScopes) {
        setStep('validate');
      } else {
        toast({
          title: "Validation Failed",
          description: result.error || "API token does not have required permissions",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Failed to validate API token",
        variant: "destructive"
      });
    }
  });

  // Configure tenant mutation
  const configureMutation = useMutation({
    mutationFn: async (data: SamsaraConfigData) => {
      const response = await apiRequest("POST", `/api/tenant/${tenantId}/samsara/configure`, data);
      return response.json();
    },
    onSuccess: () => {
      setStep('complete');
      toast({
        title: "Configuration Complete",
        description: "Samsara integration has been successfully configured",
      });
    },
    onError: (error) => {
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to configure Samsara integration",
        variant: "destructive"
      });
    }
  });

  // Check tenant status
  const { data: tenantStatus } = useQuery({
    queryKey: [`/api/tenant/${tenantId}/samsara/status`],
    enabled: step === 'complete'
  });

  const handleValidate = (data: SamsaraConfigData) => {
    validateMutation.mutate(data);
  };

  const handleConfigure = () => {
    const data = form.getValues();
    configureMutation.mutate(data);
  };

  const RequiredScopesBadge = ({ scopes, required }: { scopes: string[], required: string[] }) => (
    <div className="space-y-2">
      <h4 className="font-medium">API Permissions:</h4>
      <div className="flex flex-wrap gap-2">
        {required.map(scope => {
          const hasScope = scopes.includes(scope);
          return (
            <Badge key={scope} variant={hasScope ? "default" : "destructive"}>
              {hasScope ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {scope}
            </Badge>
          );
        })}
      </div>
    </div>
  );

  if (step === 'complete') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Samsara Integration Complete
            </CardTitle>
            <CardDescription>
              Your Samsara API integration has been successfully configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tenantStatus && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="font-medium">API Access</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {tenantStatus.validated ? 'Validated' : 'Pending'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Webhook className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Webhook</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {tenantStatus.webhookConfigured ? 'Active' : 'Not configured'}
                  </p>
                </div>
              </div>
            )}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your Samsara integration is now active. Driver communication will begin when routes are created in your Samsara dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">FleetChat Setup</h1>
        <p className="text-muted-foreground">
          Configure your Samsara API integration for bidirectional driver communication
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Samsara API Configuration</CardTitle>
          <CardDescription>
            Enter your Samsara API token to enable real-time fleet communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleValidate)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Samsara API Token</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your Samsara API token"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Get your API token from the Samsara dashboard under Settings → API Tokens
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization ID (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Auto-detected from API token"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave blank to auto-detect from your API token
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {step === 'configure' && (
                <Button 
                  type="submit" 
                  disabled={validateMutation.isPending}
                  className="w-full"
                >
                  {validateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Validate API Token
                </Button>
              )}
            </form>
          </Form>

          {validationResult && step === 'validate' && (
            <div className="mt-6 space-y-4">
              <Alert className={validationResult.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Validation {validationResult.valid ? 'Successful' : 'Failed'}</strong>
                  {validationResult.error && <div className="mt-1 text-sm text-red-600">{validationResult.error}</div>}
                </AlertDescription>
              </Alert>

              {validationResult.valid && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Drivers</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900">{validationResult.drivers || 0}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">Vehicles</span>
                      </div>
                      <p className="text-lg font-bold text-green-900">{validationResult.vehicles || 0}</p>
                    </div>
                  </div>

                  <RequiredScopesBadge 
                    scopes={validationResult.scopes} 
                    required={validationResult.requiredScopes} 
                  />

                  {validationResult.hasRequiredScopes && (
                    <Button 
                      onClick={handleConfigure}
                      disabled={configureMutation.isPending}
                      className="w-full"
                    >
                      {configureMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Complete Integration Setup
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}