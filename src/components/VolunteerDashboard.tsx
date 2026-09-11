import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEcoStore, DropoffAppointment } from '@/contexts/EcoContext';
import { 
  Scan,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  Search,
  Scale,
  Sparkles,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Leaf
} from 'lucide-react';
import { toast } from 'sonner';

export const VolunteerDashboard = () => {
  const { appointments, stations, volunteerCheckIn } = useEcoStore();
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || 'station-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAppointment, setActiveAppointment] = useState<DropoffAppointment | null>(null);
  const [scaleWeights, setScaleWeights] = useState<Record<string, number>>({});
  const [verifierName, setVerifierName] = useState('Volunteer Desk #1');

  // Filter pending appointments for the selected station
  const stationAppointments = appointments.filter(
    a => a.stationId === selectedStationId && a.status === 'PENDING'
  );

  const completedToday = appointments.filter(
    a => a.stationId === selectedStationId && a.status === 'CHECKED_IN'
  );

  const totalKgToday = completedToday.reduce(
    (sum, a) => sum + (a.actualWeightKg || a.estimatedWeightKg),
    0
  );

  const totalPointsAwardedToday = completedToday.reduce(
    (sum, a) => sum + (a.totalActualPoints || a.totalEstimatedPoints),
    0
  );

  const handleSelectAppointment = (app: DropoffAppointment) => {
    setActiveAppointment(app);
    // Pre-populate scale weights with declared quantities
    const initial: Record<string, number> = {};
    app.items.forEach(item => {
      initial[item.categoryId] = item.declaredQty;
    });
    setScaleWeights(initial);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toUpperCase();
    const found = appointments.find(
      a => a.referenceCode.toUpperCase() === query || a.id === query
    );

    if (found) {
      handleSelectAppointment(found);
      setSearchQuery('');
    } else {
      toast.error(`No drop-off found with reference code "${query}".`);
    }
  };

  const handleUpdateScaleWeight = (categoryId: string, value: number) => {
    setScaleWeights(prev => ({
      ...prev,
      [categoryId]: Math.max(0, Number(value.toFixed(1)))
    }));
  };

  const handleConfirmVerification = () => {
    if (!activeAppointment) return;

    const res = volunteerCheckIn(activeAppointment.referenceCode, scaleWeights, verifierName);
    if (res.success) {
      toast.success(res.message || 'Drop-off verified and points awarded!');
      setActiveAppointment(null);
    } else {
      toast.error(res.message || 'Verification failed');
    }
  };

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Station Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Badge className="bg-primary/10 text-primary border-none mb-1">
              Station Verification Officer Console
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Volunteer Check-in Portal
            </h1>
            <p className="text-sm text-muted-foreground">
              Inspect citizen materials, verify digital scales, and award instant eco-points.
            </p>
          </div>

          {/* Station Selector Dropdown */}
          <div className="flex items-center space-x-2 bg-card p-2 rounded-xl border">
            <MapPin className="h-4 w-4 text-primary" />
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            >
              {stations.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Real-time Station Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-card-eco border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Pending Drop-offs</p>
                  <p className="text-3xl font-black text-primary">{stationAppointments.length}</p>
                </div>
                <Clock className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-eco border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Verified Today</p>
                  <p className="text-3xl font-black text-emerald-600">{completedToday.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-600/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-eco border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Waste Collected</p>
                  <p className="text-3xl font-black text-foreground">{totalKgToday.toFixed(1)} kg</p>
                </div>
                <Package className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-eco border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Points Awarded</p>
                  <p className="text-3xl font-black text-amber-500">+{totalPointsAwardedToday}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check-in Actions & Live Queue Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Quick Search by Reference Code */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="shadow-card-eco border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  <span>Look Up Pass Reference</span>
                </CardTitle>
                <CardDescription>
                  Enter the citizen's 8-character reference code (e.g. ECO-2026-8941)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="ECO-2026-XXXX"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="font-mono uppercase font-bold"
                    />
                    <Button type="submit">
                      <Search className="h-4 w-4 mr-1.5" /> Search
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    You can also click on any incoming appointment in the live queue on the right to start scale verification.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Station Status Card */}
            <Card className="shadow-card-eco border-primary/20 bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Operating Station Info</span>
                  <Badge variant="outline">{selectedStation.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-muted-foreground">
                <p><strong>Name:</strong> {selectedStation.name}</p>
                <p><strong>Address:</strong> {selectedStation.address}</p>
                <p><strong>Hours:</strong> {selectedStation.hours}</p>
                <p><strong>Station Capacity:</strong> {selectedStation.capacityPercent}% full</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Queue of Pending Appointments */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Station Queue ({stationAppointments.length} pending)</span>
              </h3>
              <Badge variant="outline" className="text-xs">
                Updated in Real-time
              </Badge>
            </div>

            {stationAppointments.length > 0 ? (
              <div className="space-y-3">
                {stationAppointments.map((app) => (
                  <Card
                    key={app.id}
                    className="shadow-sm border hover:border-primary/50 transition-all bg-card cursor-pointer"
                    onClick={() => handleSelectAppointment(app)}
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-primary">
                            {app.referenceCode}
                          </span>
                          <Badge className="bg-amber-500/10 text-amber-600 border-none text-[10px]">
                            {app.scheduledTime}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {app.scheduledDate}</span>
                          <span>•</span>
                          <span>
                            {app.items.map(i => `${i.declaredQty} ${i.unit} ${i.categoryName}`).join(', ')}
                          </span>
                        </div>
                      </div>

                      <Button size="sm" variant="default" className="text-xs shrink-0">
                        <Scale className="h-3.5 w-3.5 mr-1" /> Inspect & Verify
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                <h4 className="font-bold text-sm text-foreground">Queue is Clear!</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  No pending citizen drop-offs at this station currently. Select another station or enter a code above to check in.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Modal: Digital Scale Verification Dialog */}
        {activeAppointment && (
          <Dialog open={!!activeAppointment} onOpenChange={() => setActiveAppointment(null)}>
            <DialogContent className="max-w-lg p-6 space-y-5">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" /> Digital Scale Verification
                  </span>
                  <Badge className="font-mono">{activeAppointment.referenceCode}</Badge>
                </DialogTitle>
                <DialogDescription>
                  Verify materials manifest and adjust measured scale weights before finalizing.
                </DialogDescription>
              </DialogHeader>

              {/* Manifest with Digital Scale Inputs */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold uppercase text-muted-foreground px-1">
                  <span>Material Category</span>
                  <span>Scale Weight (Adjustable)</span>
                </div>

                {activeAppointment.items.map((item) => {
                  const currentScale = scaleWeights[item.categoryId] ?? item.declaredQty;
                  const ptsYield = Math.round(currentScale * item.pointsPerUnit);

                  return (
                    <div
                      key={item.categoryId}
                      className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{item.categoryName}</h4>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Declared: {item.declaredQty} {item.unit} • Rate: {item.pointsPerUnit} pts/{item.unit}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <Input
                          type="number"
                          step={item.unit === 'kg' ? '0.1' : '1'}
                          min="0"
                          value={currentScale}
                          onChange={(e) =>
                            handleUpdateScaleWeight(item.categoryId, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 font-mono text-right font-bold h-9 text-sm"
                        />
                        <span className="text-xs font-semibold text-muted-foreground w-8">
                          {item.unit}
                        </span>
                        <Badge variant="secondary" className="font-mono text-xs text-primary font-bold">
                          +{ptsYield} pts
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Calculation */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Total Points to Award</span>
                  <strong className="text-lg font-black text-primary">
                    +
                    {activeAppointment.items.reduce((sum, item) => {
                      const w = scaleWeights[item.categoryId] ?? item.declaredQty;
                      return sum + Math.round(w * item.pointsPerUnit);
                    }, 0)}{' '}
                    pts
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Station Officer</span>
                  <Input
                    value={verifierName}
                    onChange={(e) => setVerifierName(e.target.value)}
                    className="h-7 text-xs w-36 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setActiveAppointment(null)}>
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleConfirmVerification}>
                  <CheckCircle className="h-4 w-4 mr-1.5" /> Confirm & Credit Points
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;