// DEPRECATED: This file violates FleetChat Universal Fleet System Boundaries
// FleetChat SHALL NOT replicate ANY fleet management functionality
// Use TenantOnboarding.tsx for compliant Samsara configuration instead

export default function SamsaraIntegration() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">
          Feature Deprecated - Compliance Required
        </h2>
        <p className="text-yellow-700">
          This page has been deprecated to ensure compliance with FleetChat Universal Fleet System Boundaries. 
          FleetChat operates as a pure communication protocol service only.
        </p>
        <div className="mt-4">
          <a 
            href="/tenant-onboarding" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Compliant Setup →
          </a>
        </div>
      </div>
      
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">FleetChat System Boundaries</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>✅ <strong>Permitted:</strong> Bidirectional message relay between Samsara and WhatsApp</p>
          <p>✅ <strong>Permitted:</strong> Driver phone number mapping for communication routing</p>
          <p>✅ <strong>Permitted:</strong> API token configuration for message processing</p>
          <p className="text-red-600">❌ <strong>Prohibited:</strong> Route creation or fleet management functionality</p>
          <p className="text-red-600">❌ <strong>Prohibited:</strong> Vehicle tracking or operational control</p>
          <p className="text-red-600">❌ <strong>Prohibited:</strong> Analytics or dashboards competing with Samsara</p>
        </div>
      </div>
    </div>
  );
}

interface SamsaraVehicle {
  id: string;
  name: string;
  licensePlate: string;
  make: string;
  model: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface SamsaraDriver {
  id: string;
  name: string;
  dutyStatus: string;
  currentVehicleId?: string;
}

interface SamsaraEvent {
  id: string;
  transportId: string;
  platform: string;
  operation: string;
  success: boolean;
  timestamp: string;
  errorMessage?: string;
}

function VehicleCard({ vehicle }: { vehicle: SamsaraVehicle }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Truck className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{vehicle.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{vehicle.licensePlate}</p>
            <p className="text-xs text-gray-500">{vehicle.make} {vehicle.model}</p>
          </div>
        </div>
        {vehicle.location && (
          <div className="text-right">
            <MapPin className="h-4 w-4 text-green-600 inline mr-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">{vehicle.location.address}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DriverCard({ driver }: { driver: SamsaraDriver }) {
  const statusColors = {
    on_duty: "bg-green-100 text-green-800",
    off_duty: "bg-gray-100 text-gray-800", 
    driving: "bg-blue-100 text-blue-800",
    sleeper_berth: "bg-yellow-100 text-yellow-800"
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{driver.name}</h3>
            {driver.currentVehicleId && (
              <p className="text-xs text-gray-500">Vehicle: {driver.currentVehicleId}</p>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[driver.dutyStatus as keyof typeof statusColors] || statusColors.off_duty}`}>
          {driver.dutyStatus.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: SamsaraEvent }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {event.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{event.operation}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Transport: {event.transportId}</p>
            {event.errorMessage && (
              <p className="text-xs text-red-600">{event.errorMessage}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <Clock className="h-4 w-4 text-gray-400 inline mr-1" />
          <p className="text-xs text-gray-500">
            {new Date(event.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function CreateRouteForm({ onClose }: { onClose: () => void }) {
  const [transportId, setTransportId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  
  const queryClient = useQueryClient();
  
  const { data: vehicles = [] } = useQuery<SamsaraVehicle[]>({
    queryKey: ["/api/samsara/vehicles"]
  });

  const { data: drivers = [] } = useQuery<SamsaraDriver[]>({
    queryKey: ["/api/samsara/drivers"]
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data: { transportId: string; vehicleId: string; driverId?: string }) => {
      const response = await fetch("/api/samsara/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create route");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transports"] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRouteMutation.mutate({
      transportId,
      vehicleId,
      driverId: driverId || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create Samsara Route</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transport ID
            </label>
            <input
              type="text"
              value={transportId}
              onChange={(e) => setTransportId(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Enter transport ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vehicle
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.licensePlate})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Driver (Optional)
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.dutyStatus})
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={createRouteMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createRouteMutation.isPending ? "Creating..." : "Create Route"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SamsaraIntegration() {
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [activeTab, setActiveTab] = useState("vehicles");

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<SamsaraVehicle[]>({
    queryKey: ["/api/samsara/vehicles"]
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery<SamsaraDriver[]>({
    queryKey: ["/api/samsara/drivers"]
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<SamsaraEvent[]>({
    queryKey: ["/api/tms-integrations"],
    select: (data) => data.filter((event: any) => event.platform === "samsara")
  });

  const isConnected = vehicles.length > 0 || drivers.length > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Samsara Integration</h1>
            <p className="text-gray-600 dark:text-gray-400">Fleet management and real-time tracking</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-600 font-medium">Disconnected</span>
              </>
            )}
          </div>
          
          <button
            onClick={() => setShowCreateRoute(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Route
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {["vehicles", "drivers", "events"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "vehicles" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fleet Vehicles</h2>
              <span className="text-sm text-gray-500">{vehicles.length} vehicles</span>
            </div>
            
            {vehiclesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No vehicles found</h3>
                <p className="text-gray-600 dark:text-gray-400">Connect your Samsara account to see fleet vehicles</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "drivers" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Drivers</h2>
              <span className="text-sm text-gray-500">{drivers.length} drivers</span>
            </div>
            
            {driversLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : drivers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {drivers.map((driver) => (
                  <DriverCard key={driver.id} driver={driver} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No drivers found</h3>
                <p className="text-gray-600 dark:text-gray-400">Connect your Samsara account to see drivers</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Integration Events</h2>
              <span className="text-sm text-gray-500">{events.length} events</span>
            </div>
            
            {eventsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Integration events will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateRoute && <CreateRouteForm onClose={() => setShowCreateRoute(false)} />}
    </div>
  );
}