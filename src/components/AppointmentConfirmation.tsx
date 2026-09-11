import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DigitalPass } from '@/components/DigitalPass';
import { DropoffAppointment } from '@/contexts/EcoContext';
import { ArrowLeft, Home, History, CalendarPlus, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface AppointmentConfirmationProps {
  scheduleData: DropoffAppointment;
  onBack: () => void;
  onDashboard: () => void;
  onViewHistory?: () => void;
}

export const AppointmentConfirmation: React.FC<AppointmentConfirmationProps> = ({
  scheduleData,
  onBack,
  onDashboard,
  onViewHistory
}) => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onDashboard} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>

          <div className="flex gap-2">
            {onViewHistory && (
              <Button variant="outline" size="sm" onClick={onViewHistory}>
                <History className="h-4 w-4 mr-1.5" /> View Eco History
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onBack}>
              <CalendarPlus className="h-4 w-4 mr-1.5" /> Book Another
            </Button>
          </div>
        </div>

        {/* High-Visibility Celebration Banner (Item 10) */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-card p-8 sm:p-10 text-center shadow-xl">
          {/* Subtle background ambient light */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-4">
            {/* Luminous Animated Checkmark */}
            <div className="inline-flex items-center justify-center w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/35 ring-8 ring-emerald-500/15 animate-in zoom-in-75 duration-500">
              <Check className="h-10 w-10 sm:h-11 sm:w-11 stroke-[3.5]" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Slot Verified & Registered
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
                Drop-off Confirmed
              </h1>
              <p className="text-sm sm:text-base font-medium text-foreground/80 max-w-lg mx-auto">
                Your appointment has been registered in the system. Your official digital pass is ready below.
              </p>
            </div>
          </div>
        </div>

        {/* Digital Boarding Pass */}
        <DigitalPass
          appointment={scheduleData}
          onClose={onDashboard}
        />

        {/* Bottom Return CTA */}
        <div className="text-center pt-2 pb-8">
          <Button variant="hero" size="lg" onClick={onDashboard} className="px-8 py-3 shadow-lg">
            <Home className="h-5 w-5 mr-2" /> Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmation;