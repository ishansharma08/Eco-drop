import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useEcoStore } from '@/contexts/EcoContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  Calendar, 
  Gift, 
  User, 
  Menu, 
  X,
  Leaf,
  Clock,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Shield,
  Users,
  ChevronDown
} from 'lucide-react';

interface NavigationProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

export const Navigation = ({ currentPage, onPageChange }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { userProfile } = useEcoStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const activePage = currentPage || location.pathname.replace('/', '') || 'home';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      navigate('/');
    }
  };

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scanner', label: 'AI Scanner', icon: Sparkles },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleNavigation = (id: string) => {
    if (onPageChange) {
      onPageChange(id);
    } else {
      navigate('/user');
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-gradient-primary text-primary-foreground shadow-eco sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & Portal Switcher */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleNavigation('home')}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">EcoDrop</span>
            </button>

            {/* Role / Portal Switcher Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-xs h-7 px-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 font-medium"
                >
                  <span className="mr-1 inline-flex items-center"><Leaf className="h-3 w-3 mr-1" /> Citizen Portal</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-xs">Switch Application Portal</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/user')} className="font-semibold text-primary">
                  <Leaf className="h-4 w-4 mr-2" /> Citizen View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/volunteer')} className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Volunteer Check-in
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin')} className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Admin Console
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(id)}
                className={`transition-smooth text-xs font-semibold px-3 h-8 ${
                  activePage === id 
                    ? 'bg-white/25 text-white shadow-sm' 
                    : 'text-primary-foreground/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {label}
              </Button>
            ))}
          </div>

          {/* Right Controls: Points, Theme, User Profile */}
          <div className="flex items-center space-x-2.5">
            {/* Live Points Counter Pill */}
            <button
              onClick={() => handleNavigation('rewards')}
              className="flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 transition px-2.5 py-1 rounded-full text-xs font-bold text-white border border-white/20 shadow-sm"
              title="View Rewards"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              <span>{userProfile.pointsBalance} pts</span>
            </button>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-white/10"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* User Profile Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('profile')}
              className="hidden md:flex text-xs h-8 px-2 text-white hover:bg-white/10"
            >
              <User className="h-4 w-4 mr-1.5" />
              <span className="max-w-[100px] truncate">{currentUser?.displayName || userProfile.name}</span>
            </Button>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden md:flex h-8 w-8 p-0 text-white hover:bg-white/10"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="lg:hidden h-8 w-8 p-0 text-white"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden bg-primary/95 backdrop-blur-md border-t border-white/15 px-4 py-3 space-y-1">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              onClick={() => {
                handleNavigation(id);
                setIsMenuOpen(false);
              }}
              className={`w-full justify-start text-xs h-9 ${
                activePage === id 
                  ? 'bg-white/20 text-white font-bold' 
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}

          {/* Portal Switcher in Mobile */}
          <div className="pt-2 border-t border-white/20 space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-white/70 block px-3 pt-1">
              Switch Portal
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate('/volunteer');
                setIsMenuOpen(false);
              }}
              className="w-full justify-start text-xs h-8 text-white/90 hover:bg-white/10"
            >
              <Users className="h-3.5 w-3.5 mr-2" /> Volunteer Desk
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate('/admin');
                setIsMenuOpen(false);
              }}
              className="w-full justify-start text-xs h-8 text-white/90 hover:bg-white/10"
            >
              <Shield className="h-3.5 w-3.5 mr-2" /> Admin Console
            </Button>
          </div>

          <div className="pt-2 border-t border-white/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-xs h-8 text-white/90 hover:bg-white/10"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;