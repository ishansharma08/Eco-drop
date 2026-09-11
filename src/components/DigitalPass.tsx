import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropoffAppointment } from '@/contexts/EcoContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  Copy,
  Check,
  Leaf,
  Sparkles,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

interface DigitalPassProps {
  appointment: DropoffAppointment;
  onCancel?: (id: string) => void;
  onClose?: () => void;
}

export const DigitalPass: React.FC<DigitalPassProps> = ({
  appointment,
  onCancel,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyRefCode = () => {
    navigator.clipboard.writeText(appointment.referenceCode);
    setCopied(true);
    toast.success('Pass Reference Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCalendarEvent = () => {
    const startStr = `${appointment.scheduledDate.replace(/-/g, '')}T${appointment.scheduledTime.replace(':', '')}00`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EcoDrop Smart Waste//EN',
      'BEGIN:VEVENT',
      `SUMMARY:EcoDrop Waste Recycling (${appointment.referenceCode})`,
      `DESCRIPTION:Waste drop-off at ${appointment.stationName}. Please arrive with sorted materials. Reference: ${appointment.referenceCode}`,
      `LOCATION:${appointment.stationAddress}`,
      `DTSTART:${startStr}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `ecodrop-${appointment.referenceCode}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar event downloaded (.ics)');
  };

  const handlePrint = () => {
    window.print();
  };

  const appointmentDate = new Date(`${appointment.scheduledDate}T${appointment.scheduledTime}:00`);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'CHECKED_IN':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Checked In & Verified
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-primary/15 text-primary border border-primary/30 flex items-center gap-1 font-semibold animate-pulse">
            <Sparkles className="h-3.5 w-3.5" /> Confirmed • Ready for Drop-off
          </Badge>
        );
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Pass Card */}
      <div className="relative bg-card rounded-2xl border-2 border-primary/20 shadow-2xl overflow-hidden print:border-black">
        {/* Top Eco Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-primary to-teal-700 text-white p-6 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight uppercase">EcoDrop Pass</h3>
                <p className="text-xs text-emerald-100 font-medium">Smart Recycling Verification Ticket</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/20">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-100 font-semibold">Reference No.</span>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-mono font-bold tracking-wider">{appointment.referenceCode}</span>
                <button
                  onClick={copyRefCode}
                  className="p-1 hover:bg-white/20 rounded transition"
                  title="Copy Code"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4 text-white" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-emerald-100 font-semibold">Est. Reward</span>
              <div className="text-xl font-bold text-amber-300">+{appointment.totalEstimatedPoints} pts</div>
            </div>
          </div>
        </div>

        {/* Notched perforated line */}
        <div className="relative flex items-center justify-between px-4 py-1 bg-muted/40 border-y border-dashed border-border">
          <div className="absolute -left-3 w-6 h-6 rounded-full bg-background border-r border-border" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground w-full text-center">
            • • • STATION VERIFICATION BARCODE • • •
          </span>
          <div className="absolute -right-3 w-6 h-6 rounded-full bg-background border-l border-border" />
        </div>

        {/* Pass Details */}
        <div className="p-6 space-y-6">
          {/* QR & Barcode Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-muted/30 border gap-4">
            {/* Scannable SVG QR Code Simulation */}
            <div className="relative bg-white p-3 rounded-xl shadow-sm border border-neutral-200">
              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24 text-neutral-900"
                shapeRendering="crispEdges"
              >
                {/* Corner Position Targets */}
                <rect x="5" y="5" width="28" height="28" fill="currentColor" rx="2" />
                <rect x="9" y="9" width="20" height="20" fill="white" rx="1" />
                <rect x="13" y="13" width="12" height="12" fill="currentColor" />

                <rect x="67" y="5" width="28" height="28" fill="currentColor" rx="2" />
                <rect x="71" y="9" width="20" height="20" fill="white" rx="1" />
                <rect x="75" y="13" width="12" height="12" fill="currentColor" />

                <rect x="5" y="67" width="28" height="28" fill="currentColor" rx="2" />
                <rect x="9" y="71" width="20" height="20" fill="white" rx="1" />
                <rect x="13" y="75" width="12" height="12" fill="currentColor" />

                {/* Simulated Data Matrix Dots */}
                <rect x="40" y="8" width="6" height="6" fill="currentColor" />
                <rect x="52" y="8" width="8" height="6" fill="currentColor" />
                <rect x="38" y="20" width="6" height="8" fill="currentColor" />
                <rect x="48" y="22" width="12" height="6" fill="currentColor" />
                <rect x="8" y="40" width="8" height="6" fill="currentColor" />
                <rect x="22" y="42" width="6" height="8" fill="currentColor" />
                <rect x="38" y="38" width="24" height="24" fill="currentColor" rx="2" />
                <rect x="44" y="44" width="12" height="12" fill="white" />
                <rect x="47" y="47" width="6" height="6" fill="currentColor" />
                <rect x="68" y="40" width="8" height="6" fill="currentColor" />
                <rect x="82" y="42" width="8" height="8" fill="currentColor" />
                <rect x="40" y="68" width="6" height="8" fill="currentColor" />
                <rect x="52" y="74" width="8" height="6" fill="currentColor" />
                <rect x="68" y="68" width="10" height="10" fill="currentColor" />
                <rect x="82" y="72" width="8" height="6" fill="currentColor" />
                <rect x="70" y="84" width="8" height="8" fill="currentColor" />
                <rect x="84" y="84" width="6" height="6" fill="currentColor" />
              </svg>
              <span className="block text-[9px] font-mono text-center text-neutral-500 mt-1 font-bold">SCAN AT STATION</span>
            </div>

            {/* Barcode & Station Pass info */}
            <div className="flex-1 w-full space-y-2 text-center sm:text-left">
              <div className="h-10 w-full barcode-stripes rounded opacity-80" />
              <div className="text-xs font-mono tracking-widest text-muted-foreground text-center">
                {appointment.referenceCode.replace('-', ' ')} • VERIFIED PASS
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                Present this QR code or 8-digit reference code to the station operator or drop box scanner for instant check-in.
              </p>
            </div>
          </div>

          {/* Schedule & Location Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center text-muted-foreground text-xs font-medium">
                <Calendar className="h-3.5 w-3.5 mr-1 text-primary" /> Date
              </div>
              <p className="font-semibold text-foreground">{formattedDate}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-muted-foreground text-xs font-medium">
                <Clock className="h-3.5 w-3.5 mr-1 text-primary" /> Time Window
              </div>
              <p className="font-semibold text-foreground">{appointment.scheduledTime} (30 min slot)</p>
            </div>

            <div className="col-span-2 space-y-1 pt-2 border-t">
              <div className="flex items-center text-muted-foreground text-xs font-medium">
                <MapPin className="h-3.5 w-3.5 mr-1 text-primary" /> Station Destination
              </div>
              <p className="font-semibold text-foreground">{appointment.stationName}</p>
              <p className="text-xs text-muted-foreground">{appointment.stationAddress}</p>
            </div>
          </div>

          {/* Manifest of Declared Materials */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground">
              <span>Materials Manifest</span>
              <span>Declared Quantity</span>
            </div>
            <div className="space-y-2">
              {appointment.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium text-foreground">{item.categoryName}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold">
                      {item.verifiedQty ?? item.declaredQty} {item.unit}
                    </span>
                    <Badge variant="secondary" className="text-xs font-semibold">
                      +{item.pointsEarned ?? item.declaredQty * item.pointsPerUnit} pts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carbon & Environmental Summary */}
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-medium">
              <Leaf className="h-4 w-4 text-emerald-600" />
              <span>Projected Environmental Impact:</span>
            </div>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              ~{appointment.co2SavedKg} kg CO₂ avoided
            </span>
          </div>

          {/* If checked in, show inspector verification badge */}
          {appointment.status === 'CHECKED_IN' && appointment.verifierName && (
            <div className="p-3 bg-muted/60 rounded-xl text-xs space-y-1">
              <div className="flex items-center text-emerald-600 font-semibold">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Verified by {appointment.verifierName}
              </div>
              <p className="text-muted-foreground">
                Checked in on {new Date(appointment.checkedInAt || '').toLocaleString()}. Points credited to your balance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-2 justify-center">
        <Button variant="outline" size="sm" onClick={downloadCalendarEvent}>
          <Calendar className="h-4 w-4 mr-2" /> Add to Calendar (.ics)
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print Pass
        </Button>
        {appointment.status === 'PENDING' && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onCancel(appointment.id)}
          >
            <XCircle className="h-4 w-4 mr-2" /> Cancel Appointment
          </Button>
        )}
      </div>
    </div>
  );
};

export default DigitalPass;
