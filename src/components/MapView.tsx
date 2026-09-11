import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { binStations } from '@/lib/mockData';
import { useGeolocation, haversineDistanceKm } from '@/hooks/use-geolocation';

// Fix default icon issue in Leaflet when using bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon as any;

const FlyToUser = ({ center }: { center: LatLngExpression }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 0.8 });
  }, [center, map]);
  return null;
};

interface MapViewProps {
  className?: string;
}

export const MapView = ({ className }: MapViewProps) => {
  const { position, loading } = useGeolocation();

  const center = useMemo<LatLngExpression>(() => {
    if (position) return [position.latitude, position.longitude];
    // Default center: Jaipur
    return [26.9124, 75.7873];
  }, [position]);

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={13}
        className="h-80 w-full rounded-lg overflow-hidden border border-border"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {position && (
          <Marker position={[position.latitude, position.longitude]}>
            <Popup>
              You are here
            </Popup>
          </Marker>
        )}

        {binStations.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]}>
            <Popup>
              <div className="space-y-1">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.address}</div>
                {position && (
                  <div className="text-xs">{haversineDistanceKm(
                    { latitude: position.latitude, longitude: position.longitude },
                    { latitude: s.lat, longitude: s.lng }
                  ).toFixed(1)} km away</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <FlyToUser center={center} />
      </MapContainer>
    </div>
  );
};

export default MapView;


