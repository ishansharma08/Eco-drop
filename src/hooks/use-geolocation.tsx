import { useEffect, useState } from 'react';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const useGeolocation = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const onSuccess = (pos: globalThis.GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setPosition({ latitude, longitude, accuracy });
      setLoading(false);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err.message || 'Unable to retrieve your location');
      setLoading(false);
    };

    const watcherId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 20_000
    });

    return () => navigator.geolocation.clearWatch(watcherId);
  }, []);

  return { position, error, loading } as const;
};

export const haversineDistanceKm = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


