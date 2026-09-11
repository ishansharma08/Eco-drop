import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useEcoStore } from '@/contexts/EcoContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users,
  MapPin,
  Package,
  TrendingUp,
  Settings,
  Shield,
  BarChart3,
  Building,
  Gift,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Leaf
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { stations, appointments, userProfile, toggleStationStatus, getAggregateImpact } = useEcoStore();
  const [activeTab, setActiveTab] = useState('overview');

  const impact = getAggregateImpact();

  const totalPointsGiven = appointments
    .filter(a => a.status === 'CHECKED_IN')
    .reduce((sum, a) => sum + (a.totalActualPoints || a.totalEstimatedPoints), 0) + 1250;

  const totalWasteTons = ((impact.totalKg + 3420) / 1000).toFixed(2);

  const systemStats = [
    { 
      label: 'Registered Citizens', 
      value: '3,842', 
      change: '+14% this month', 
      icon: Users,
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
    },
    { 
      label: 'Active Bin Stations', 
      value: stations.filter(s => s.status !== 'Maintenance').length.toString(), 
      change: `${stations.length} Total hubs`, 
      icon: MapPin,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
    },
    { 
      label: 'Municipal Waste Diverted', 
      value: `${totalWasteTons} Tons`, 
      change: '+8.4% diverted', 
      icon: Package,
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
    },
    { 
      label: 'Total Eco-Points Awarded', 
      value: `${(totalPointsGiven / 1000).toFixed(1)}k`, 
      change: '+18% redemption', 
      icon: TrendingUp,
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25'
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Badge className="bg-primary/10 text-primary border-none mb-1">
              Municipal Waste Administration Console
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              EcoDrop Admin & Operations Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring of campus and municipal recycling infrastructure, stations, and transactions.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/volunteer')}>
              Volunteer Desk &rarr;
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate('/user')}>
              Citizen Portal &rarr;
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemStats.map(({ label, value, change, icon: Icon, bg }) => (
            <Card key={label} className="shadow-card-eco border-primary/20 bg-card hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center p-2.5 border shadow-sm shrink-0 ${bg}`}>
                    <Icon className="h-5 w-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">{value}</div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  {change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: Overview, Station Management, Live Registry, Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stations">Stations ({stations.length})</TabsTrigger>
            <TabsTrigger value="registry">Live Registry ({appointments.length})</TabsTrigger>
            <TabsTrigger value="analytics">Impact & Analytics</TabsTrigger>
          </TabsList>

          {/* TAB 1: Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Recent System Drop-offs */}
              <div className="lg:col-span-8 space-y-4">
                <Card className="shadow-card-eco border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" /> Live Drop-off Activity
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">Real-time Stream</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {appointments.slice(0, 5).map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-primary">{app.referenceCode}</span>
                            <span className="text-xs font-semibold text-foreground">• {app.stationName}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                app.status === 'CHECKED_IN'
                                  ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                  : app.status === 'PENDING'
                                  ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                                  : 'bg-destructive/15 text-destructive border-destructive/30'
                              }`}
                            >
                              {app.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {app.items.map(i => `${i.declaredQty} ${i.unit} ${i.categoryName}`).join(', ')}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-foreground">
                            +{app.totalActualPoints ?? app.totalEstimatedPoints} pts
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Station Quick Health */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="shadow-card-eco border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" /> Hub Operational Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stations.map((s) => (
                      <div key={s.id} className="p-3 rounded-lg border bg-card space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-xs text-foreground">{s.name}</span>
                          <Badge
                            className={`text-[9px] ${
                              s.status === 'Open'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                : s.status === 'Busy'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                : 'bg-destructive/10 text-destructive border-destructive/30'
                            }`}
                          >
                            {s.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Capacity: {s.capacityPercent}%</span>
                          <span>{s.hours}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.capacityPercent > 80 ? 'bg-destructive' : 'bg-primary'
                            }`}
                            style={{ width: `${s.capacityPercent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Station Management */}
          <TabsContent value="stations" className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {stations.map((station) => (
                <Card key={station.id} className="shadow-card-eco border">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold">{station.name}</CardTitle>
                        <CardDescription className="text-xs">{station.address}</CardDescription>
                      </div>
                      <Badge
                        className={`${
                          station.status === 'Open'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : station.status === 'Busy'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {station.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Operating Hours</span>
                        <span className="font-semibold">{station.hours}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Current Fill Level</span>
                        <span className="font-semibold">{station.capacityPercent}% Full</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={station.status === 'Open' ? 'default' : 'outline'}
                        className="text-xs h-7"
                        onClick={() => {
                          toggleStationStatus(station.id, 'Open');
                          toast.success(`${station.name} status updated to Open`);
                        }}
                      >
                        Set Open
                      </Button>
                      <Button
                        size="sm"
                        variant={station.status === 'Busy' ? 'default' : 'outline'}
                        className="text-xs h-7"
                        onClick={() => {
                          toggleStationStatus(station.id, 'Busy');
                          toast.success(`${station.name} status updated to Busy`);
                        }}
                      >
                        Set Busy
                      </Button>
                      <Button
                        size="sm"
                        variant={station.status === 'Maintenance' ? 'destructive' : 'outline'}
                        className="text-xs h-7"
                        onClick={() => {
                          toggleStationStatus(station.id, 'Maintenance');
                          toast.success(`${station.name} set to Maintenance mode`);
                        }}
                      >
                        Set Maintenance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: Live Appointments Registry */}
          <TabsContent value="registry" className="space-y-4">
            <Card className="shadow-card-eco border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Comprehensive Drop-offs Registry</CardTitle>
                <CardDescription>Full audit log of scheduled and verified appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase font-mono bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="p-3">Reference</th>
                        <th className="p-3">Station</th>
                        <th className="p-3">Scheduled Slot</th>
                        <th className="p-3">Materials</th>
                        <th className="p-3">Weight</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {appointments.map((app) => (
                        <tr key={app.id} className="hover:bg-muted/30">
                          <td className="p-3 font-mono font-bold text-primary">{app.referenceCode}</td>
                          <td className="p-3 font-medium">{app.stationName}</td>
                          <td className="p-3 text-muted-foreground">
                            {app.scheduledDate} {app.scheduledTime}
                          </td>
                          <td className="p-3">
                            {app.items.map(i => `${i.declaredQty} ${i.unit} ${i.categoryName}`).join(', ')}
                          </td>
                          <td className="p-3 font-mono">
                            {app.actualWeightKg ?? app.estimatedWeightKg} kg
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                app.status === 'CHECKED_IN'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : app.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-destructive/10 text-destructive'
                              }`}
                            >
                              {app.status}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono font-bold text-primary">
                            +{app.totalActualPoints ?? app.totalEstimatedPoints}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Impact & Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-card-eco border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Materials Recovery Share</CardTitle>
                  <CardDescription>Breakdown across all collection streams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {impact.categoryBreakdown.map((cat) => {
                    const pct = Math.min(100, Math.round((cat.kg / (impact.totalKg || 1)) * 100));
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{cat.name}</span>
                          <span className="text-muted-foreground font-mono">{cat.kg} kg ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="shadow-card-eco border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Environmental Benefit Index</CardTitle>
                  <CardDescription>Quantified community ecological offsets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                        Net Carbon Abated
                      </span>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        {impact.co2Kg} kg CO₂e
                      </p>
                    </div>
                    <Leaf className="h-8 w-8 text-emerald-600/50" />
                  </div>

                  <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300">
                        Trees Planted Equivalent
                      </span>
                      <p className="text-2xl font-black text-teal-700 dark:text-teal-400">
                        {impact.treesSaved} Trees
                      </p>
                    </div>
                    <TreeDeciduous className="h-8 w-8 text-teal-600/50" />
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">
                        Power Grid Conservation
                      </span>
                      <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
                        {impact.energyKwh} kWh
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-amber-600/50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;