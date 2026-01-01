import { useNavigate } from 'react-router-dom';
import { MapPin, Route, Camera, Shield, ArrowRight, Compass, Loader2, Calendar, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { journeyApi, Journey, isAuthenticated } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Route,
    title: 'Manual Checkpoints',
    description: 'Add moments that matter. No constant tracking, just intentional memories.',
  },
  {
    icon: Camera,
    title: 'Rich Media',
    description: 'Attach photos and notes to each checkpoint. Tell your story your way.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your journeys are private by default. Share only what you want to share.',
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<Journey[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Fetch Global Feed
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const data = await journeyApi.getGlobalFeed(1, 6);
        setFeed(data || []); // Safety check for null
      } catch (error) {
        console.error("Failed to fetch feed", error);
        setFeed([]); // Ensure feed is an array on error
      } finally {
        setLoadingFeed(false);
      }
    };
    fetchFeed();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 pt-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-8 animate-fade-in">
              <Compass className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-accent-foreground">
                Privacy-first travel journaling
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight mb-6 animate-slide-up">
              Turn your journeys into{' '}
              <span className="relative">
                <span className="text-primary">stories</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path 
                    d="M2 8C50 2 150 2 198 8" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="opacity-40"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Create meaningful travel narratives with manual checkpoints. 
              Capture locations, photos, and notes—all on your own terms.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="group shadow-glow text-base px-8 py-6"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/login')}
                className="text-base px-8 py-6"
              >
                View Demo
              </Button>
            </div>
          </div>

          {/* Preview Card */}
          <div className="mt-20 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl" />
              
              {/* Card */}
              <div className="relative bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
                {/* Mock Map + Timeline */}
                <div className="flex flex-col lg:flex-row h-[400px]">
                  {/* Map Side */}
                  <div className="flex-1 lg:flex-[2] bg-muted relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-primary mx-auto mb-3 animate-pulse-soft" />
                        <p className="text-muted-foreground text-sm">Interactive Map View</p>
                      </div>
                    </div>
                    {/* Route Line Mock */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                      <path 
                        d="M50 250 Q100 200 150 180 T250 120 T350 80" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        strokeDasharray="8 4"
                        fill="none"
                        className="opacity-60"
                      />
                      <circle cx="50" cy="250" r="6" fill="hsl(var(--primary))" />
                      <circle cx="150" cy="180" r="6" fill="hsl(var(--primary))" />
                      <circle cx="250" cy="120" r="6" fill="hsl(var(--primary))" />
                      <circle cx="350" cy="80" r="6" fill="hsl(var(--primary))" />
                    </svg>
                  </div>
                  
                  {/* Timeline Side */}
                  <div className="flex-1 bg-card border-t lg:border-t-0 lg:border-l border-border p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Timeline
                    </h3>
                    <div className="space-y-4">
                      {['Golden Pavilion', 'Fushimi Inari', 'Arashiyama'].map((name, i) => (
                        <div key={name} className="flex gap-3 items-start">
                          <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                            {i < 2 && (
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-timeline-line" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{name}</p>
                            <p className="text-sm text-muted-foreground">10:00 AM</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Your journey, your narrative
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              TrailStory gives you complete control over how you document your travels.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group p-8 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Feed Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Explore the Community
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover journeys shared by travelers from around the world.
            </p>
          </div>

          {loadingFeed ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {feed.map((journey) => (
                <div 
                  key={journey.id}
                  onClick={() => navigate(`/journey/${journey.id}`, { state: { journey } })}
                  className="group bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  <div className="h-40 bg-muted relative overflow-hidden">
                     {journey.checkpoints && journey.checkpoints.length > 0 && journey.checkpoints[0].image ? (
                        <img 
                          src={journey.checkpoints[0].image} 
                          alt={journey.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                     ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center text-primary">
                           <MapPin className="w-10 h-10 text-primary/20" />
                        </div>
                     )}
                     <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                           {journey.status}
                        </Badge>
                     </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {journey.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                      {journey.description || "No description provided."}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                       <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(journey.start_date)}
                       </div>
                       <div className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          Public
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-12 text-center">
             <Button variant="outline" onClick={() => navigate('/login')}>
                View All Journeys <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Ready to start your story?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join travelers who prefer meaningful memories over constant tracking.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="shadow-glow text-base px-8 py-6"
            >
              Create Your First Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">TrailStory</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TrailStory. Your journeys, your stories.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
