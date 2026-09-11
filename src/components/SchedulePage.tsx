import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { wasteCategories } from '@/lib/mockData';
import { useEcoStore, DropoffAppointment } from '@/contexts/EcoContext';
import { 
  Calendar,
  Clock,
  MapPin,
  Package,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle,
  CheckCircle2,
  Zap,
  Leaf,
  Sparkles,
  AlertCircle,
  Lock,
  Check,
  QrCode,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface SchedulePageProps {
  onBack: () => void;
  onScheduleComplete: (appointment: DropoffAppointment) => void;
  onOpenScanner?: () => void;
}

export const SchedulePage = ({ onBack, onScheduleComplete, onOpenScanner }: SchedulePageProps) => {
  const { stations, bookAppointment, pendingScannerItem, setPendingScannerItem } = useEcoStore();

  const [selectedCategories, setSelectedCategories] = useState<Record<string, number>>({});
  const [selectedStation, setSelectedStation] = useState<string>(stations[0]?.id || 'station-1');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('11:00');
  const [scannerImportedNote, setScannerImportedNote] = useState<string | null>(null);

  // 4-second confirmation animation state (Item 9)
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(0);
  const [confirmedAppointment, setConfirmedAppointment] = useState<DropoffAppointment | null>(null);

  // Auto-set tomorrow's date as default
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  }, []);

  // Ingest pending item from AI scanner if present
  useEffect(() => {
    if (pendingScannerItem) {
      setSelectedCategories(prev => ({
        ...prev,
        [pendingScannerItem.categoryId]: (prev[pendingScannerItem.categoryId] || 0) + pendingScannerItem.qty
      }));
      setScannerImportedNote(
        `Imported from AI Scanner: ${pendingScannerItem.qty} ${pendingScannerItem.unit} of ${pendingScannerItem.categoryName} (${pendingScannerItem.confidence}% match)`
      );
      setPendingScannerItem(null);
    }
  }, [pendingScannerItem, setPendingScannerItem]);

  // Update quantity with 0.25 step (Item 4)
  const updateQuantity = (categoryId: string, change: number) => {
    setSelectedCategories(prev => {
      const current = prev[categoryId] || 0;
      const newQty = Math.max(0, Number((current + change).toFixed(2)));
      if (newQty === 0) {
        const { [categoryId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [categoryId]: newQty };
    });
  };

  const setExactQuantity = (categoryId: string, value: number) => {
    setSelectedCategories(prev => {
      const newQty = Math.max(0, Number(value.toFixed(2)));
      if (newQty === 0) {
        const { [categoryId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [categoryId]: newQty };
    });
  };

  // Compute live calculations
  let estimatedPoints = 0;
  let estimatedWeightKg = 0;

  Object.entries(selectedCategories).forEach(([catId, qty]) => {
    const cat = wasteCategories.find(c => c.id === catId);
    if (cat && qty > 0) {
      estimatedPoints += Math.round(qty * cat.pointsPerUnit);
      estimatedWeightKg += cat.unit === 'kg' ? qty : qty * 0.75;
    }
  });

  const estimatedCo2 = Number((estimatedWeightKg * 1.82).toFixed(2));
  const activeStation = stations.find(s => s.id === selectedStation) || stations[0];
  const hasItems = Object.values(selectedCategories).some(q => q > 0);
  const isValid = selectedStation && selectedDate && selectedTime && hasItems;

  // Animate confirmation screen for 4-5 seconds (Item 9)
  const handleSchedule = () => {
    if (!isValid || isConfirming) return;

    // Pre-book appointment in store
    const newAppointment = bookAppointment({
      categories: selectedCategories,
      stationId: selectedStation,
      date: selectedDate,
      time: selectedTime
    });

    setConfirmedAppointment(newAppointment);
    setIsConfirming(true);
    setConfirmationStep(1);

    // Step 1: 0 - 1.2s: Reserving slot & encrypting QR hash
    setTimeout(() => {
      setConfirmationStep(2); // Validating material weights & carbon credits
    }, 1300);

    // Step 2: 1.3s - 2.7s: Generating official digital pass
    setTimeout(() => {
      setConfirmationStep(3); // Minting official digital pass
    }, 2700);

    // Step 3: 2.7s - 3.8s: Confirmation tick animation
    setTimeout(() => {
      setConfirmationStep(4); // Drop-off Confirmed tick celebration
    }, 3800);

    // Final transition after ~4.6 seconds into the digital pass page
    setTimeout(() => {
      setIsConfirming(false);
      toast.success(`Drop-off booked! Pass Ref: ${newAppointment.referenceCode}`);
      onScheduleComplete(newAppointment);
    }, 4700);
  };

  const timeSlots = [
    { time: '09:00', label: '09:00 AM', status: 'Available' },
    { time: '10:00', label: '10:00 AM', status: 'Available' },
    { time: '11:00', label: '11:00 AM', status: 'Popular' },
    { time: '12:00', label: '12:00 PM', status: 'Available' },
    { time: '14:00', label: '02:00 PM', status: 'Available' },
    { time: '15:00', label: '03:00 PM', status: 'Available' },
    { time: '16:00', label: '04:00 PM', status: 'Popular' },
    { time: '17:00', label: '05:00 PM', status: 'Available' }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Schedule Waste Drop-off</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Select materials, booking slot, and station</p>
            </div>
          </div>

          {onOpenScanner && (
            <Button
              variant="outline"
              size="sm"
              className="border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
              onClick={onOpenScanner}
            >
              <Sparkles className="h-4 w-4 mr-1.5" /> Scan Material with AI
            </Button>
          )}
        </div>

        {/* AI Scanner Notification Banner if imported */}
        {scannerImportedNote && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold">{scannerImportedNote}</span>
            </div>
            <button
              onClick={() => setScannerImportedNote(null)}
              className="font-bold underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Booking Controls */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Select Waste Categories */}
            <Card className="shadow-card-eco border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
                    <span>Select Waste Materials & Estimated Quantities</span>
                  </CardTitle>
                </div>
                <CardDescription>
                  Adjust the slider or use +/- buttons to set declared weights in 0.25 kg increments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {wasteCategories.map((category) => {
                    const qty = selectedCategories[category.id] || 0;
                    const isSelected = qty > 0;
                    const maxLimit = category.unit === 'count' ? 20 : 25;
                    const stepSize = category.unit === 'count' ? 1 : 0.25;

                    return (
                      <div
                        key={category.id}
                        className={`p-4 rounded-2xl border transition-all duration-200 relative ${
                          isSelected
                            ? 'border-emerald-500 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-card shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                            : 'border-border hover:border-emerald-500/40 bg-card hover:bg-muted/20'
                        }`}
                      >
                        {/* Header with Vector Icon & Points */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-10 h-10 rounded-xl bg-muted/60 p-1.5 border flex items-center justify-center shrink-0">
                              <img src={category.icon} alt="" className="h-full w-full object-contain" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-foreground line-clamp-1">{category.name}</h3>
                              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                                +{category.pointsPerUnit} pts/{category.unit}
                              </p>
                            </div>
                          </div>

                          {/* Selected Badge */}
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-sm shrink-0 font-bold">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        {/* Weight / Count Display & Stepper */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-muted/40 rounded-xl p-1.5 border">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-lg hover:bg-background text-foreground"
                              onClick={() => updateQuantity(category.id, -stepSize)}
                              disabled={qty <= 0}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>

                            <div className="text-center px-1">
                              <span className="text-sm font-mono font-black text-foreground">
                                {qty.toFixed(category.unit === 'count' ? 0 : 2)}
                              </span>
                              <span className="text-[11px] text-muted-foreground ml-1 font-medium">
                                {category.unit}
                              </span>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-lg hover:bg-background text-foreground"
                              onClick={() => updateQuantity(category.id, stepSize)}
                              disabled={qty >= maxLimit}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* Smooth 0.25kg Slider */}
                          <div className="px-1 pt-1">
                            <input
                              type="range"
                              min="0"
                              max={maxLimit}
                              step={stepSize}
                              value={qty}
                              onChange={(e) => setExactQuantity(category.id, parseFloat(e.target.value) || 0)}
                              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-400"
                            />
                            <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-0.5">
                              <span>0</span>
                              <span>{(maxLimit / 2).toFixed(category.unit === 'count' ? 0 : 1)}</span>
                              <span>{maxLimit} {category.unit}</span>
                            </div>
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className="flex gap-1 pt-1 justify-center">
                            {category.unit === 'kg' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(category.id, 0.25)}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 font-mono"
                                >
                                  +0.25kg
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(category.id, 0.5)}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 font-mono"
                                >
                                  +0.5kg
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(category.id, 1.0)}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 font-mono"
                                >
                                  +1kg
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(category.id, 1)}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 font-mono"
                                >
                                  +1 pc
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(category.id, 2)}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 font-mono"
                                >
                                  +2 pcs
                                </button>
                              </>
                            )}
                            {qty > 0 && (
                              <button
                                type="button"
                                onClick={() => setExactQuantity(category.id, 0)}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive font-mono"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Choose Recycling Station */}
            <Card className="shadow-card-eco border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
                  <span>Choose Drop-off Station</span>
                </CardTitle>
                <CardDescription>Select your nearest station location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stations.map((st) => {
                  const isSelected = selectedStation === st.id;
                  const isMaintenance = st.status === 'Maintenance';
                  return (
                    <div
                      key={st.id}
                      onClick={() => !isMaintenance && setSelectedStation(st.id)}
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative ${
                        isSelected
                          ? 'border-2 border-emerald-500 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-card ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10 scale-[1.01]'
                          : isMaintenance
                          ? 'border-border/60 bg-muted/30 opacity-60 cursor-not-allowed'
                          : 'border-border bg-card hover:border-emerald-500/40 hover:bg-muted/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'}`}>
                              <MapPin className="h-4 w-4 shrink-0" />
                            </div>
                            <h4 className="font-bold text-sm text-foreground">{st.name}</h4>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                st.status === 'Open'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : st.status === 'Busy'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                  : 'bg-destructive/10 text-destructive border-destructive/30'
                              }`}
                            >
                              {st.status} • {st.capacityPercent}% Capacity
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-8">{st.address}</p>
                        </div>
                        <div className="text-right sm:text-right ml-8 sm:ml-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                          <span className="text-xs font-mono text-muted-foreground">{st.hours}</span>
                          {st.distance && (
                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{st.distance} km away</div>
                          )}
                        </div>
                      </div>

                      {/* Selected check badge */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Step 3: Pick Date & Time Slot */}
            <Card className="shadow-card-eco border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
                  <span>Select Date & Arrival Window</span>
                </CardTitle>
                <CardDescription>Choose when you plan to visit the station</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                      Selected Station Hours
                    </label>
                    <div className="p-2.5 rounded-lg bg-muted/40 border text-xs font-mono text-foreground">
                      {activeStation.hours} (Mon - Sun)
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                    Available Time Slots (30 min window)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {timeSlots.map(({ time, label, status }) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 rounded-xl border text-center transition-all duration-200 relative group cursor-pointer ${
                            isSelected
                              ? 'border-2 border-emerald-500 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white font-bold shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400 ring-offset-2 ring-offset-background scale-[1.03]'
                              : 'border-border bg-card hover:border-emerald-500/50 hover:bg-emerald-500/5 text-foreground hover:scale-[1.01]'
                          }`}
                        >
                          <div className="text-xs font-bold tracking-tight">{label}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100 font-medium' : 'text-muted-foreground'}`}>
                            {status}
                          </div>

                          {/* Selected checkmark indicator */}
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Booking Summary & Instant Impact */}
          <div className="lg:col-span-4 space-y-6 sticky top-20">
            <Card className="shadow-2xl border-2 border-primary/30 bg-gradient-card">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  <span>Drop-off Summary</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary font-mono text-xs">
                    Live Estimate
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Station & Time summary */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Station:</span>
                    <span className="font-semibold text-foreground text-right">{activeStation.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-semibold text-foreground">{selectedDate || 'Not selected'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time Slot:</span>
                    <span className="font-semibold text-foreground">{selectedTime}</span>
                  </div>
                </div>

                {/* Items Manifest */}
                <div className="pt-3 border-t space-y-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">
                    Declared Materials ({Object.keys(selectedCategories).length})
                  </span>
                  {hasItems ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {Object.entries(selectedCategories).map(([catId, qty]) => {
                        const cat = wasteCategories.find(c => c.id === catId);
                        if (!cat || qty <= 0) return null;
                        return (
                          <div key={catId} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-muted/40">
                            <span className="font-medium text-foreground inline-flex items-center gap-2">
                              <img src={cat.icon} alt="" className="h-5 w-5 rounded object-contain" />
                              {cat.name}
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {qty.toFixed(cat.unit === 'count' ? 0 : 2)} {cat.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                      No materials selected yet. Choose at least one category above.
                    </div>
                  )}
                </div>

                {/* Impact Calculations */}
                <div className="pt-3 border-t space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Zap className="h-3.5 w-3.5 mr-1 text-amber-500" /> Reward Points:
                    </span>
                    <span className="text-lg font-black text-primary">+{estimatedPoints} pts</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Package className="h-3.5 w-3.5 mr-1 text-primary" /> Est. Total Weight:
                    </span>
                    <span className="text-sm font-bold text-foreground">~{estimatedWeightKg.toFixed(2)} kg</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Leaf className="h-3.5 w-3.5 mr-1 text-emerald-500" /> CO₂ Avoided:
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ~{estimatedCo2} kg
                    </span>
                  </div>
                </div>

                {/* Submit Booking Button */}
                <Button
                  className="w-full text-base py-5 shadow-lg bg-gradient-primary hover:opacity-95"
                  size="lg"
                  disabled={!isValid || isConfirming}
                  onClick={handleSchedule}
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Validating & Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirm & Get Digital Pass
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center">
                  <span className="inline-flex items-center justify-center gap-1"><Lock className="h-3 w-3" /> Generating digital pass is instantaneous. You can cancel or reschedule anytime from your Eco History.</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 4-Second Animated Confirmation Screen (Item 9) */}
      {isConfirming && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-card border-2 border-emerald-500/40 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden">
            {/* Decorative background glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Main Central Icon Animation */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              {confirmationStep < 4 ? (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-teal-400/30 border-b-teal-500 animate-[spin_2s_linear_infinite_reverse]" />
                  <div className="p-4 bg-emerald-500/10 rounded-full">
                    <Leaf className="w-8 h-8 text-emerald-600 animate-pulse" />
                  </div>
                </>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 animate-in zoom-in-50 duration-500 ring-8 ring-emerald-500/20">
                  <Check className="w-10 h-10 stroke-[3.5] animate-in fade-in duration-300" />
                </div>
              )}
            </div>

            {/* Stage Title & Dynamic Descriptions */}
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tight">
                {confirmationStep === 1 && 'Reserving Time Slot...'}
                {confirmationStep === 2 && 'Validating Materials & Weights...'}
                {confirmationStep === 3 && 'Generating Official Digital Pass...'}
                {confirmationStep >= 4 && 'Drop-off Confirmed!'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {confirmationStep === 1 && `Securing 30-min window at ${activeStation.name}.`}
                {confirmationStep === 2 && `Estimated ~${estimatedWeightKg.toFixed(2)} kg diverted and +${estimatedPoints} pts earned.`}
                {confirmationStep === 3 && 'Issuing scannable verification barcode and reference token.'}
                {confirmationStep >= 4 && 'Drop-off registered! Presenting your digital pass...'}
              </p>
            </div>

            {/* 3-Step Verification Checklist */}
            <div className="p-4 bg-muted/40 rounded-2xl border space-y-2.5 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {confirmationStep > 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  )}
                  <span className={confirmationStep >= 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                    Station Slot Reservation
                  </span>
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {confirmationStep > 1 ? 'Locked' : 'Processing...'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {confirmationStep > 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : confirmationStep === 2 ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-muted-foreground/30 inline-block shrink-0" />
                  )}
                  <span className={confirmationStep >= 2 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                    Material Ledger & CO₂ Credit
                  </span>
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {confirmationStep > 2 ? 'Calculated' : confirmationStep === 2 ? 'Computing...' : 'Pending'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {confirmationStep >= 4 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : confirmationStep === 3 ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-muted-foreground/30 inline-block shrink-0" />
                  )}
                  <span className={confirmationStep >= 3 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                    Cryptographic Pass Issuance
                  </span>
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {confirmationStep >= 4 ? 'Ready' : confirmationStep === 3 ? 'Issuing...' : 'Pending'}
                </Badge>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, confirmationStep * 25 + 10)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;