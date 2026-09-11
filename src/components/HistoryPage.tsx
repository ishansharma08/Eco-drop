import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEcoStore, DropoffAppointment } from '@/contexts/EcoContext';
import { DigitalPass } from '@/components/DigitalPass';
import { 
  Calendar,
  MapPin,
  Package,
  TrendingUp,
  Award,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  QrCode,
  FileCheck,
  Printer,
  Sparkles,
  Leaf,
  ShieldCheck,
  Zap,
  TreePine,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface HistoryPageProps {
  onBack?: () => void;
}

export const HistoryPage = ({ onBack }: HistoryPageProps = {}) => {
  const { appointments, cancelAppointment, userProfile, getAggregateImpact } = useEcoStore();
  const [selectedPass, setSelectedPass] = useState<DropoffAppointment | null>(null);
  const [certificateAppointment, setCertificateAppointment] = useState<DropoffAppointment | null>(null);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);

  const impact = getAggregateImpact();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            Checked In & Verified
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
            Upcoming Drop-off
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleConfirmCancel = () => {
    if (cancelModalId) {
      cancelAppointment(cancelModalId);
      toast.success('Appointment cancelled successfully.');
      setCancelModalId(null);
    }
  };

  const renderAppointmentCard = (app: DropoffAppointment) => {
    const isPending = app.status === 'PENDING';
    const isCompleted = app.status === 'CHECKED_IN';
    const dateFormatted = new Date(`${app.scheduledDate}T${app.scheduledTime}:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <Card key={app.id} className="shadow-card-eco border transition-all hover:border-primary/40 bg-card">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Station & Timing Info */}
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-sm text-primary tracking-wide">
                  {app.referenceCode}
                </span>
                {getStatusBadge(app.status)}
              </div>

              <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>{app.stationName}</span>
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> {dateFormatted}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {app.scheduledTime}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <Leaf className="h-3.5 w-3.5" /> ~{app.co2SavedKg} kg CO₂ saved
                </span>
              </div>

              {/* Items pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {app.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs bg-muted/60 px-2 py-0.5 rounded-md text-foreground font-medium"
                  >
                    {item.categoryName}:{' '}
                    <strong className="ml-1 text-primary">
                      {item.verifiedQty ?? item.declaredQty} {item.unit}
                    </strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Points & Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                  {isCompleted ? 'Points Awarded' : 'Est. Reward'}
                </span>
                <span className="text-xl font-extrabold text-primary flex items-center justify-end gap-1">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                  +{app.totalActualPoints ?? app.totalEstimatedPoints} pts
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPass(app)}
                  className="text-xs h-8"
                >
                  <QrCode className="h-3.5 w-3.5 mr-1 text-primary" /> Digital Pass
                </Button>

                {isCompleted && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCertificateAppointment(app)}
                    className="text-xs h-8 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                  >
                    <FileCheck className="h-3.5 w-3.5 mr-1" /> Certificate
                  </Button>
                )}

                {isPending && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelModalId(app.id)}
                    className="text-xs h-8 text-destructive hover:bg-destructive/10"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const pendingAppointments = appointments.filter(a => a.status === 'PENDING');
  const completedAppointments = appointments.filter(a => a.status === 'CHECKED_IN');
  const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Button */}
        {onBack && (
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Eco Drop-off History</h1>
          <p className="text-sm text-muted-foreground">
            Track your recycling appointments, verify point rewards, and download official certificates of impact.
          </p>
        </div>

        {/* Live Environmental Impact Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-card-eco border-primary/20 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Total Points Earned</p>
                  <p className="text-2xl font-black text-primary">{userProfile.totalPointsEarned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-eco border-primary/20 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Waste Diverted</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {impact.totalKg} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-eco border-primary/20 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">CO₂ Abated</p>
                  <p className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {impact.co2Kg} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-eco border-primary/20 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Trees Equivalent</p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    <span className="inline-flex items-center gap-1">{impact.treesSaved} <TreePine className="h-5 w-5" /></span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Filtering History */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid grid-cols-4 max-w-md">
            <TabsTrigger value="all">
              All ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Upcoming ({pendingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Verified ({completedAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {appointments.length > 0 ? (
              appointments.map(renderAppointmentCard)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No drop-off history found. Schedule your first drop-off today!
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3">
            {pendingAppointments.length > 0 ? (
              pendingAppointments.map(renderAppointmentCard)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No upcoming drop-offs scheduled. Use the Schedule tab to book one!
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedAppointments.length > 0 ? (
              completedAppointments.map(renderAppointmentCard)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No verified drop-offs completed yet. Take your pass to a station to check in!
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-3">
            {cancelledAppointments.length > 0 ? (
              cancelledAppointments.map(renderAppointmentCard)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No cancelled appointments.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Digital Pass Modal */}
        {selectedPass && (
          <Dialog open={!!selectedPass} onOpenChange={() => setSelectedPass(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Official Drop-off Pass</DialogTitle>
                <DialogDescription>
                  Present this digital ticket at {selectedPass.stationName}
                </DialogDescription>
              </DialogHeader>
              <DigitalPass
                appointment={selectedPass}
                onCancel={(id) => {
                  setSelectedPass(null);
                  setCancelModalId(id);
                }}
                onClose={() => setSelectedPass(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Official Recycling Certificate Modal */}
        {certificateAppointment && (
          <Dialog open={!!certificateAppointment} onOpenChange={() => setCertificateAppointment(null)}>
            <DialogContent className="max-w-2xl p-6 sm:p-8">
              <div className="border-4 border-double border-emerald-600/40 rounded-2xl p-6 sm:p-8 text-center space-y-5 bg-gradient-to-b from-card to-emerald-50/20 dark:to-emerald-950/20 relative overflow-hidden">
                <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  <ShieldCheck className="h-10 w-10" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase font-mono tracking-widest text-emerald-700 dark:text-emerald-400 font-bold">
                    Official Environmental Credential
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                    Certificate of Eco-Stewardship
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  This certifies that <strong>{userProfile.name}</strong> has responsibly diverted municipal waste from local landfills through the verified EcoDrop Circular Infrastructure.
                </p>

                <div className="grid grid-cols-3 gap-3 p-4 bg-muted/40 rounded-xl border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Total Diverted</span>
                    <strong className="text-base text-foreground font-bold">
                      {certificateAppointment.actualWeightKg ?? certificateAppointment.estimatedWeightKg} kg
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">CO₂ Prevented</span>
                    <strong className="text-base text-emerald-600 font-bold">
                      {certificateAppointment.co2SavedKg} kg
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Points Credited</span>
                    <strong className="text-base text-primary font-bold">
                      +{certificateAppointment.totalActualPoints} pts
                    </strong>
                  </div>
                </div>

                <div className="flex justify-between items-end text-xs text-muted-foreground pt-4 border-t">
                  <div className="text-left font-mono text-[10px]">
                    <span>REF: {certificateAppointment.referenceCode}</span>
                    <br />
                    <span>STATION: {certificateAppointment.stationName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-serif italic font-bold text-sm block">EcoDrop Certification Authority</span>
                    <span className="text-[10px] font-mono">Issued {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <Button variant="default" size="sm" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-1.5" /> Print Certificate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCertificateAppointment(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Cancel Confirmation Dialog */}
        {cancelModalId && (
          <Dialog open={!!cancelModalId} onOpenChange={() => setCancelModalId(null)}>
            <DialogContent className="max-w-md p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                  <XCircle className="h-5 w-5" /> Cancel Drop-off Appointment?
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this scheduled drop-off? You can re-book anytime.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCancelModalId(null)}>
                  Keep Appointment
                </Button>
                <Button variant="destructive" onClick={handleConfirmCancel}>
                  Yes, Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;