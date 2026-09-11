import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, Users, Shield, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginAsDemo, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: 'citizen' | 'volunteer' | 'admin') => {
    try {
      setLoading(true);
      await loginAsDemo(role);
      onSuccess?.();
      if (role === 'volunteer') navigate('/volunteer');
      else if (role === 'admin') navigate('/admin');
      else navigate('/user');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-2 border-primary/20">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-2xl font-bold text-foreground">Welcome to EcoDrop</CardTitle>
        <CardDescription>
          Sign in or explore with an instant 1-click demo profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">


        {/* Sign in with Google Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-10 px-4 flex items-center justify-center gap-2.5 font-medium border-border hover:bg-muted/50 shadow-sm text-xs sm:text-sm whitespace-nowrap overflow-hidden"
          disabled={loading}
          onClick={async () => {
            try {
              setError('');
              setLoading(true);
              await loginWithGoogle();
              navigate('/user');
              onSuccess?.();
            } catch (err: any) {
              const code = err?.code || '';
              if (code === 'auth/operation-not-allowed') {
                setError('Google sign-in is not enabled yet. Please enable it in Firebase Console → Authentication → Sign-in method → Google.');
              } else if (code === 'auth/popup-closed-by-user') {
                setError('Sign-in popup was closed. Please try again.');
              } else {
                setError(err.message || 'Google sign-in failed. Make sure pop-ups are allowed.');
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span className="whitespace-nowrap font-medium">Sign in with Google</span>
        </Button>

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t w-full border-border" />
          <span className="bg-card px-2 text-[11px] text-muted-foreground uppercase font-mono whitespace-nowrap">
            Or sign in with email
          </span>
          <div className="border-t w-full border-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-9 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 h-9 text-sm"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full text-sm h-9 bg-gradient-primary" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In with Firebase
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Button
              variant="link"
              onClick={onSwitchToSignup}
              className="p-0 h-auto font-bold text-primary hover:text-primary/80 text-xs"
            >
              Sign up
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
