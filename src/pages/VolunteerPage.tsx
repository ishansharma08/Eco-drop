import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VolunteerDashboard } from '@/components/VolunteerDashboard';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Users, Shield, Leaf, Sun, Moon } from 'lucide-react';

const VolunteerPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Volunteer-specific navigation */}
      <nav className="bg-gradient-primary text-primary-foreground shadow-eco sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black text-white">EcoDrop Volunteer Desk</span>
            </div>

            {/* Navigation & Portal Switching */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 text-white hover:bg-white/10"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="hidden sm:flex text-xs h-8 text-white hover:bg-white/10"
              >
                <Shield className="h-3.5 w-3.5 mr-1" /> Admin Console
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/user')}
                className="text-xs h-8 bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <Leaf className="h-3.5 w-3.5 mr-1" /> Citizen Portal
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <VolunteerDashboard />
    </div>
  );
};

export default VolunteerPage;
