import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { MapPin, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Illustration */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-accent mx-auto flex items-center justify-center">
            <MapPin className="w-16 h-16 text-primary/40" />
          </div>
          <div className="absolute top-0 right-1/4 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm animate-bounce">
            ?
          </div>
        </div>

        {/* Content */}
        <h1 className="text-4xl font-bold text-foreground mb-4">Lost your way?</h1>
        <p className="text-muted-foreground mb-8">
          This checkpoint doesn't exist on your map. 
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto shadow-glow"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
