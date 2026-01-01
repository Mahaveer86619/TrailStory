import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi, setAuthData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'register';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { token, refresh_token, user } = await authApi.login(formData.email, formData.password);
        setAuthData(token, refresh_token, user);
        toast({
          title: 'Welcome back!',
          description: `Good to see you again, ${user.display_name}.`,
        });
      } else {
        const { token, refresh_token, user } = await authApi.register(
          formData.email,
          formData.password,
          formData.displayName
        );
        setAuthData(token, refresh_token, user);
        toast({
          title: 'Account created!',
          description: 'Welcome to TrailStory. Start your first journey!',
        });
      }
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Authentication failed',
        description: error.response?.data?.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-12 group">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold text-foreground tracking-tight">
              TrailStory
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'login'
                ? 'Enter your credentials to access your journeys'
                : 'Start documenting your adventures'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="Your name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="pl-11 h-12"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-11 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-11 h-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base shadow-glow group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-2 text-primary font-medium hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-accent relative overflow-hidden">
        {/* Pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="hsl(var(--primary))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="max-w-md text-center">
            {/* Floating Cards */}
            <div className="relative mb-12">
              <div className="absolute -top-8 -left-8 w-32 h-40 bg-card rounded-xl shadow-lg transform -rotate-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="p-4">
                  <div className="w-full h-16 bg-muted rounded-lg mb-3" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="absolute -top-4 left-16 w-32 h-40 bg-card rounded-xl shadow-lg transform rotate-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
                <div className="p-4">
                  <div className="w-full h-16 bg-primary/10 rounded-lg mb-3" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="relative w-40 h-48 bg-card rounded-xl shadow-xl mx-auto animate-fade-in" style={{ animationDelay: '600ms' }}>
                <div className="p-5">
                  <div className="w-full h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-4">
              Document your adventures
            </h2>
            <p className="text-muted-foreground">
              Create beautiful travel journals with checkpoints, photos, and personal notes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;