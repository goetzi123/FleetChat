import { Router, Route, Link, useLocation } from "wouter";
import { Truck, Users as UsersIcon, FileText, MapPin, BarChart3, Settings, MessageCircle } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Transports from "./pages/Transports";
import Documents from "./pages/Documents";
import Tracking from "./pages/Tracking";
import Users from "./pages/Users";
import SamsaraIntegration from "./pages/SamsaraIntegration";
import WhatsAppDemo from "./pages/WhatsAppDemo";
import DemoEnvironment from "./pages/DemoEnvironment";
import FleetSetup from "./pages/FleetSetup";
import FleetChatPublicSite from "./pages/FleetChatPublicSite";
import FleetChatApp from "./pages/FleetChatApp";

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Demo Environment', href: '/demo', icon: MessageCircle },
  { name: 'Transports', href: '/transports', icon: Truck },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Tracking', href: '/tracking', icon: MapPin },
  { name: 'Samsara', href: '/samsara', icon: Settings },
];

function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border">
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Truck className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-bold">FleetChat</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function App() {
  const [location] = useLocation();
  
  // Show public site for fleet.chat routes
  if (location.startsWith('/fleet.chat') || location === '/public') {
    return <FleetChatPublicSite />;
  }
  
  // Show Fleet.Chat production app for /fleet routes
  if (location.startsWith('/fleet')) {
    return <FleetChatApp />;
  }

  // Default demo system
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Router>
          <Route path="/" component={Dashboard} />
          <Route path="/demo" component={DemoEnvironment} />
          <Route path="/transports" component={Transports} />
          <Route path="/users" component={Users} />
          <Route path="/documents" component={Documents} />
          <Route path="/tracking" component={Tracking} />
          <Route path="/samsara" component={SamsaraIntegration} />
          <Route path="/whatsapp-demo" component={WhatsAppDemo} />
          <Route>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-muted-foreground">Page Not Found</h1>
                <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
                <Link href="/" className="mt-4 inline-block text-primary hover:underline">
                  Go back to Dashboard
                </Link>
              </div>
            </div>
          </Route>
        </Router>
      </main>
    </div>
  );
}

export default App;