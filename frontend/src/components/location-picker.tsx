'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Crosshair } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number } | null) => void;
}

// Leaflet stamps this internal id on the container to detect re-initialization;
// it isn't part of the public typings.
interface LeafletContainer extends HTMLDivElement {
  _leaflet_id?: number;
}

// Macas, capital of Morona Santiago.
const DEFAULT_CENTER: [number, number] = [-2.3087, -78.1114];

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  onChangeRef.current = onChange;
  const [isLocating, setIsLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const mapElement = mapRef.current as LeafletContainer | null;
    if (!mapElement || leafletMapRef.current) return;

    // Dynamic import to avoid SSR issues
    import('leaflet').then((L) => {
      // Guard against container already initialized (React Strict Mode / HMR)
      if (mapElement._leaflet_id) return;
      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialValue = initialValueRef.current;
      const initialCenter: [number, number] = initialValue ? [initialValue.lat, initialValue.lng] : DEFAULT_CENTER;

      const map = L.map(mapElement).setView(initialCenter, initialValue ? 16 : 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      if (initialValue) {
        markerRef.current = L.marker([initialValue.lat, initialValue.lng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChangeRef.current({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
        });
      }

      map.on('click', (e: LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const coords = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLatLng();
            onChangeRef.current({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
          });
        }
        onChangeRef.current(coords);
      });

      leafletMapRef.current = map;
      setIsMapReady(true);
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
      delete mapElement._leaflet_id;
    };
  }, []);

  // Sync external value changes (e.g. on locate)
  useEffect(() => {
    if (!isMapReady || !leafletMapRef.current) return;

    import('leaflet').then((L) => {
      if (value) {
        if (markerRef.current) {
          markerRef.current.setLatLng([value.lat, value.lng]);
        } else {
          markerRef.current = L.marker([value.lat, value.lng], { draggable: true }).addTo(leafletMapRef.current!);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLatLng();
            onChangeRef.current({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
          });
        }
        leafletMapRef.current!.setView([value.lat, value.lng], 16);
      } else if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    });
  }, [value, isMapReady]);

  function handleLocate() {
    if (!navigator.geolocation) {
      toast('Tu navegador no soporta geolocalización.', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        onChange(coords);
        setIsLocating(false);
      },
      () => {
        toast('No se pudo obtener la ubicación. Verifica los permisos del navegador.', 'error');
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  }

  function handleClear() {
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleLocate} disabled={isLocating}>
          <Crosshair className="w-4 h-4 mr-2" />
          {isLocating ? 'Obteniendo ubicación...' : 'Usar mi ubicación'}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Limpiar
          </Button>
        )}
      </div>

      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div
        ref={mapRef}
        data-testid="location-picker-map"
        className="w-full overflow-hidden rounded-md border border-input [&_.leaflet-control-zoom_a]:!flex [&_.leaflet-control-zoom_a]:!h-11 [&_.leaflet-control-zoom_a]:!w-11 [&_.leaflet-control-zoom_a]:!items-center [&_.leaflet-control-zoom_a]:!justify-center [&_.leaflet-control-zoom_a]:!leading-[44px]"
        style={{ height: '320px' }}
      />

      {value ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Lat: {value.lat}, Lng: {value.lng}. Arrastra el marcador para ajustar.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Haz clic en el mapa para marcar la ubicación o usa el botón de geolocalización.
        </p>
      )}
    </div>
  );
}
