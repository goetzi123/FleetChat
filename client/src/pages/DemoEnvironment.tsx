import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, MessageSquare, MapPin, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface DemoTransport {
  id: string;
  reference: string;
  pickup: string;
  delivery: string;
  status: string;
  driver: string;
  eta: string;
  progress: number;
}

interface WhatsAppMessage {
  id: string;
  sender: "driver" | "system";
  content: string;
  timestamp: string;
  type: "text" | "button" | "location" | "document";
  buttons?: string[];
}

export default function DemoEnvironment() {
  const [activeTransport, setActiveTransport] = useState<string>("T001");
  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: "1",
      sender: "system",
      content: "🚛 New Transport Assignment\n📍 Pickup: Hamburg Port Terminal\n📍 Delivery: Munich Distribution Center\n⏰ ETA: 14:30 Today",
      timestamp: "09:00",
      type: "button",
      buttons: ["Accept", "Need Info", "Call Dispatcher"]
    }
  ]);

  const demoTransports: DemoTransport[] = [
    {
      id: "T001",
      reference: "HAM-MUC-2025001",
      pickup: "Hamburg Port Terminal",
      delivery: "Munich Distribution Center", 
      status: "assigned",
      driver: "Driver-4A7B",
      eta: "14:30",
      progress: 0
    },
    {
      id: "T002", 
      reference: "BER-KOL-2025002",
      pickup: "Berlin Warehouse",
      delivery: "Cologne Industrial Park",
      status: "en_route",
      driver: "Driver-8C2F",
      eta: "16:45",
      progress: 65
    },
    {
      id: "T003",
      reference: "FRA-STU-2025003", 
      pickup: "Frankfurt Airport Cargo",
      delivery: "Stuttgart Manufacturing",
      status: "delivered",
      driver: "Driver-1D9E", 
      eta: "Completed",
      progress: 100
    }
  ];

  const samsaraEvents = [
    { time: "09:15", event: "Vehicle location updated", details: "GPS: 53.5511°N, 9.9937°E" },
    { time: "09:30", event: "Geofence entered", details: "Pickup location boundary" },
    { time: "10:15", event: "Engine started", details: "Trip initiated by driver" },
    { time: "11:00", event: "Document uploaded", details: "Loading confirmation POD" },
    { time: "12:30", event: "Safety event", details: "Hard braking detected - coaching alert sent" }
  ];

  const handleDriverResponse = (response: string) => {
    const newMessage: WhatsAppMessage = {
      id: Date.now().toString(),
      sender: "driver",
      content: response,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: "text"
    };

    let systemResponse: WhatsAppMessage | null = null;

    // Simulate system responses based on driver input
    switch (response) {
      case "Accept":
        systemResponse = {
          id: (Date.now() + 1).toString(),
          sender: "system",
          content: "✅ Assignment accepted! Route activated in Samsara.\n📍 Navigate to pickup location\n🕐 Expected pickup: 10:30",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: "button",
          buttons: ["Start Navigation", "Arrived at Pickup", "Report Issue"]
        };
        break;
      case "Arrived at Pickup":
        systemResponse = {
          id: (Date.now() + 1).toString(),
          sender: "system", 
          content: "📍 Arrival confirmed at Hamburg Port Terminal\n📄 Please upload loading documents when ready",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: "button",
          buttons: ["Loading Complete", "Upload Document", "Share Location"]
        };
        break;
      case "Loading Complete":
        systemResponse = {
          id: (Date.now() + 1).toString(),
          sender: "system",
          content: "🚛 En route to delivery location\n📍 Munich Distribution Center\n⏰ Updated ETA: 14:30\n\nSafe travels!",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: "button", 
          buttons: ["Arrived at Delivery", "Update ETA", "Emergency"]
        };
        break;
      case "Arrived at Delivery":
        systemResponse = {
          id: (Date.now() + 1).toString(),
          sender: "system",
          content: "🎯 Delivery location reached!\n📄 Please upload POD to complete transport",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: "button",
          buttons: ["Upload POD", "Delivery Complete", "Issue with Delivery"]
        };
        break;
      case "Delivery Complete":
        systemResponse = {
          id: (Date.now() + 1).toString(),
          sender: "system",
          content: "✅ Transport completed successfully!\n💰 Payment processed\n📊 Performance: Excellent\n\nThank you for the delivery!",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: "text"
        };
        break;
    }

    const newMessages = systemResponse 
      ? [...messages, newMessage, systemResponse]
      : [...messages, newMessage];
    
    setMessages(newMessages);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-blue-500";
      case "en_route": return "bg-yellow-500";
      case "delivered": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned": return <Clock className="h-4 w-4" />;
      case "en_route": return <Truck className="h-4 w-4" />;
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">ZeKju Demo Environment</h1>
        <p className="text-muted-foreground mt-2">
          Interactive demonstration of WhatsApp transport workflows with Samsara integration
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="whatsapp">WhatsApp Chat</TabsTrigger>
          <TabsTrigger value="transports">Transport Dashboard</TabsTrigger>
          <TabsTrigger value="samsara">Samsara Events</TabsTrigger>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WhatsApp Chat Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp Business Chat
                </CardTitle>
                <CardDescription>Driver communication interface</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "driver" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          message.sender === "driver"
                            ? "bg-blue-500 text-white"
                            : "bg-white border shadow-sm"
                        }`}
                      >
                        <div className="whitespace-pre-line text-sm">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">{message.timestamp}</div>
                        {message.buttons && (
                          <div className="space-y-2 mt-3">
                            {message.buttons.map((button, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleDriverResponse(button)}
                              >
                                {button}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transport Status Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Active Transport
                </CardTitle>
                <CardDescription>Real-time transport tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">HAM-MUC-2025001</span>
                    <Badge className={getStatusColor("assigned")}>
                      {getStatusIcon("assigned")} Assigned
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>Hamburg Port Terminal → Munich Distribution Center</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>ETA: 14:30 Today</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4" />
                      <span>Driver: Anonymous-4A7B</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "0%" }}></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Workflow Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Assignment sent via WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span>Awaiting driver acceptance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span>Route activation in Samsara</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transports">
          <Card>
            <CardHeader>
              <CardTitle>Transport Dashboard</CardTitle>
              <CardDescription>Overview of all active transports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoTransports.map((transport) => (
                  <div
                    key={transport.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setActiveTransport(transport.id)}
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{transport.reference}</div>
                      <div className="text-sm text-muted-foreground">
                        {transport.pickup} → {transport.delivery}
                      </div>
                      <div className="text-sm">Driver: {transport.driver}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={getStatusColor(transport.status)}>
                        {getStatusIcon(transport.status)} {transport.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground">ETA: {transport.eta}</div>
                      <div className="text-sm">{transport.progress}% Complete</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="samsara">
          <Card>
            <CardHeader>
              <CardTitle>Samsara Integration Events</CardTitle>
              <CardDescription>Real-time fleet management data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {samsaraEvents.map((event, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className="text-sm font-mono text-muted-foreground min-w-[50px]">
                      {event.time}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{event.event}</div>
                      <div className="text-sm text-muted-foreground">{event.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Integration</CardTitle>
                <CardDescription>Connected services and APIs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>WhatsApp Business API</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Demo Mode</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Samsara Fleet Management</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Simulated</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Transport Database</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">In-Memory</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Document Storage</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">Local</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demo Features</CardTitle>
                <CardDescription>Available functionality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Interactive WhatsApp workflow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Transport status tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Samsara event simulation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Driver anonymization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Real-time notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Document workflow</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}