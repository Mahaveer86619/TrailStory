import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isAuthenticated, clearAuthData, getStoredUser } from '@/lib/api';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  const isLandingPage = location.pathname === '/';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isLandingPage ? 'glass border-b border-border/50' : 'bg-card border-b border-border'
    }`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          to={authenticated ? '/dashboard' : '/'} 
          className="flex items-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            TrailStory
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {authenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {user?.display_name || 'User'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/login')}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Button>
              <Button 
                size="sm"
                onClick={() => navigate('/login')}
                className="shadow-glow"
              >
                Get Started
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
