import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Navigation, Clock, Truck, Target } from "lucide-react";
import type { LocationTracking, Transport } from "@shared/schema";

interface LocationWithTransport extends LocationTracking {
  transport?: Transport;
}

function LocationCard({ location }: { location: LocationWithTransport }) {
  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getGeofenceIcon = () => {
    if (!location.isGeofenced) return <MapPin className="h-5 w-5 text-gray-500" />;
    
    switch (location.geofenceType) {
      case 'pickup':
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'delivery':
        return <Target className="h-5 w-5 text-green-500" />;
      case 'yard':
        return <Target className="h-5 w-5 text-purple-500" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="workflow-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getGeofenceIcon()}
          <div>
            <h3 className="font-semibold">Transport {location.transportId}</h3>
            <p className="text-sm text-muted-foreground">
              Driver {location.driverId}
            </p>
          </div>
        </div>
        {location.isGeofenced && (
          <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            {location.geofenceType}
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Coordinates:</span>
          <span className="font-mono">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Timestamp:</span>
          <span>{formatTimestamp(location.timestamp)}</span>
        </div>

        {location.accuracy && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accuracy:</span>
            <span>{Math.round(location.accuracy)}m</span>
          </div>
        )}

        {location.speed && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Speed:</span>
            <span>{Math.round(location.speed)} km/h</span>
          </div>
        )}

        {location.heading && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Heading:</span>
            <span>{Math.round(location.heading)}°</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t">
        <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          <Navigation className="h-4 w-4" />
          <span>View on Map</span>
        </button>
      </div>
    </div>
  );
}

function TrackingSummary({ locations }: { locations: LocationTracking[] }) {
  const activeTransports = new Set(locations.map(l => l.transportId)).size;
  const geofencedLocations = locations.filter(l => l.isGeofenced).length;
  const recentLocations = locations.filter(l => {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(l.timestamp) > hourAgo;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="workflow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Transports</p>
            <p className="text-2xl font-bold">{activeTransports}</p>
          </div>
          <Truck className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      
      <div className="workflow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Recent Updates</p>
            <p className="text-2xl font-bold">{recentLocations}</p>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </div>
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      
      <div className="workflow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Geofenced</p>
            <p className="text-2xl font-bold">{geofencedLocations}</p>
            <p className="text-xs text-muted-foreground">At checkpoints</p>
          </div>
          <Target className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function Tracking() {
  const [transportFilter, setTransportFilter] = useState('all');

  const { data: locations, isLoading } = useQuery<LocationTracking[]>({
    queryKey: ['/api/location-tracking'],
    queryFn: async () => {
      const response = await fetch('/api/transports');
      if (!response.ok) throw new Error('Failed to fetch transports');
      const transports = await response.json();
      
      // Get locations for all active transports
      const locationPromises = transports
        .filter((t: Transport) => t.isActive)
        .map(async (transport: Transport) => {
          const locResponse = await fetch(`/api/transports/${transport.id}/location`);
          if (locResponse.ok) {
            return locResponse.json();
          }
          return [];
        });
      
      const allLocations = await Promise.all(locationPromises);
      return allLocations.flat();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredLocations = locations?.filter(location => {
    if (transportFilter === 'all') return true;
    if (transportFilter === 'geofenced') return location.isGeofenced;
    return location.transportId === transportFilter;
  }) || [];

  const uniqueTransports = Array.from(new Set(locations?.map(l => l.transportId) || []));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">GPS Tracking & ETA</h1>
        <div className="flex items-center space-x-4">
          <select
            value={transportFilter}
            onChange={(e) => setTransportFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Transports</option>
            <option value="geofenced">Geofenced Only</option>
            {uniqueTransports.map(transportId => (
              <option key={transportId} value={transportId}>
                Transport {transportId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {locations && <TrackingSummary locations={locations} />}

      {/* Location Updates */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="workflow-card animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-5 w-5 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredLocations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map(location => (
              <LocationCard key={location.id} location={location} />
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No location data found</h3>
          <p className="text-muted-foreground">
            {transportFilter !== 'all' 
              ? 'No location updates for the selected filter'
              : 'Location tracking data will appear here when drivers share their GPS position'
            }
          </p>
        </div>
      )}

      {/* GDPR Notice */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
          <div>
            <h4 className="font-semibold text-sm">GDPR Compliant Tracking</h4>
            <p className="text-sm text-muted-foreground mt-1">
              All location data is anonymized and encrypted. Driver identities are protected through pseudonymization.
              Location tracking requires explicit consent and can be disabled at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}