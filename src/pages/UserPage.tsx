import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import { SchedulePage } from '@/components/SchedulePage';
import { AppointmentConfirmation } from '@/components/AppointmentConfirmation';
import { RewardsPage } from '@/components/RewardsPage';
import { HistoryPage } from '@/components/HistoryPage';
import { AISmartScanner } from '@/components/AISmartScanner';
import { GeminiSettings } from '@/components/GeminiSettings';
import { EcoPageLoader } from '@/components/EcoPageLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useEcoStore, DropoffAppointment } from '@/contexts/EcoContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Settings, 
  Leaf, 
  LogOut, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  Shield, 
  Check, 
  Sparkles,
  Zap,
  Cpu,
  ArrowLeft,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

const UserPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { userProfile, updateUserProfile, getAggregateImpact } = useEcoStore();
  
  // Navigation stack for true back-button routing (Item 7)
  const [currentPage, setCurrentPage] = useState('home');
  const [pageHistory, setPageHistory] = useState<string[]>(['home']);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<DropoffAppointment | null>(null);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editPhone, setEditPhone] = useState(userProfile.phone);
  const [editAddress, setEditAddress] = useState(userProfile.address);
  const [editLocality, setEditLocality] = useState(userProfile.locality);

  const impact = getAggregateImpact();

  const getPageTitle = (pageId: string | null) => {
    switch (pageId) {
      case 'home': return 'Dashboard';
      case 'scanner': return 'AI Smart Scanner';
      case 'schedule': return 'Drop-off Scheduler';
      case 'confirmation': return 'Digital Drop-off Pass';
      case 'rewards': return 'Eco-Rewards Catalog';
      case 'history': return 'Drop-off Audit History';
      case 'profile': return 'Citizen Profile';
      case 'gemini-settings': return 'Google Gemini AI Studio';
      default: return 'EcoDrop Portal';
    }
  };

  // Navigates and triggers the custom eco loader (Item 3 & 7)
  const navigateTo = (nextPage: string, skipLoader = false) => {
    if (nextPage === currentPage) return;
    if (skipLoader) {
      setPageHistory(prev => [...prev, nextPage]);
      setCurrentPage(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsTransitioning(true);
    setTransitionTarget(nextPage);
    setTimeout(() => {
      setPageHistory(prev => [...prev, nextPage]);
      setCurrentPage(nextPage);
      setIsTransitioning(false);
      setTransitionTarget(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 650);
  };

  // Pops previous page from history stack (Item 7)
  const handleBack = () => {
    if (pageHistory.length > 1) {
      setIsTransitioning(true);
      const newHistory = [...pageHistory];
      newHistory.pop(); // Pop current
      const prevPage = newHistory[newHistory.length - 1] || 'home';
      setTransitionTarget(prevPage);
      setTimeout(() => {
        setPageHistory(newHistory);
        setCurrentPage(prevPage);
        setIsTransitioning(false);
        setTransitionTarget(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 550);
    } else {
      navigateTo('home');
    }
  };

  const handleScheduleComplete = (data: DropoffAppointment) => {
    setScheduleData(data);
    navigateTo('confirmation', true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: editName,
      phone: editPhone,
      address: editAddress,
      locality: editLocality
    });
    setIsEditing(false);
    toast.success('Profile information updated successfully!');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Dashboard 
            onSchedule={() => navigateTo('schedule')}
            onOpenScanner={() => navigateTo('scanner')}
            onViewHistory={() => navigateTo('history')}
            onViewRewards={() => navigateTo('rewards')}
          />
        );

      case 'scanner':
        return (
          <AISmartScanner 
            onScheduleDropoff={() => navigateTo('schedule')} 
            onOpenGeminiSettings={() => navigateTo('gemini-settings')}
          />
        );

      case 'schedule':
        return (
          <SchedulePage 
            onBack={handleBack}
            onScheduleComplete={handleScheduleComplete}
            onOpenScanner={() => navigateTo('scanner')}
          />
        );

      case 'confirmation':
        return (
          <AppointmentConfirmation 
            scheduleData={scheduleData!}
            onBack={handleBack}
            onDashboard={() => navigateTo('home')}
            onViewHistory={() => navigateTo('history')}
          />
        );

      case 'rewards':
        return <RewardsPage onBack={handleBack} />;

      case 'history':
        return <HistoryPage onBack={handleBack} />;

      case 'gemini-settings':
        return (
          <GeminiSettings 
            onBack={handleBack}
            onDone={() => navigateTo('scanner')}
          />
        );

      case 'profile':
        return (
          <div className="min-h-screen bg-background py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Profile & Account</h1>
                    <p className="text-xs md:text-sm text-muted-foreground">Manage your citizen credentials and drop-off address</p>
                  </div>
                </div>
                <Badge className="bg-primary/15 text-primary border-primary/30 font-mono text-xs">
                  {userProfile.tier}
                </Badge>
              </div>

              {/* Profile Card */}
              <Card className="shadow-card-eco border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      <span>Citizen Credentials</span>
                    </CardTitle>
                    {!isEditing && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        Edit Details
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Avatar and Header Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg">
                      <span className="text-2xl font-black">{userProfile.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{userProfile.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> {currentUser?.email || userProfile.email}
                      </p>
                      <Badge className="mt-1 bg-emerald-500/10 text-emerald-600 text-[10px]">
                        Verified Citizen Account
                      </Badge>
                    </div>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="address">Default Address / Campus Area</Label>
                        <Input
                          id="address"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="locality">Locality / Zone</Label>
                        <Input
                          id="locality"
                          value={editLocality}
                          onChange={(e) => setEditLocality(e.target.value)}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm">
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t text-sm">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-primary" /> Phone
                        </span>
                        <p className="font-semibold text-foreground">{userProfile.phone}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> Member Since
                        </span>
                        <p className="font-semibold text-foreground">
                          {new Date(userProfile.joinedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> Address
                        </span>
                        <p className="font-semibold text-foreground">{userProfile.address}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> Locality
                        </span>
                        <p className="font-semibold text-foreground">{userProfile.locality}</p>
                      </div>
                    </div>
                  )}

                  {/* Impact Summary Pill */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-muted/40 rounded-xl border text-center text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Balance</span>
                      <strong className="text-base text-primary font-black">{userProfile.pointsBalance} pts</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Total Diverted</span>
                      <strong className="text-base text-emerald-600 font-black">{impact.totalKg} kg</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Drop-offs</span>
                      <strong className="text-base text-foreground font-black">{userProfile.totalDropoffs}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dedicated Google Gemini API & Vision Engine Card (Item 5) */}
              <Card className="shadow-card-eco border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-teal-500/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <Key className="h-4 w-4" />
                      </div>
                      <span>Google Gemini AI Vision Engine</span>
                    </CardTitle>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs">
                      AI Diagnostics
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Configure your Google Gemini API key to enable live camera visual sorting, polymer resin ID, and contamination detection.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        Multimodal Visual Analysis
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Test and store your Google AI Studio API key securely in your browser session.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigateTo('gemini-settings')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs font-semibold"
                    >
                      <Key className="h-3.5 w-3.5 mr-1.5" /> Manage Gemini Key &rarr;
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Security & Sign Out */}
              <Card className="shadow-card-eco border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> Account & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs h-9"
                    onClick={() => toast.info('Notification preferences saved.')}
                  >
                    <Settings className="h-4 w-4 mr-2" /> Notification Preferences
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full justify-start text-xs h-9"
                    onClick={async () => {
                      try {
                        await logout();
                        navigate('/');
                      } catch (err) {
                        navigate('/');
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out of EcoDrop
                  </Button>
                </CardContent>
              </Card>

              <Button variant="outline" onClick={handleBack} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <Dashboard 
            onSchedule={() => navigateTo('schedule')}
            onOpenScanner={() => navigateTo('scanner')}
            onViewHistory={() => navigateTo('history')}
            onViewRewards={() => navigateTo('rewards')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={(page) => navigateTo(page)} 
      />

      {/* Custom Eco Page Transition Loader (Item 3) */}
      {isTransitioning && (
        <EcoPageLoader 
          fullScreen 
          message={`Opening ${getPageTitle(transitionTarget)}...`} 
        />
      )}

      {renderPage()}
    </div>
  );
};

export default UserPage;
