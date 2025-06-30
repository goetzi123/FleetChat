import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Truck, 
  Zap, 
  Shield, 
  Clock, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  BarChart3,
  Settings,
  Phone,
  Globe,
  Building,
  Smartphone,
  ExternalLink
} from "lucide-react";

export default function FleetChatPublicSite() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fleet.Chat</h1>
                <p className="text-sm text-gray-600">Invisible Communication Infrastructure</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Production Ready
              </Badge>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Connect Your Fleet to WhatsApp
            <span className="text-blue-600"> Instantly</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Fleet.Chat is invisible middleware that seamlessly bridges your Samsara fleet management 
            system with WhatsApp Business API. Enable real-time driver communication without any 
            user interface complexity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="min-w-[200px]">
              <Settings className="w-5 h-5 mr-2" />
              Start 10-Minute Setup
            </Button>
            <Button variant="outline" size="lg" className="min-w-[200px]">
              <ExternalLink className="w-5 h-5 mr-2" />
              View Demo
            </Button>
          </div>
          
          {/* Hero Stats */}
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">< 10 min</div>
              <div className="text-sm text-gray-600">Complete Setup</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">$15-35</div>
              <div className="text-sm text-gray-600">Per Active Driver/Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">99.9%</div>
              <div className="text-sm text-gray-600">Message Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Fleet.Chat */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What is Fleet.Chat?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fleet.Chat operates as pure middleware - an invisible communication bridge between 
              your Samsara TMS and WhatsApp Business API. No user interface, no complexity.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardContent className="p-8">
                <Truck className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">Samsara Events</h3>
                <p className="text-gray-600">
                  Fleet.Chat receives real-time events from your Samsara system: 
                  route assignments, location updates, delivery confirmations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-blue-200 bg-blue-50">
              <CardContent className="p-8">
                <Zap className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">Invisible Translation</h3>
                <p className="text-gray-600">
                  Our middleware instantly translates fleet events into contextual 
                  WhatsApp messages and routes driver responses back to Samsara.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <MessageCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">Driver WhatsApp</h3>
                <p className="text-gray-600">
                  Drivers receive automated messages on WhatsApp and can respond 
                  with status updates, photos, and location data.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Process Flow */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">1</div>
                <div className="ml-4">
                  <div className="font-semibold">Samsara Event</div>
                  <div className="text-sm text-gray-600">Route assigned to driver</div>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 rotate-90 md:rotate-0" />
              <div className="flex items-center">
                <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">2</div>
                <div className="ml-4">
                  <div className="font-semibold">Fleet.Chat Processing</div>
                  <div className="text-sm text-gray-600">Invisible middleware translation</div>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 rotate-90 md:rotate-0" />
              <div className="flex items-center">
                <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">3</div>
                <div className="ml-4">
                  <div className="font-semibold">WhatsApp Message</div>
                  <div className="text-sm text-gray-600">Driver receives notification</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Fleet.Chat?
            </h2>
            <p className="text-xl text-gray-600">
              Purpose-built for enterprise fleet operations with zero complexity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <Shield className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Managed WhatsApp Infrastructure</h3>
                <p className="text-gray-600">
                  We handle WhatsApp Business API setup, phone number provisioning, 
                  and infrastructure management. No technical complexity for you.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Clock className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">10-Minute Setup</h3>
                <p className="text-gray-600">
                  Simple two-step configuration: connect your Samsara API and 
                  configure payment. Your drivers are messaging within minutes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pay-Per-Use Billing</h3>
                <p className="text-gray-600">
                  Only pay for drivers who actively use WhatsApp messaging. 
                  Automated billing with transparent pricing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Multi-Tenant Architecture</h3>
                <p className="text-gray-600">
                  Complete tenant isolation with dedicated WhatsApp numbers 
                  and independent configuration per fleet operator.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Phone className="w-12 h-12 text-indigo-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bulk Phone Provisioning</h3>
                <p className="text-gray-600">
                  Enterprise-grade WhatsApp Business phone number management 
                  with high-performance message throughput.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Globe className="w-12 h-12 text-teal-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">GDPR Compliant</h3>
                <p className="text-gray-600">
                  Privacy-first architecture with driver consent management 
                  and secure data handling across all communications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Real-World Applications
            </h2>
            <p className="text-xl text-gray-600">
              Fleet.Chat transforms driver communication across transport workflows
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Transport Communication</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Automated Status Updates</div>
                    <div className="text-gray-600">Drivers receive pickup reminders and can confirm arrival, loading, and delivery status</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Document Collection</div>
                    <div className="text-gray-600">POD photos and delivery documents automatically uploaded to Samsara transport records</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Location Tracking</div>
                    <div className="text-gray-600">One-off location pings at critical transport points with geofencing capabilities</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">Yard Operations</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Gate Registration</div>
                    <div className="text-gray-600">QR code scanning for yard entry with automated check-in notifications</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">ETA Confirmations</div>
                    <div className="text-gray-600">Automated arrival time updates with turn-by-turn navigation instructions</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Digital Check-Out</div>
                    <div className="text-gray-600">Streamlined departure process with load confirmation and route optimization</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Only pay for drivers who actively use WhatsApp messaging
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-4">Starter</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">$15</div>
                <div className="text-sm text-gray-600 mb-6">per active driver/month</div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>✓ Basic message templates</div>
                  <div>✓ Document collection</div>
                  <div>✓ Status updates</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-8 text-center">
                <Badge className="mb-4">Recommended</Badge>
                <h3 className="text-lg font-semibold mb-4">Professional</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">$25</div>
                <div className="text-sm text-gray-600 mb-6">per active driver/month</div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>✓ Advanced workflows</div>
                  <div>✓ Location tracking</div>
                  <div>✓ Priority support</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-4">Enterprise</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">$35</div>
                <div className="text-sm text-gray-600 mb-6">per active driver/month</div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>✓ Custom integrations</div>
                  <div>✓ Dedicated support</div>
                  <div>✓ SLA guarantees</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <p className="text-sm text-gray-600 mb-6">
              * No setup fees, no monthly minimums. Cancel anytime.
            </p>
            <Button size="lg" className="min-w-[200px]">
              Start Free Setup
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Fleet Communication?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Connect your Samsara fleet to WhatsApp in under 10 minutes. 
            No technical complexity, no infrastructure headaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="min-w-[200px] bg-blue-600 hover:bg-blue-700">
              <Settings className="w-5 h-5 mr-2" />
              Get Started Now
            </Button>
            <Button variant="outline" size="lg" className="min-w-[200px] text-white border-white hover:bg-white hover:text-gray-900">
              <Phone className="w-5 h-5 mr-2" />
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600 mr-2" />
                <span className="font-bold text-gray-900">Fleet.Chat</span>
              </div>
              <p className="text-sm text-gray-600">
                Invisible communication infrastructure for modern fleet operations.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Features</div>
                <div>Pricing</div>
                <div>Documentation</div>
                <div>API Reference</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>About</div>
                <div>Careers</div>
                <div>Contact</div>
                <div>Support</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
                <div>GDPR Compliance</div>
                <div>Security</div>
              </div>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2025 Fleet.Chat. All rights reserved.
            </p>
            <div className="flex items-center mt-4 md:mt-0">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}