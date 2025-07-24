import { Routes, Route, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Truck, Settings, MessageCircle, BarChart3, ExternalLink } from "lucide-react";
import FleetOnboarding from "./FleetOnboarding";
import FleetDashboard from "./FleetDashboard";

function FleetChatLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fleet.Chat</h1>
                <p className="text-sm text-gray-600">Samsara ↔ WhatsApp Communication Bridge</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Production Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Invisible Communication Infrastructure
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Fleet.Chat connects your Samsara fleet management system to WhatsApp Business API, 
            enabling real-time driver communication without any user interface complexity.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <Truck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Samsara Integration</h3>
              <p className="text-gray-600">
                Complete API integration with real-time fleet events, driver management, 
                and route synchronization.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">WhatsApp Business</h3>
              <p className="text-gray-600">
                Managed WhatsApp phone numbers with bulk provisioning, 
                template messaging, and high-performance bidirectional communication.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Automated Billing</h3>
              <p className="text-gray-600">
                Driver-based pricing with Stripe integration. 
                Only pay for active drivers who use the system.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Why Fleet.Chat?
              </h3>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                  <p><strong>Headless Architecture:</strong> Pure API service with no user interface complexity</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
                  <p><strong>Managed WhatsApp:</strong> We handle phone number provisioning and infrastructure</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></div>
                  <p><strong>Simple Onboarding:</strong> Two-step setup process completed in under 10 minutes</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3"></div>
                  <p><strong>Pay-per-Use:</strong> Only charged for drivers who actively use WhatsApp messaging</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-2">Pricing</h4>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">$15-35</p>
                  <p className="text-sm">per active driver/month</p>
                  <p className="text-xs opacity-90">Professional: $25/driver recommended</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Connect Your Fleet?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Get started with Fleet.Chat in minutes. Connect your Samsara API, 
            configure payment, and begin automated driver communication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/fleet/onboard">
              <Button size="lg" className="min-w-[200px]">
                <Settings className="w-5 h-5 mr-2" />
                Start Fleet Setup
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="min-w-[200px]">
              <ExternalLink className="w-5 h-5 mr-2" />
              View Documentation
            </Button>
          </div>
        </div>

        {/* Service Status */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
            Fleet.Chat Service Operational
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FleetChatApp() {
  const [location] = useLocation();

  return (
    <Routes>
      <Route path="/fleet" component={FleetChatLanding} />
      <Route path="/fleet/onboard" component={FleetOnboarding} />
      <Route path="/fleet/dashboard/:tenantId" component={FleetDashboard} />
      <Route>
        {/* Default route - redirect to fleet landing */}
        <FleetChatLanding />
      </Route>
    </Routes>
  );
}