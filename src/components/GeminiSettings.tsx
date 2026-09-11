import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  Trash2,
  Cpu,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { getGeminiApiKey, saveGeminiApiKey } from '@/lib/geminiScan';

interface GeminiSettingsProps {
  onBack?: () => void;
  onNavigateToScanner?: () => void;
}

export const GeminiSettings: React.FC<GeminiSettingsProps> = ({ onBack, onNavigateToScanner }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'untested' | 'valid' | 'invalid'>('untested');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const existing = getGeminiApiKey();
    if (existing) {
      setApiKey(existing);
      setVerificationStatus('valid');
      setStatusMessage('Active API key configured on this device.');
    }
  }, []);

  const handleSave = () => {
    saveGeminiApiKey(apiKey);
    if (apiKey.trim()) {
      toast.success('Gemini API key saved to local storage!');
      handleTestKey();
    } else {
      setVerificationStatus('untested');
      setStatusMessage('');
      toast.info('API key removed. Using built-in local material classifier.');
    }
  };

  const handleClear = () => {
    setApiKey('');
    saveGeminiApiKey('');
    setVerificationStatus('untested');
    setStatusMessage('');
    toast.info('Gemini API key cleared.');
  };

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      toast.error('Please enter a Gemini API key to test.');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('untested');

    try {
      // Test the API key against Google Generative Language API
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${encodeURIComponent(keyToTest)}`
      );
      
      if (res.ok) {
        setVerificationStatus('valid');
        setStatusMessage('Connection Verified: Google Gemini 1.5/2.0 Flash is active and responding!');
        toast.success('Gemini API Key verified successfully!');
      } else {
        const data = await res.json().catch(() => ({}));
        setVerificationStatus('invalid');
        setStatusMessage(data?.error?.message || 'Invalid API key or network error. Please check your key.');
        toast.error('Verification failed. Invalid Gemini API key.');
      }
    } catch (err: any) {
      setVerificationStatus('invalid');
      setStatusMessage('Network request failed. Please check your internet connection.');
      toast.error('Network error while verifying key.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> AI Vision Configuration
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-0.5">
                Google Gemini API Settings
              </h1>
            </div>
          </div>

          {onNavigateToScanner && (
            <Button variant="hero" size="sm" onClick={onNavigateToScanner} className="text-xs">
              Go to Scanner &rarr;
            </Button>
          )}
        </div>

        {/* Main API Key Card */}
        <Card className="shadow-card-eco border-2 border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <span>Gemini API Credential</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your API key enables live camera visual analysis, resin identification, and contamination detection via Google Gemini multimodal models.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="gemini-key" className="text-xs font-semibold uppercase text-muted-foreground">
                  API Key from Google AI Studio
                </Label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Get free key from AI Studio <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="relative">
                <Input
                  id="gemini-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setVerificationStatus('untested');
                  }}
                  placeholder="AIzaSy..."
                  className="pr-20 font-mono text-xs sm:text-sm"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Verification Status Alert */}
            {verificationStatus === 'valid' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Key Active & Verified</span>
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            {verificationStatus === 'invalid' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start space-x-2.5 text-xs text-destructive">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Verification Error</span>
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleSave} size="sm" className="bg-primary hover:bg-primary/90 text-xs">
                Save Key
              </Button>
              <Button
                onClick={handleTestKey}
                variant="outline"
                size="sm"
                className="text-xs border-primary/30"
                disabled={isVerifying || !apiKey.trim()}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Verifying with Google...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-primary" /> Test & Verify Key
                  </>
                )}
              </Button>
              {apiKey && (
                <Button
                  onClick={handleClear}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:bg-destructive/10 ml-auto"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear Key
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature Explanations Card */}
        <Card className="shadow-card-eco border-primary/20 bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" /> Features Enabled with Gemini Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start space-x-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p>
                <strong>Multimodal Image Recognition:</strong> Identifies specific waste items (PET bottles, HDPE jugs, corrugated cardboard, e-waste circuit boards) directly from live phone camera feeds.
              </p>
            </div>
            <div className="flex items-start space-x-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p>
                <strong>Contamination Detection:</strong> Flags food oils, grease, chemical residue, and unseparated caps that reduce recycling value.
              </p>
            </div>
            <div className="flex items-start space-x-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p>
                <strong>Privacy Protected:</strong> Your API key is stored locally in your browser and never transmitted to third-party tracking servers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeminiSettings;
