import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEcoStore, DropoffAppointment } from '@/contexts/EcoContext';
import { useAuth } from '@/contexts/AuthContext';
import { DigitalPass } from '@/components/DigitalPass';
import { 
  MapPin, 
  Clock, 
  Calendar,
  TrendingUp,
  Recycle,
  Gift,
  Plus,
  Sparkles,
  Zap,
  Leaf,
  Droplets,
  TreeDeciduous,
  ArrowRight,
  QrCode,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import MapView from '@/components/MapView';
import { useGeolocation, haversineDistanceKm } from '@/hooks/use-geolocation';

interface DashboardProps {
  onSchedule: () => void;
  onOpenScanner?: () => void;
  onViewHistory?: () => void;
  onViewRewards?: () => void;
}

export const Dashboard = ({ onSchedule, onOpenScanner, onViewHistory, onViewRewards }: DashboardProps) => {
  const { currentUser } = useAuth();
  const { userProfile, appointments, stations, getAggregateImpact } = useEcoStore();
  const { position } = useGeolocation();

  const [selectedPass, setSelectedPass] = useState<DropoffAppointment | null>(null);

  const impact = getAggregateImpact();
  const upcomingAppointment = appointments.find(a => a.status === 'PENDING');

  const displayName = currentUser?.displayName || userProfile.name || 'Eco Citizen';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
                <Leaf className="h-3 w-3 mr-1" /> {userProfile.tier}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Member ID: {userProfile.id}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Every drop-off earns rewards while diverting municipal waste from landfills.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {onOpenScanner && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenScanner}
                className="border-primary/40 text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-4 w-4 mr-1.5" /> AI Waste Scanner
              </Button>
            )}
            <Button variant="hero" size="sm" onClick={onSchedule}>
              <Plus className="h-4 w-4 mr-1.5" /> Schedule Drop-off
            </Button>
          </div>
        </div>

        {/* Live Upcoming Appointment Alert Banner if one exists */}
        {upcomingAppointment && (
          <Card className="border-2 border-primary/30 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-teal-500/10 shadow-lg">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-primary text-primary-foreground rounded-xl shrink-0 shadow">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-primary tracking-wide">
                      {upcomingAppointment.referenceCode}
                    </span>
                    <Badge className="bg-primary/20 text-primary border-none text-[10px] animate-pulse">
                      READY FOR DROP-OFF
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base text-foreground mt-0.5">
                    {upcomingAppointment.stationName}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(`${upcomingAppointment.scheduledDate}T${upcomingAppointment.scheduledTime}:00`).toLocaleDateString()} at {upcomingAppointment.scheduledTime}</span>
                    <span>•</span>
                    <span className="font-semibold text-primary">+{upcomingAppointment.totalEstimatedPoints} pts reward</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-primary hover:bg-primary/90 text-xs"
                  onClick={() => setSelectedPass(upcomingAppointment)}
                >
                  <QrCode className="h-4 w-4 mr-1.5" /> View Digital Pass
                </Button>
                {onViewHistory && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={onViewHistory}
                  >
                    Manage
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Core Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-card-eco border-primary/20 bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Points Balance
                </span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                {userProfile.pointsBalance}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                <span>Total: {userProfile.totalPointsEarned} earned</span>
                {onViewRewards && (
                  <button onClick={onViewRewards} className="text-primary font-bold hover:underline">
                    Redeem &rarr;
                  </button>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card-eco border-primary/20 bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Waste Recycled
                </span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Recycle className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {impact.totalKg} <span className="text-sm font-semibold">kg</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Across {userProfile.totalDropoffs} drop-off appointments
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card-eco border-primary/20 bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  CO₂ Abated
                </span>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600">
                  <Leaf className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
                {impact.co2Kg} <span className="text-sm font-semibold">kg</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Equivalent to ~{impact.treesSaved} trees planted
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card-eco border-primary/20 bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Energy Conserved
                </span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {impact.energyKwh} <span className="text-sm font-semibold">kWh</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Plus {impact.waterLiters}L fresh water saved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Shortcuts & Station Map Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Map of Local Bin Stations */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="shadow-card-eco border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>Nearby Recycling Hubs</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {stations.filter(s => s.status !== 'Maintenance').length} Active Stations
                  </Badge>
                </div>
                <CardDescription>
                  Drop off sorted plastic, paper, e-waste, glass, and metal containers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MapView className="rounded-xl overflow-hidden border" />

                {/* Stations List */}
                <div className="space-y-2.5 pt-2">
                  {stations.slice(0, 3).map((st) => {
                    const dynamicDist = position
                      ? haversineDistanceKm(
                          { latitude: position.latitude, longitude: position.longitude },
                          { latitude: st.lat, longitude: st.lng }
                        ).toFixed(1)
                      : st.distance?.toString();

                    return (
                      <div
                        key={st.id}
                        className="p-3.5 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-sm text-foreground">{st.name}</h4>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                st.status === 'Open'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              }`}
                            >
                              {st.status} • {st.capacityPercent}% Full
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{st.address}</p>
                        </div>

                        <div className="flex items-center space-x-3 self-end sm:self-center">
                          {dynamicDist && (
                            <span className="text-xs font-mono font-semibold text-primary">
                              {dynamicDist} km away
                            </span>
                          )}
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onSchedule}>
                            Book Here
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Environmental Impact Breakdown & Quick Tools */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Navigation Card */}
            <Card className="shadow-card-eco border-primary/20 bg-gradient-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Smart Eco Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {onOpenScanner && (
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12 bg-background/80 hover:bg-primary/5 hover:border-primary/40"
                    onClick={onOpenScanner}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">AI Waste Scanner</div>
                        <div className="text-[10px] text-muted-foreground">Classify resin & get instant point yield</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-between h-12 bg-background/80 hover:bg-primary/5 hover:border-primary/40"
                  onClick={onSchedule}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Schedule Drop-off</div>
                      <div className="text-[10px] text-muted-foreground">Pick a time & lock in bonus rewards</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>

                {onViewRewards && (
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12 bg-background/80 hover:bg-primary/5 hover:border-primary/40"
                    onClick={onViewRewards}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                        <Gift className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Rewards Marketplace</div>
                        <div className="text-[10px] text-muted-foreground">Redeem points for coffee & transit passes</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Live Material Category Distribution */}
            <Card className="shadow-card-eco border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Recycling Breakdown</span>
                  <span className="text-xs text-muted-foreground font-mono">{impact.totalKg} kg Total</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {impact.categoryBreakdown.map((cat) => {
                  const pct = Math.min(100, Math.round((cat.kg / (impact.totalKg || 1)) * 100));
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground">{cat.name}</span>
                        <span className="text-muted-foreground font-mono">
                          {cat.kg} kg ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Digital Pass Modal if viewed from dashboard */}
        {selectedPass && (
          <Dialog open={!!selectedPass} onOpenChange={() => setSelectedPass(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Upcoming Drop-off Pass</DialogTitle>
                <DialogDescription>
                  Reference: {selectedPass.referenceCode} • Present at station
                </DialogDescription>
              </DialogHeader>
              <DigitalPass
                appointment={selectedPass}
                onClose={() => setSelectedPass(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Dashboard;