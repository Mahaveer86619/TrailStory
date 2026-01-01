import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, MapPin, Calendar, Lock, Globe, Loader2, 
  MoreHorizontal, Trash2, Eye, Route 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { journeyApi, Journey, isAuthenticated } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newJourney, setNewJourney] = useState({
    title: '',
    description: '',
    is_public: true,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchJourneys();
  }, [navigate]);

  const fetchJourneys = async () => {
    try {
      const data = await journeyApi.getAll();
      setJourneys(data || []);
    } catch (error) {
      toast({
        title: 'Failed to load journeys',
        description: 'Please try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJourney.title.trim()) return;

    setCreating(true);
    try {
      const created = await journeyApi.create(newJourney);
      setJourneys(prev => [created, ...prev]);
      setCreateDialogOpen(false);
      setNewJourney({ title: '', description: '', is_public: true });
      toast({
        title: 'Journey created!',
        description: 'Start adding checkpoints to your new journey.',
      });
      navigate(`/journey/${created.id}`);
    } catch (error) {
      toast({
        title: 'Failed to create journey',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJourney = async (id: string) => {
    try {
      await journeyApi.delete(id);
      setJourneys(prev => prev.filter(j => j.id !== id));
      toast({
        title: 'Journey deleted',
        description: 'The journey has been permanently removed.',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your journeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Journeys</h1>
            <p className="text-muted-foreground">
              {journeys.length === 0
                ? 'Start your first adventure'
                : `${journeys.length} journey${journeys.length !== 1 ? 's' : ''} documented`}
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-glow group">
                <Plus className="w-5 h-5 mr-2" />
                New Journey
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Journey</DialogTitle>
                <DialogDescription>
                  Start a new adventure. You can add checkpoints later.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateJourney} className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Journey Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Kyoto Adventure"
                    value={newJourney.title}
                    onChange={(e) => setNewJourney(prev => ({ ...prev, title: e.target.value }))}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this journey about?"
                    value={newJourney.description}
                    onChange={(e) => setNewJourney(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {newJourney.is_public ? (
                      <Globe className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {newJourney.is_public ? 'Public' : 'Private'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {newJourney.is_public
                          ? 'Anyone can view this journey'
                          : 'Only you can see this journey'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={newJourney.is_public}
                    onCheckedChange={(checked) => 
                      setNewJourney(prev => ({ ...prev, is_public: checked }))
                    }
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full shadow-glow" disabled={creating}>
                    {creating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Create Journey
                        <Route className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Journey Grid */}
        {journeys.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">No journeys yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Create your first journey to start documenting your adventures 
              with checkpoints and photos.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="shadow-glow">
              <Plus className="w-5 h-5 mr-2" />
              Create First Journey
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {journeys.map((journey, index) => (
              <div
                key={journey.id}
                className="group bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/journey/${journey.id}`)}
              >
                {/* Card Header */}
                <div className="h-32 bg-gradient-to-br from-primary/10 via-accent to-primary/5 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Route className="w-12 h-12 text-primary/40" />
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    {journey.visibility === 'Private' ? (
                      <div className="px-2 py-1 bg-card/90 backdrop-blur-sm rounded-md text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Private
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-card/90 backdrop-blur-sm rounded-md text-xs font-medium text-primary flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      journey.status === 'Ongoing' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {journey.status}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-lg truncate group-hover:text-primary transition-colors">
                        {journey.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(journey.start_date)}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/journey/${journey.id}`);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Journey
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJourney(journey.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;