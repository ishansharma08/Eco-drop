import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useEcoStore } from '@/contexts/EcoContext';
import {
  Scan,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Camera,
  Zap,
  Info,
  ShieldCheck,
  PackageCheck,
  VideoOff,
  SwitchCamera,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  analyzeWasteImage,
  fileToDataUrl,
  getGeminiApiKey,
  saveGeminiApiKey,
  urlToDataUrl,
  WasteScanResult,
} from '@/lib/geminiScan';

interface AISmartScannerProps {
  onScheduleDropoff?: () => void;
  onOpenGeminiSettings?: () => void;
}

interface SampleItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

const SAMPLE_ITEMS: SampleItem[] = [
  {
    id: 'sample-plastic',
    name: 'Plastic bottle',
    category: 'Plastic Bottles',
    imageUrl: '/images/vectors/plastic-bottle.svg',
  },
  {
    id: 'sample-aluminum',
    name: 'Aluminum can',
    category: 'Metal Cans',
    imageUrl: '/images/vectors/aluminum-can.svg',
  },
  {
    id: 'sample-cardboard',
    name: 'Cardboard box',
    category: 'Paper & Cardboard',
    imageUrl: '/images/vectors/cardboard-box.svg',
  },
  {
    id: 'sample-ewaste',
    name: 'Smartphone',
    category: 'Electronics',
    imageUrl: '/images/vectors/smartphone.svg',
  },
  {
    id: 'sample-glass',
    name: 'Glass bottle',
    category: 'Glass Containers',
    imageUrl: '/images/vectors/glass-bottle.svg',
  },
  {
    id: 'sample-books',
    name: 'Books',
    category: 'Books & Magazines',
    imageUrl: '/images/vectors/books.svg',
  },
];

export const AISmartScanner: React.FC<AISmartScannerProps> = ({ onScheduleDropoff, onOpenGeminiSettings }) => {
  const { setPendingScannerItem } = useEcoStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeAnalysis, setActiveAnalysis] = useState<WasteScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  useEffect(() => {
    const existing = getGeminiApiKey();
    setHasApiKey(Boolean(existing));
    if (existing) setApiKeyInput(existing);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Attach stream to video element after React re-renders and video is in the DOM
  useEffect(() => {
    if (cameraOn && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.error('Video play failed:', err);
        setCameraError('Could not start video playback. Try again.');
        setCameraOn(false);
      });
    }
  }, [cameraOn]);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setCapturedImage(null);
    setActiveAnalysis(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      setFacingMode(mode);
      // setCameraOn triggers the useEffect above which attaches the stream
      // after React has rendered the video element into the DOM
      setCameraOn(true);
    } catch {
      setCameraError('Camera access was blocked. Allow camera permission, or upload a photo instead.');
      toast.error('Could not start the camera');
    }
  };

  const captureFromVideo = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      throw new Error('Camera is not ready yet');
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not capture a frame');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const runGeminiScan = async (imageDataUrl: string) => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      toast.error('Add a Gemini API key first to get real scan results.');
      return;
    }

    setIsScanning(true);
    setScanProgress(18);
    setActiveAnalysis(null);
    setCapturedImage(imageDataUrl);

    const tick = window.setInterval(() => {
      setScanProgress((prev) => (prev >= 88 ? prev : prev + 8));
    }, 280);

    try {
      const result: WasteScanResult = await analyzeWasteImage(imageDataUrl, apiKey);
      setActiveAnalysis(result);
      setScanProgress(100);
      toast.success(`Identified: ${result.name} (${result.confidence}% confidence)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      toast.error(message);
    } finally {
      window.clearInterval(tick);
      setIsScanning(false);
    }
  };

  const handleLiveScan = async () => {
    try {
      setSelectedSampleId(null);
      const frame = captureFromVideo();
      await runGeminiScan(frame);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not capture camera frame');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSelectedSampleId(null);
    stopCamera();
    const dataUrl = await fileToDataUrl(file);
    await runGeminiScan(dataUrl);
  };

  const handleSelectSample = async (sample: SampleItem) => {
    stopCamera();
    setSelectedSampleId(sample.id);
    try {
      const dataUrl = await urlToDataUrl(sample.imageUrl);
      await runGeminiScan(dataUrl);
    } catch {
      toast.error('Could not load that sample photo');
    }
  };

  const handleSaveKey = () => {
    saveGeminiApiKey(apiKeyInput);
    const ok = Boolean(getGeminiApiKey());
    setHasApiKey(ok);
    toast.success(ok ? 'Gemini API key saved on this device' : 'API key cleared');
  };

  const handleAddToSchedule = () => {
    if (!activeAnalysis) return;

    if (activeAnalysis.contamination && !activeAnalysis.recyclable) {
      toast.warning('Contaminated materials cannot be scheduled for drop-off.');
      return;
    }

    setPendingScannerItem({
      categoryId: activeAnalysis.categoryId,
      categoryName: activeAnalysis.category,
      qty: activeAnalysis.defaultQty,
      unit: activeAnalysis.unit,
      confidence: activeAnalysis.confidence,
      resinCode: activeAnalysis.resinCode,
    });

    toast.success(`Added ${activeAnalysis.defaultQty} ${activeAnalysis.unit} of ${activeAnalysis.category} to your schedule!`);
    onScheduleDropoff?.();
  };

  const previewSrc = capturedImage;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Multimodal Vision Classifier
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            AI Smart Waste Classifier
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Point your phone camera or click any material below. Our deep vision model identifies material composition, resin codes, contamination risks, and points rewards.
          </p>
        </div>

        {/* AI Status & Settings Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-primary/20 shadow-sm">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block flex items-center gap-1.5">
                {hasApiKey ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Google Gemini Multimodal AI Active
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Neural Simulation Classifier Active
                  </>
                )}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {hasApiKey 
                  ? 'Cloud vision engine enabled with real-time camera recognition' 
                  : 'Instant offline recognition ready • Configure your Gemini key anytime'}
              </span>
            </div>
          </div>

          {onOpenGeminiSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenGeminiSettings}
              className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              {hasApiKey ? 'Manage API Key' : 'Configure Gemini API Key'}
            </Button>
          )}
        </div>

        {/* Practice Samples Grid with Premium Selection Effect */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground px-1">
            <span>Click any material sample, or scan live camera:</span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-3.5 w-3.5 mr-1" /> Upload Photo
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SAMPLE_ITEMS.map((item) => {
              const isSelected = selectedSampleId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectSample(item)}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500 bg-gradient-to-b from-emerald-500/15 via-primary/5 to-transparent ring-2 ring-emerald-500/80 shadow-lg shadow-emerald-500/15 scale-[1.03]'
                      : 'border-border bg-card hover:bg-muted/40 hover:border-primary/50 hover:scale-[1.01]'
                  }`}
                >
                  {/* Selected Indicator Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div className="h-20 w-full p-2 flex items-center justify-center bg-muted/20 group-hover:bg-muted/30 transition">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="h-16 w-16 object-contain filter drop-shadow-sm transition group-hover:scale-105" 
                    />
                  </div>
                  <div className="p-2.5 pt-1.5">
                    <span className="text-xs font-bold line-clamp-1 text-foreground">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{item.category}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <Card className="lg:col-span-7 overflow-hidden shadow-2xl border-2 border-primary/20">
            <CardHeader className="bg-muted/40 pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" /> Live camera
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {isScanning ? 'ANALYZING' : cameraOn ? 'CAMERA LIVE' : previewSrc ? 'FRAME CAPTURED' : 'STANDBY'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative bg-black">
              <div className="relative aspect-[4/3] w-full overflow-hidden flex items-center justify-center">
                {/* Always keep video in the DOM so videoRef is always valid.
                    Visibility is toggled via CSS — never conditionally unmount it. */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraOn ? 'block' : 'hidden'}`}
                  playsInline
                  muted
                  autoPlay
                />

                {!cameraOn && previewSrc && (
                  <img src={previewSrc} alt="Captured waste item" className="w-full h-full object-cover" />
                )}

                {!cameraOn && !previewSrc && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-6 text-center bg-[url('/images/hero-station.jpg')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-black/65" />
                    <div className="relative z-10 space-y-3">
                      <Camera className="h-10 w-10 mx-auto text-emerald-300" />
                      <p className="text-sm max-w-sm">
                        Start the camera and hold a bottle, can, cardboard box, or device in frame.
                      </p>
                      {cameraError && <p className="text-xs text-red-200">{cameraError}</p>}
                    </div>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-emerald-400/50 rounded-2xl pointer-events-none">
                  <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400" />
                </div>

                {isScanning && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] animate-scan-laser pointer-events-none z-10" />
                )}

                {!isScanning && activeAnalysis && previewSrc && (
                  <div className="absolute top-4 left-4 right-4 pointer-events-none">
                    <div className="inline-block bg-emerald-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      {activeAnalysis.name} ({activeAnalysis.confidence}%)
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t">
                <div className="flex-1">
                  {isScanning ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono text-muted-foreground">
                        <span>Gemini is reading the material...</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <Progress value={scanProgress} className="h-2" />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {cameraOn
                        ? 'Hold the item steady, then tap Scan now for a real Gemini result.'
                        : 'Start the camera for live scanning, or upload a photo of the item.'}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {cameraOn ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startCamera(facingMode === 'environment' ? 'user' : 'environment')}
                        disabled={isScanning}
                      >
                        <SwitchCamera className="h-4 w-4 mr-1" /> Flip
                      </Button>
                      <Button variant="outline" size="sm" onClick={stopCamera} disabled={isScanning}>
                        <VideoOff className="h-4 w-4 mr-1" /> Stop
                      </Button>
                      <Button size="sm" onClick={handleLiveScan} disabled={isScanning}>
                        <Scan className="h-4 w-4 mr-1" /> Scan now
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => startCamera()} disabled={isScanning}>
                        <Camera className="h-4 w-4 mr-1" /> Start camera
                      </Button>
                      {previewSrc && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runGeminiScan(previewSrc)}
                          disabled={isScanning}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" /> Re-scan
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-5 space-y-4">
            {isScanning && !activeAnalysis ? (
              <Card className="p-8 text-center bg-muted/20 border-dashed border-2">
                <div className="animate-spin text-primary inline-block mb-3">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-foreground">Scanning in progress</h3>
                <p className="text-xs text-muted-foreground mt-1">Sending the live frame to Gemini Vision...</p>
              </Card>
            ) : activeAnalysis ? (
              <Card className="shadow-xl border-primary/20 bg-gradient-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase">
                      Gemini classification
                    </span>
                    <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/30">
                      {activeAnalysis.confidence}% match
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold">{activeAnalysis.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    <Badge className={activeAnalysis.badgeColor}>{activeAnalysis.category}</Badge>
                    <span className="font-mono font-semibold text-xs text-muted-foreground">
                      Material: {activeAnalysis.resinCode}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {activeAnalysis.contamination ? (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="font-bold">Contamination detected</AlertTitle>
                      <AlertDescription className="text-xs mt-1">
                        {activeAnalysis.contaminationMsg}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                          Recyclable material
                        </h4>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300/80 mt-0.5">
                          Accepted at EcoDrop hubs when clean and dry. Points are estimated until station verification.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">Estimated yield</span>
                      <p className="text-xl font-bold text-foreground">
                        {activeAnalysis.defaultQty} {activeAnalysis.unit}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">Points reward</span>
                      <p className="text-xl font-bold text-primary flex items-center gap-1">
                        <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                        +{Math.round(activeAnalysis.defaultQty * activeAnalysis.pointsPerUnit)} pts
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-primary" /> How to prepare for drop-off
                    </h4>
                    <ul className="space-y-2">
                      {activeAnalysis.instructions.map((inst, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{inst}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full text-base py-5 shadow-lg bg-gradient-primary hover:opacity-95"
                    size="lg"
                    disabled={activeAnalysis.contamination && !activeAnalysis.recyclable}
                    onClick={handleAddToSchedule}
                  >
                    <PackageCheck className="h-5 w-5 mr-2" />
                    Add to drop-off schedule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center bg-muted/20 border-dashed border-2">
                <Camera className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-foreground">Waiting for a scan</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Start the camera and tap Scan now. Gemini will return a real classification for whatever is in frame.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISmartScanner;
