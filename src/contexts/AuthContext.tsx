import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginAsDemo: (role?: 'citizen' | 'volunteer' | 'admin') => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ecodrop_demo_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, displayName: string) => {
    localStorage.removeItem('ecodrop_demo_user');
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    setCurrentUser(user);
  };

  const login = async (email: string, password: string) => {
    localStorage.removeItem('ecodrop_demo_user');
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    setCurrentUser(user);
  };

  const loginAsDemo = async (role: 'citizen' | 'volunteer' | 'admin' = 'citizen') => {
    const demoUser: any = {
      uid: `demo-${role}-${Date.now()}`,
      email: `${role}@ecodrop.org`,
      displayName: role === 'volunteer' ? 'Officer Rajesh K.' : role === 'admin' ? 'Operations Admin' : 'Ishan Parikh',
      metadata: { creationTime: '2024-01-10T10:00:00Z' }
    };
    localStorage.setItem('ecodrop_demo_user', JSON.stringify(demoUser));
    setCurrentUser(demoUser);
  };

  const loginWithGoogle = async () => {
    localStorage.removeItem('ecodrop_demo_user');
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    const { user } = await signInWithPopup(auth, provider);
    setCurrentUser(user);
  };

  const logout = async () => {
    localStorage.removeItem('ecodrop_demo_user');
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore if signed in as demo
    }
    setCurrentUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        localStorage.removeItem('ecodrop_demo_user');
      }
      setLoading(false);
    });

    // If already has demo user, stop loading immediately
    if (localStorage.getItem('ecodrop_demo_user')) {
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    loginAsDemo,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
