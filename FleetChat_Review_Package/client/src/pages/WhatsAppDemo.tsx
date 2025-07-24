import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Truck, 
  MapPin, 
  Clock, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Phone
} from "lucide-react";

interface WhatsAppMessage {
  id: string;
  sender: 'system' | 'driver';
  timestamp: Date;
  type: 'text' | 'template' | 'button_response' | 'location' | 'document';
  content: {
    text?: string;
    buttons?: string[];
    quickReplies?: string[];
    location?: { lat: number; lng: number; address: string };
    document?: { filename: string; type: string };
  };
  transportId?: string;
}

interface DemoTransport {
  id: string;
  status: string;
  pickupLocation: string;
  deliveryLocation: string;
  driverName: string;
  eta: string;
}

export default function WhatsAppDemo() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [activeTransport, setActiveTransport] = useState<DemoTransport>({
    id: "TRK-001",
    status: "dispatched",
    pickupLocation: "ABC Warehouse, Chicago",
    deliveryLocation: "XYZ Distribution, Detroit",
    driverName: "John Driver",
    eta: "6:00 PM"
  });
  const [currentStep, setCurrentStep] = useState(0);

  const demoScenarios = [
    {
      title: "Transport Assignment",
      systemMessage: "🚀 New Transport Assignment\n\nID: #TRK-001\nFrom: ABC Warehouse, Chicago\nTo: XYZ Distribution, Detroit\nExpected Delivery: 6:00 PM\n\nPlease confirm when you're ready to start.",
      buttons: ["✅ Accept Transport", "📋 View Details", "📞 Call Dispatch"],
      status: "dispatched"
    },
    {
      title: "Arrival at Pickup",
      systemMessage: "🎯 Arrived at Pickup Location\n\nLocation: ABC Warehouse, Chicago\nTime: 2:45 PM\n\nPlease confirm arrival and begin loading process.",
      buttons: ["✅ Confirm Arrival", "🚛 Start Loading", "❓ Need Help"],
      status: "arrived_pickup"
    },
    {
      title: "Loading Complete",
      systemMessage: "📦 Loading Status Update\n\nTransport: #TRK-001\nLocation: ABC Warehouse\n\nPlease confirm when loading is complete and ready to depart.",
      buttons: ["✅ Loading Complete", "📋 View Manifest", "🆘 Issue Report"],
      status: "loaded"
    },
    {
      title: "En Route Update",
      systemMessage: "🚛 En Route to Delivery\n\nTransport: #TRK-001\nDestination: XYZ Distribution, Detroit\nCurrent ETA: 6:00 PM\n\nDrive safely! Update if ETA changes.",
      quickReplies: ["⏰ On Time", "⏰ +15 min", "⏰ +30 min", "📞 Call Dispatch"],
      status: "en_route"
    },
    {
      title: "Delivery Arrival",
      systemMessage: "🎯 Arrived at Delivery Location\n\nLocation: XYZ Distribution, Detroit\nTime: 5:45 PM\n\nPlease confirm arrival and begin unloading process.",
      buttons: ["✅ Confirm Arrival", "🚛 Start Unloading", "📞 Contact Receiver"],
      status: "arrived_delivery"
    },
    {
      title: "Delivery Complete",
      systemMessage: "🏁 Delivery Completed\n\nTransport: #TRK-001\nFinal Destination: XYZ Distribution\nCompletion Time: 6:15 PM\n\nPlease upload delivery documents.",
      buttons: ["📄 Upload POD", "📷 Take Photo", "✅ All Complete"],
      status: "delivered"
    }
  ];

  useEffect(() => {
    // Initialize with first scenario
    if (messages.length === 0) {
      addSystemMessage(demoScenarios[0]);
    }
  }, []);

  const addSystemMessage = (scenario: any) => {
    const message: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      sender: 'system',
      timestamp: new Date(),
      type: 'template',
      content: {
        text: scenario.systemMessage,
        buttons: scenario.buttons,
        quickReplies: scenario.quickReplies
      },
      transportId: activeTransport.id
    };
    setMessages(prev => [...prev, message]);
    setActiveTransport(prev => ({ ...prev, status: scenario.status }));
  };

  const handleDriverResponse = (response: string, type: 'button' | 'quick_reply') => {
    // Add driver response
    const driverMessage: WhatsAppMessage = {
      id: `msg-${Date.now()}-driver`,
      sender: 'driver',
      timestamp: new Date(),
      type: type === 'button' ? 'button_response' : 'text',
      content: { text: response },
      transportId: activeTransport.id
    };
    setMessages(prev => [...prev, driverMessage]);

    // Add system confirmation
    setTimeout(() => {
      const confirmationMessage: WhatsAppMessage = {
        id: `msg-${Date.now()}-confirm`,
        sender: 'system',
        timestamp: new Date(),
        type: 'text',
        content: { text: getConfirmationMessage(response) }
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }, 1000);
  };

  const getConfirmationMessage = (response: string): string => {
    if (response.includes("Accept Transport")) {
      return "✅ Transport accepted! Head to ABC Warehouse when ready. Drive safely!";
    }
    if (response.includes("Confirm Arrival")) {
      return "✅ Arrival confirmed. Location updated in system. Proceed with next step.";
    }
    if (response.includes("Loading Complete")) {
      return "✅ Loading confirmed. Safe travels to Detroit! ETA updated to 6:00 PM.";
    }
    if (response.includes("On Time")) {
      return "⏰ ETA confirmed. Dispatcher notified. Continue to destination.";
    }
    if (response.includes("+15 min")) {
      return "⏰ ETA updated to 6:15 PM. Dispatcher and receiver notified of delay.";
    }
    if (response.includes("Upload POD")) {
      return "📄 Ready for document upload. Please take photo of signed POD.";
    }
    if (response.includes("All Complete")) {
      return "🎉 Transport completed successfully! Great job on this delivery.";
    }
    return "✅ Acknowledged. Your response has been recorded.";
  };

  const nextScenario = () => {
    if (currentStep < demoScenarios.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeout(() => addSystemMessage(demoScenarios[nextStep]), 500);
    }
  };

  const resetDemo = () => {
    setMessages([]);
    setCurrentStep(0);
    setActiveTransport({
      id: "TRK-001",
      status: "dispatched",
      pickupLocation: "ABC Warehouse, Chicago",
      deliveryLocation: "XYZ Distribution, Detroit",
      driverName: "John Driver",
      eta: "6:00 PM"
    });
    setTimeout(() => addSystemMessage(demoScenarios[0]), 500);
  };

  const simulateLocationShare = () => {
    const locationMessage: WhatsAppMessage = {
      id: `msg-${Date.now()}-location`,
      sender: 'driver',
      timestamp: new Date(),
      type: 'location',
      content: {
        location: {
          lat: 41.8781,
          lng: -87.6298,
          address: "Chicago, IL"
        }
      }
    };
    setMessages(prev => [...prev, locationMessage]);

    setTimeout(() => {
      const confirmMessage: WhatsAppMessage = {
        id: `msg-${Date.now()}-loc-confirm`,
        sender: 'system',
        timestamp: new Date(),
        type: 'text',
        content: { text: "📍 Location received and updated. Thank you for the update!" }
      };
      setMessages(prev => [...prev, confirmMessage]);
    }, 1000);
  };

  const simulateDocumentUpload = () => {
    const docMessage: WhatsAppMessage = {
      id: `msg-${Date.now()}-doc`,
      sender: 'driver',
      timestamp: new Date(),
      type: 'document',
      content: {
        document: {
          filename: "POD_TRK001_signed.jpg",
          type: "image/jpeg"
        }
      }
    };
    setMessages(prev => [...prev, docMessage]);

    setTimeout(() => {
      const confirmMessage: WhatsAppMessage = {
        id: `msg-${Date.now()}-doc-confirm`,
        sender: 'system',
        timestamp: new Date(),
        type: 'text',
        content: { text: "📄 Document uploaded successfully! POD is pending dispatcher approval." }
      };
      setMessages(prev => [...prev, confirmMessage]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'dispatched': 'bg-blue-100 text-blue-800',
      'arrived_pickup': 'bg-yellow-100 text-yellow-800',
      'loaded': 'bg-orange-100 text-orange-800',
      'en_route': 'bg-purple-100 text-purple-800',
      'arrived_delivery': 'bg-green-100 text-green-800',
      'delivered': 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WhatsApp Transport Communication Demo</h1>
        <p className="text-gray-600">
          Experience how drivers manage transport workflows through natural WhatsApp conversations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transport Status Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Active Transport
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Transport ID</div>
                <div className="font-semibold">{activeTransport.id}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <Badge className={getStatusColor(activeTransport.status)}>
                  {activeTransport.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div>
                <div className="text-sm text-gray-500">Driver</div>
                <div className="font-semibold">{activeTransport.driverName}</div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-blue-500" />
                  <div>
                    <div className="text-sm text-gray-500">Pickup</div>
                    <div className="text-sm">{activeTransport.pickupLocation}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-green-500" />
                  <div>
                    <div className="text-sm text-gray-500">Delivery</div>
                    <div className="text-sm">{activeTransport.deliveryLocation}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-1 text-orange-500" />
                  <div>
                    <div className="text-sm text-gray-500">ETA</div>
                    <div className="text-sm">{activeTransport.eta}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Demo Progress</div>
                <div className="text-xs text-gray-500">
                  Step {currentStep + 1} of {demoScenarios.length}: {demoScenarios[currentStep]?.title}
                </div>
                <div className="flex gap-2">
                  <Button onClick={nextScenario} size="sm" disabled={currentStep >= demoScenarios.length - 1}>
                    Next Scenario
                  </Button>
                  <Button onClick={resetDemo} variant="outline" size="sm">
                    Reset Demo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                WhatsApp Business Chat
                <Badge variant="outline" className="ml-auto">Live Demo</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'driver'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.type === 'location' && message.content.location ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm font-medium">Location Shared</span>
                          </div>
                          <div className="text-xs">{message.content.location.address}</div>
                        </div>
                      ) : message.type === 'document' && message.content.document ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm font-medium">Document</span>
                          </div>
                          <div className="text-xs">{message.content.document.filename}</div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content.text}
                        </div>
                      )}
                      
                      {message.content.buttons && message.sender === 'system' && (
                        <div className="mt-3 space-y-2">
                          {message.content.buttons.map((button, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="block w-full text-left bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                              onClick={() => handleDriverResponse(button, 'button')}
                            >
                              {button}
                            </Button>
                          ))}
                        </div>
                      )}

                      {message.content.quickReplies && message.sender === 'system' && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {message.content.quickReplies.map((reply, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="text-xs bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                              onClick={() => handleDriverResponse(reply, 'quick_reply')}
                            >
                              {reply}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs mt-2 opacity-70">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Demo Actions */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">Additional Demo Actions</div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={simulateLocationShare}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Share Location
                  </Button>
                  <Button
                    onClick={simulateDocumentUpload}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Upload Document
                  </Button>
                  <Button
                    onClick={() => handleDriverResponse("Need help with loading", 'quick_reply')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Request Help
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Demo Features Showcase</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800">Interactive Templates</h4>
            <p className="text-blue-700">Context-aware messages with buttons and quick replies</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Real-time Updates</h4>
            <p className="text-blue-700">Automatic status progression and notifications</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Document Handling</h4>
            <p className="text-blue-700">POD uploads and approval workflows</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Location Tracking</h4>
            <p className="text-blue-700">GPS sharing and geofencing capabilities</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Natural Language</h4>
            <p className="text-blue-700">Free-text responses with intelligent processing</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Backend Integration</h4>
            <p className="text-blue-700">Automatic system updates and data synchronization</p>
          </div>
        </div>
      </div>
    </div>
  );
}