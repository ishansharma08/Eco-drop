import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { wasteCategories, binStations as initialBinStations, Reward, rewards as initialRewards } from '@/lib/mockData';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  pointsBalance: number;
  totalDropoffs: number;
  totalPointsEarned: number;
  totalWasteRecycled: number; // in kg
  joinedDate: string;
  locality: string;
  address: string;
  tier: 'Eco Scout' | 'Green Guardian' | 'Eco Champion' | 'Earth Hero';
  notificationsEnabled: boolean;
}

export interface AppointmentItem {
  categoryId: string;
  categoryName: string;
  declaredQty: number;
  verifiedQty?: number;
  unit: string;
  pointsPerUnit: number;
  pointsEarned?: number;
}

export interface DropoffAppointment {
  id: string;
  referenceCode: string; // e.g. "ECO-2026-8941"
  stationId: string;
  stationName: string;
  stationAddress: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  items: AppointmentItem[];
  status: 'PENDING' | 'CHECKED_IN' | 'CANCELLED';
  totalEstimatedPoints: number;
  totalActualPoints?: number;
  estimatedWeightKg: number;
  actualWeightKg?: number;
  co2SavedKg: number;
  createdAt: string;
  checkedInAt?: string;
  verifierName?: string;
}

export interface ClaimedVoucher {
  id: string;
  rewardId: string;
  title: string;
  vendor: string;
  pointsCost: number;
  couponCode: string;
  barcodeValue: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  redeemedAt: string;
  expiresAt: string;
  description: string;
  image: string;
}

export interface EcoStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isActive: boolean;
  status: 'Open' | 'Busy' | 'Maintenance';
  capacityPercent: number;
  hours: string;
  supportedCategories: string[];
  distance?: number;
  managerPhone: string;
}

export interface ScannerItemData {
  categoryId: string;
  categoryName: string;
  qty: number;
  unit: string;
  confidence: number;
  resinCode?: string;
}

interface EcoContextType {
  userProfile: UserProfile;
  appointments: DropoffAppointment[];
  vouchers: ClaimedVoucher[];
  stations: EcoStation[];
  rewardsCatalog: Reward[];
  activeRole: 'citizen' | 'volunteer' | 'admin';
  setActiveRole: (role: 'citizen' | 'volunteer' | 'admin') => void;
  pendingScannerItem: ScannerItemData | null;
  setPendingScannerItem: (item: ScannerItemData | null) => void;
  bookAppointment: (data: {
    categories: Record<string, number>;
    stationId: string;
    date: string;
    time: string;
  }) => DropoffAppointment;
  cancelAppointment: (id: string) => boolean;
  volunteerCheckIn: (
    identifier: string,
    verifiedWeights: Record<string, number>,
    verifierName?: string
  ) => { success: boolean; appointment?: DropoffAppointment; pointsAwarded?: number; message?: string };
  redeemReward: (reward: Reward) => { success: boolean; voucher?: ClaimedVoucher; message?: string };
  useVoucher: (voucherId: string) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  toggleStationStatus: (stationId: string, status: 'Open' | 'Busy' | 'Maintenance') => void;
  getAggregateImpact: () => {
    totalKg: number;
    co2Kg: number;
    treesSaved: number;
    energyKwh: number;
    waterLiters: number;
    categoryBreakdown: Array<{ name: string; kg: number; points: number; color: string }>;
  };
}

interface PersistedEcoState {
  userProfile: UserProfile;
  appointments: DropoffAppointment[];
  vouchers: ClaimedVoucher[];
  stations: EcoStation[];
  rewardsCatalog: Reward[];
}

const STORAGE_KEYS = {
  PROFILE: 'ecodrop_user_profile_v2',
  APPOINTMENTS: 'ecodrop_appointments_v2',
  VOUCHERS: 'ecodrop_vouchers_v2',
  STATIONS: 'ecodrop_stations_v2',
  REWARDS: 'ecodrop_rewards_v2'
};

const ECO_STATE_DOC = doc(db, 'appState', 'main');

const DEFAULT_PROFILE: UserProfile = {
  id: 'user-001',
  name: 'Ishan Parikh',
  email: 'ishan.parikh@example.com',
  phone: '+91 98290 12345',
  pointsBalance: 847,
  totalDropoffs: 3,
  totalPointsEarned: 1350,
  totalWasteRecycled: 45.6,
  joinedDate: '2024-01-10',
  locality: 'Bagru / Manipal University',
  address: 'Manipal University Jaipur, Dehmi Kalan',
  tier: 'Green Guardian',
  notificationsEnabled: true
};

const DEFAULT_APPOINTMENTS: DropoffAppointment[] = [
  {
    id: 'drop-seed-1',
    referenceCode: 'ECO-2026-8941',
    stationId: 'station-1',
    stationName: 'Manipal University Jaipur Campus',
    stationAddress: 'Dehmi Kalan, Near GVK Toll Plaza, Jaipur-Delhi Highway, Jaipur',
    scheduledDate: '2026-09-14',
    scheduledTime: '11:00',
    items: [
      { categoryId: 'plastic', categoryName: 'Plastic Bottles', declaredQty: 3.5, unit: 'kg', pointsPerUnit: 10 },
      { categoryId: 'paper', categoryName: 'Paper & Cardboard', declaredQty: 5.0, unit: 'kg', pointsPerUnit: 8 }
    ],
    status: 'PENDING',
    totalEstimatedPoints: 75,
    estimatedWeightKg: 8.5,
    co2SavedKg: 15.47,
    createdAt: '2026-09-10T10:30:00Z'
  },
  {
    id: 'drop-seed-2',
    referenceCode: 'ECO-2026-4412',
    stationId: 'station-2',
    stationName: 'Jaipur City Recycling Hub',
    stationAddress: 'C-Scheme, Near Central Park, Jaipur, Rajasthan 302001',
    scheduledDate: '2026-09-02',
    scheduledTime: '14:30',
    items: [
      { categoryId: 'plastic', categoryName: 'Plastic Bottles', declaredQty: 4.0, verifiedQty: 4.2, unit: 'kg', pointsPerUnit: 10, pointsEarned: 42 },
      { categoryId: 'glass', categoryName: 'Glass Containers', declaredQty: 2.0, verifiedQty: 2.0, unit: 'kg', pointsPerUnit: 12, pointsEarned: 24 }
    ],
    status: 'CHECKED_IN',
    totalEstimatedPoints: 64,
    totalActualPoints: 66,
    estimatedWeightKg: 6.0,
    actualWeightKg: 6.2,
    co2SavedKg: 11.28,
    createdAt: '2026-08-30T09:15:00Z',
    checkedInAt: '2026-09-02T14:35:00Z',
    verifierName: 'Station Lead Rajesh K.'
  },
  {
    id: 'drop-seed-3',
    referenceCode: 'ECO-2026-1189',
    stationId: 'station-4',
    stationName: 'IT Park E-Waste Center',
    stationAddress: 'Mahindra World City, Near Sitapura, Jaipur',
    scheduledDate: '2026-08-18',
    scheduledTime: '16:00',
    items: [
      { categoryId: 'ewaste', categoryName: 'Electronics', declaredQty: 2, verifiedQty: 2, unit: 'count', pointsPerUnit: 50, pointsEarned: 100 }
    ],
    status: 'CHECKED_IN',
    totalEstimatedPoints: 100,
    totalActualPoints: 100,
    estimatedWeightKg: 2.5,
    actualWeightKg: 2.5,
    co2SavedKg: 4.55,
    createdAt: '2026-08-15T12:00:00Z',
    checkedInAt: '2026-08-18T16:12:00Z',
    verifierName: 'Volunteer Priya M.'
  }
];

const DEFAULT_VOUCHERS: ClaimedVoucher[] = [
  {
    id: 'vouch-seed-1',
    rewardId: 'reward-1',
    title: 'Free Medium Cappuccino',
    vendor: 'Café Coffee Day',
    pointsCost: 150,
    couponCode: 'ECO-CCD-849201',
    barcodeValue: '8901020304051',
    status: 'ACTIVE',
    redeemedAt: '2026-09-05T14:20:00Z',
    expiresAt: '2026-10-05T23:59:59Z',
    description: 'Enjoy 1 free medium beverage of your choice at any CCD store in Jaipur.',
    image: '/images/reward-coffee.jpg'
  }
];

const DEFAULT_STATIONS: EcoStation[] = initialBinStations.map((s, idx) => ({
  ...s,
  status: idx === 2 ? 'Maintenance' : idx === 1 ? 'Busy' : 'Open',
  capacityPercent: [42, 85, 0, 68][idx] || 50,
  managerPhone: '+91 141 278 ' + (9000 + idx * 111)
}));

const EcoContext = createContext<EcoContextType | undefined>(undefined);

export const EcoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [appointments, setAppointments] = useState<DropoffAppointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return saved ? JSON.parse(saved) : DEFAULT_APPOINTMENTS;
    } catch {
      return DEFAULT_APPOINTMENTS;
    }
  });

  const [vouchers, setVouchers] = useState<ClaimedVoucher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
      return saved ? JSON.parse(saved) : DEFAULT_VOUCHERS;
    } catch {
      return DEFAULT_VOUCHERS;
    }
  });

  const [stations, setStations] = useState<EcoStation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATIONS);
      return saved ? JSON.parse(saved) : DEFAULT_STATIONS;
    } catch {
      return DEFAULT_STATIONS;
    }
  });
  const [rewardsCatalog, setRewardsCatalog] = useState<Reward[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REWARDS);
      return saved ? JSON.parse(saved) : initialRewards;
    } catch {
      return initialRewards;
    }
  });

  const [activeRole, setActiveRole] = useState<'citizen' | 'volunteer' | 'admin'>('citizen');
  const [pendingScannerItem, setPendingScannerItem] = useState<ScannerItemData | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPersistedState = async () => {
      try {
        const snapshot = await getDoc(ECO_STATE_DOC);
        if (!snapshot.exists() || cancelled) {
          return;
        }

        const data = snapshot.data() as Partial<PersistedEcoState>;

        if (data.userProfile) setUserProfile(prev => ({ ...prev, ...data.userProfile }));
        if (data.appointments) setAppointments(data.appointments);
        if (data.vouchers) setVouchers(data.vouchers);
        if (data.stations) setStations(data.stations);
        if (data.rewardsCatalog) setRewardsCatalog(data.rewardsCatalog);
      } catch (error) {
        console.warn('Firestore load failed', error);
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    loadPersistedState();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync state to local storage
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [appointments]);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [vouchers]);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [stations]);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewardsCatalog));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    setDoc(ECO_STATE_DOC, {
      userProfile,
      appointments,
      vouchers,
      stations,
      rewardsCatalog
    }).catch(error => {
      console.warn('Firestore save failed', error);
    });
  }, [isHydrated, userProfile, appointments, vouchers, stations, rewardsCatalog]);

  // Book a new drop-off appointment
  const bookAppointment = (data: {
    categories: Record<string, number>;
    stationId: string;
    date: string;
    time: string;
  }): DropoffAppointment => {
    const station = stations.find(s => s.id === data.stationId) || stations[0];
    
    let totalPoints = 0;
    let estimatedWeightKg = 0;
    const items: AppointmentItem[] = [];

    Object.entries(data.categories).forEach(([catId, qty]) => {
      if (qty <= 0) return;
      const cat = wasteCategories.find(c => c.id === catId);
      if (cat) {
        const itemPoints = Math.round(qty * cat.pointsPerUnit);
        totalPoints += itemPoints;
        const weightEquivalent = cat.unit === 'kg' ? qty : qty * 0.75;
        estimatedWeightKg += weightEquivalent;

        items.push({
          categoryId: cat.id,
          categoryName: cat.name,
          declaredQty: Number(qty.toFixed(1)),
          unit: cat.unit,
          pointsPerUnit: cat.pointsPerUnit
        });
      }
    });

    const co2Saved = Number((estimatedWeightKg * 1.82).toFixed(2));
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const refCode = `ECO-2026-${randomSuffix}`;

    const newAppointment: DropoffAppointment = {
      id: `drop-${Date.now()}`,
      referenceCode: refCode,
      stationId: station.id,
      stationName: station.name,
      stationAddress: station.address,
      scheduledDate: data.date,
      scheduledTime: data.time,
      items,
      status: 'PENDING',
      totalEstimatedPoints: totalPoints,
      estimatedWeightKg: Number(estimatedWeightKg.toFixed(1)),
      co2SavedKg: co2Saved,
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [newAppointment, ...prev]);

    // Update user profile stats
    setUserProfile(prev => ({
      ...prev,
      totalDropoffs: prev.totalDropoffs + 1
    }));

    return newAppointment;
  };

  // Cancel an appointment
  const cancelAppointment = (id: string): boolean => {
    let found = false;
    setAppointments(prev =>
      prev.map(app => {
        if (app.id === id || app.referenceCode === id) {
          found = true;
          return { ...app, status: 'CANCELLED' };
        }
        return app;
      })
    );
    return found;
  };

  // Volunteer station check-in
  const volunteerCheckIn = (
    identifier: string,
    verifiedWeights: Record<string, number>,
    verifierName = 'Station Lead'
  ) => {
    const cleanId = identifier.trim().toUpperCase();
    const target = appointments.find(
      a => a.referenceCode.toUpperCase() === cleanId || a.id === identifier
    );

    if (!target) {
      return { success: false, message: `Appointment "${cleanId}" was not found in the system.` };
    }

    if (target.status === 'CHECKED_IN') {
      return { success: false, message: `Appointment ${cleanId} has already been checked in.` };
    }

    if (target.status === 'CANCELLED') {
      return { success: false, message: `Appointment ${cleanId} was cancelled.` };
    }

    let actualPoints = 0;
    let actualWeight = 0;

    const updatedItems = target.items.map(item => {
      const verified = verifiedWeights[item.categoryId] ?? item.declaredQty;
      const pts = Math.round(verified * item.pointsPerUnit);
      actualPoints += pts;
      const weightEq = item.unit === 'kg' ? verified : verified * 0.75;
      actualWeight += weightEq;

      return {
        ...item,
        verifiedQty: Number(verified.toFixed(1)),
        pointsEarned: pts
      };
    });

    const finalCo2 = Number((actualWeight * 1.82).toFixed(2));

    const updatedApp: DropoffAppointment = {
      ...target,
      items: updatedItems,
      status: 'CHECKED_IN',
      totalActualPoints: actualPoints,
      actualWeightKg: Number(actualWeight.toFixed(1)),
      co2SavedKg: finalCo2,
      checkedInAt: new Date().toISOString(),
      verifierName
    };

    setAppointments(prev => prev.map(a => (a.id === target.id ? updatedApp : a)));

    // Credit points directly to citizen's profile
    setUserProfile(prev => {
      const newTotalWaste = Number((prev.totalWasteRecycled + actualWeight).toFixed(1));
      const newBalance = prev.pointsBalance + actualPoints;
      const newTotalEarned = prev.totalPointsEarned + actualPoints;

      let newTier = prev.tier;
      if (newTotalEarned >= 3000) newTier = 'Earth Hero';
      else if (newTotalEarned >= 1800) newTier = 'Eco Champion';
      else if (newTotalEarned >= 800) newTier = 'Green Guardian';

      return {
        ...prev,
        pointsBalance: newBalance,
        totalPointsEarned: newTotalEarned,
        totalWasteRecycled: newTotalWaste,
        tier: newTier
      };
    });

    return {
      success: true,
      appointment: updatedApp,
      pointsAwarded: actualPoints,
      message: `Drop-off verified! Awarded ${actualPoints} points to citizen.`
    };
  };

  // Redeem a reward
  const redeemReward = (reward: Reward) => {
    if (userProfile.pointsBalance < reward.pointsCost) {
      return {
        success: false,
        message: `Insufficient points. You need ${reward.pointsCost - userProfile.pointsBalance} more points.`
      };
    }

    setUserProfile(prev => ({
      ...prev,
      pointsBalance: prev.pointsBalance - reward.pointsCost
    }));

    const cleanVendor = reward.vendor.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const couponCode = `ECO-${cleanVendor}-${randomCode}`;
    const barcodeValue = `890${Math.floor(100000000 + Math.random() * 900000000)}`;

    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    const newVoucher: ClaimedVoucher = {
      id: `vouch-${Date.now()}`,
      rewardId: reward.id,
      title: reward.name,
      vendor: reward.vendor,
      pointsCost: reward.pointsCost,
      couponCode,
      barcodeValue,
      status: 'ACTIVE',
      redeemedAt: new Date().toISOString(),
      expiresAt: expires.toISOString(),
      description: reward.description,
      image: reward.image
    };

    setVouchers(prev => [newVoucher, ...prev]);

    return { success: true, voucher: newVoucher };
  };

  const useVoucher = (voucherId: string) => {
    setVouchers(prev =>
      prev.map(v => (v.id === voucherId ? { ...v, status: 'USED' as const } : v))
    );
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  const toggleStationStatus = (stationId: string, status: 'Open' | 'Busy' | 'Maintenance') => {
    setStations(prev =>
      prev.map(s =>
        s.id === stationId
          ? {
              ...s,
              status,
              isActive: status !== 'Maintenance',
              capacityPercent: status === 'Maintenance' ? 0 : status === 'Busy' ? 90 : 45
            }
          : s
      )
    );
  };

  const getAggregateImpact = () => {
    const checkedIn = appointments.filter(a => a.status === 'CHECKED_IN');
    
    let totalKg = checkedIn.reduce((sum, a) => sum + (a.actualWeightKg || a.estimatedWeightKg), 0);
    let co2Kg = checkedIn.reduce((sum, a) => sum + a.co2SavedKg, 0);

    if (totalKg === 0) {
      totalKg = userProfile.totalWasteRecycled;
      co2Kg = Number((totalKg * 1.82).toFixed(1));
    }

    const treesSaved = Number((totalKg / 18.5).toFixed(1));
    const energyKwh = Number((totalKg * 4.3).toFixed(1));
    const waterLiters = Math.round(totalKg * 26.5);

    const categoryTotals: Record<string, { kg: number; points: number }> = {};
    wasteCategories.forEach(c => {
      categoryTotals[c.id] = { kg: 0, points: 0 };
    });

    checkedIn.forEach(a => {
      a.items.forEach(item => {
        const kg = item.unit === 'kg' ? (item.verifiedQty || item.declaredQty) : (item.verifiedQty || item.declaredQty) * 0.75;
        if (!categoryTotals[item.categoryId]) {
          categoryTotals[item.categoryId] = { kg: 0, points: 0 };
        }
        categoryTotals[item.categoryId].kg += kg;
        categoryTotals[item.categoryId].points += item.pointsEarned || Math.round(kg * item.pointsPerUnit);
      });
    });

    const categoryBreakdown = wasteCategories.map(c => {
      const recorded = categoryTotals[c.id]?.kg || 0;
      const fallbackKg = Math.round(totalKg * ([0.35, 0.25, 0.15, 0.1, 0.1, 0.05][wasteCategories.indexOf(c)] || 0.1));
      const finalKg = recorded > 0 ? Number(recorded.toFixed(1)) : fallbackKg;
      return {
        name: c.name,
        kg: finalKg,
        points: Math.round(finalKg * c.pointsPerUnit),
        color: c.color
      };
    });

    return {
      totalKg: Number(totalKg.toFixed(1)),
      co2Kg: Number(co2Kg.toFixed(1)),
      treesSaved,
      energyKwh,
      waterLiters,
      categoryBreakdown
    };
  };

  return (
    <EcoContext.Provider
      value={{
        userProfile,
        appointments,
        vouchers,
        stations,
        rewardsCatalog,
        activeRole,
        setActiveRole,
        pendingScannerItem,
        setPendingScannerItem,
        bookAppointment,
        cancelAppointment,
        volunteerCheckIn,
        redeemReward,
        useVoucher,
        updateUserProfile,
        toggleStationStatus,
        getAggregateImpact
      }}
    >
      {children}
    </EcoContext.Provider>
  );
};

export const useEcoStore = () => {
  const context = useContext(EcoContext);
  if (!context) {
    throw new Error('useEcoStore must be used within an EcoProvider');
  }
  return context;
};
