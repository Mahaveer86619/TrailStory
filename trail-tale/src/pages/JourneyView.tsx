import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  ArrowLeft, Clock, MapPin, Loader2, Image as ImageIcon, 
  ChevronRight, Route as RouteIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { journeyApi, Journey, Checkpoint, isAuthenticated } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Custom marker icon
const createMarkerIcon = (isActive: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
        isActive 
          ? 'bg-primary shadow-lg scale-125' 
          : 'bg-primary/80 shadow-md'
      }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Map controller component
const MapController = ({ 
  checkpoints, 
  activeCheckpoint 
}: { 
  checkpoints: Checkpoint[]; 
  activeCheckpoint: string | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (checkpoints.length > 0) {
      const bounds = L.latLngBounds(checkpoints.map(cp => cp.coords));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [checkpoints, map]);

  useEffect(() => {
    if (activeCheckpoint) {
      const checkpoint = checkpoints.find(cp => cp.id === activeCheckpoint);
      if (checkpoint) {
        map.flyTo(checkpoint.coords, 15, { duration: 1 });
      }
    }
  }, [activeCheckpoint, checkpoints, map]);

  return null;
};

const JourneyView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCheckpoint, setActiveCheckpoint] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.state?.journey) {
      setJourney(location.state.journey);
      setLoading(false);
      return;
    }

    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (id) {
      fetchJourney();
    }
  }, [id, navigate, location.state]);

  const fetchJourney = async () => {
    try {
      const data = await journeyApi.getById(id!);
      setJourney(data);
    } catch (error) {
      toast({
        title: 'Journey not found',
        description: 'Unable to load this journey.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckpointClick = (checkpointId: string) => {
    setActiveCheckpoint(checkpointId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading journey...</p>
        </div>
      </div>
    );
  }

  if (!journey) {
    return null;
  }

  const checkpoints = journey.checkpoints || [];
  const routeCoords = checkpoints.map(cp => cp.coords);
  const defaultCenter: [number, number] = checkpoints.length > 0 
    ? checkpoints[0].coords 
    : [35.6762, 139.6503]; // Tokyo default

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">{journey.title}</h1>
          <p className="text-sm text-muted-foreground">
            {checkpoints.length} checkpoint{checkpoints.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          journey.status === 'Ongoing' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {journey.status}
        </span>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="h-1/2 lg:h-full lg:flex-[2] relative">
          {checkpoints.length > 0 ? (
            <MapContainer
              center={defaultCenter}
              zoom={13}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Route Line */}
              <Polyline
                positions={routeCoords}
                pathOptions={{
                  color: 'hsl(173, 82%, 26%)',
                  weight: 4,
                  opacity: 0.8,
                  dashArray: '12, 8',
                }}
              />

              {/* Markers */}
              {checkpoints.map((checkpoint) => (
                <Marker
                  key={checkpoint.id}
                  position={checkpoint.coords}
                  icon={createMarkerIcon(activeCheckpoint === checkpoint.id)}
                  eventHandlers={{
                    click: () => handleCheckpointClick(checkpoint.id),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-semibold text-foreground mb-1">
                        {checkpoint.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {checkpoint.time}
                      </p>
                      {checkpoint.note && (
                        <p className="text-sm text-foreground">{checkpoint.note}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              <MapController 
                checkpoints={checkpoints} 
                activeCheckpoint={activeCheckpoint} 
              />
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No checkpoints yet</p>
              </div>
            </div>
          )}

          {/* Map Zoom Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              className="shadow-md bg-card hover:bg-card"
              onClick={() => {
                const map = document.querySelector('.leaflet-container');
                if (map) {
                  (map as any)._leaflet_map?.zoomIn();
                }
              }}
            >
              <span className="text-xl font-light">+</span>
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="shadow-md bg-card hover:bg-card"
              onClick={() => {
                const map = document.querySelector('.leaflet-container');
                if (map) {
                  (map as any)._leaflet_map?.zoomOut();
                }
              }}
            >
              <span className="text-xl font-light">−</span>
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div 
          ref={timelineRef}
          className="h-1/2 lg:h-full lg:flex-1 bg-card border-t lg:border-t-0 lg:border-l border-border overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <RouteIcon className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Timeline</h2>
            </div>

            {checkpoints.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No checkpoints added</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first checkpoint to start your story
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {checkpoints.map((checkpoint, index) => (
                  <div
                    key={checkpoint.id}
                    className={`relative pl-8 pb-8 cursor-pointer group transition-all duration-200 ${
                      activeCheckpoint === checkpoint.id ? 'scale-[1.02]' : ''
                    }`}
                    onClick={() => handleCheckpointClick(checkpoint.id)}
                  >
                    {/* Timeline Line */}
                    {index < checkpoints.length - 1 && (
                      <div className="absolute left-[11px] top-6 w-0.5 h-[calc(100%-12px)] bg-timeline-line" />
                    )}

                    {/* Timeline Dot */}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      activeCheckpoint === checkpoint.id
                        ? 'bg-primary shadow-glow scale-110'
                        : 'bg-primary/20 group-hover:bg-primary/40'
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        activeCheckpoint === checkpoint.id
                          ? 'bg-primary-foreground'
                          : 'bg-primary'
                      }`} />
                    </div>

                    {/* Checkpoint Card */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                      activeCheckpoint === checkpoint.id
                        ? 'bg-accent border-primary/30 shadow-md'
                        : 'bg-background border-border group-hover:border-primary/20 group-hover:shadow-sm'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground">
                            {checkpoint.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-sm">{checkpoint.time}</span>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
                          activeCheckpoint === checkpoint.id ? 'text-primary rotate-90' : ''
                        }`} />
                      </div>

                      {checkpoint.note && (
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                          {checkpoint.note}
                        </p>
                      )}

                      {checkpoint.image && (
                        <div className="mt-3 rounded-lg overflow-hidden">
                          <img
                            src={checkpoint.image}
                            alt={checkpoint.title}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {!checkpoint.image && checkpoint.note && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>No photo attached</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyView;
