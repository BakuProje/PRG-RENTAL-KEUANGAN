import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Location } from '@/types/rental';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GPSMapProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  className?: string;
}

type GPSStatus = 'idle' | 'loading' | 'success' | 'error';

export function GPSMap({ onLocationSelect, initialLocation, className }: GPSMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(initialLocation || null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Reverse geocoding function
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Get accuracy level
  const getAccuracyLevel = (accuracy: number): 'high' | 'medium' | 'low' => {
    if (accuracy <= 20) return 'high';
    if (accuracy <= 100) return 'medium';
    return 'low';
  };

  // Update marker position
  const updateMarker = useCallback(async (lat: number, lng: number, accuracyMeters?: number) => {
    if (!mapRef.current) return;

    const accuracy = getAccuracyLevel(accuracyMeters || 100);
    const address = await reverseGeocode(lat, lng);
    
    const location: Location = { lat, lng, address, accuracy };
    setCurrentLocation(location);
    onLocationSelect(location);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      
      markerRef.current.on('dragend', async () => {
        const pos = markerRef.current?.getLatLng();
        if (pos) {
          const newAddress = await reverseGeocode(pos.lat, pos.lng);
          const newLocation: Location = { lat: pos.lat, lng: pos.lng, address: newAddress, accuracy: 'medium' };
          setCurrentLocation(newLocation);
          onLocationSelect(newLocation);
        }
      });
    }

    mapRef.current.setView([lat, lng], 16);
  }, [onLocationSelect, reverseGeocode]);

  // Get current GPS location with multiple attempts
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setErrorMessage('Browser tidak mendukung GPS');
      return;
    }

    setGpsStatus('loading');
    setErrorMessage('');

    // Stop any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Try with lower accuracy first for faster response
    const quickOptions = {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 30000,
    };

    const preciseOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    let gotLocation = false;

    // Quick attempt first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!gotLocation) {
          gotLocation = true;
          setGpsStatus('success');
          updateMarker(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
          
          // Then try to get more precise location in background
          navigator.geolocation.getCurrentPosition(
            (precisePosition) => {
              updateMarker(precisePosition.coords.latitude, precisePosition.coords.longitude, precisePosition.coords.accuracy);
            },
            () => {}, // Ignore errors on second attempt
            preciseOptions
          );
        }
      },
      (quickError) => {
        // If quick attempt fails, try with high accuracy
        navigator.geolocation.getCurrentPosition(
          (position) => {
            gotLocation = true;
            setGpsStatus('success');
            updateMarker(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
          },
          (error) => {
            setGpsStatus('error');
            switch (error.code) {
              case error.PERMISSION_DENIED:
                setErrorMessage('Akses GPS ditolak. Silakan aktifkan izin lokasi di browser.');
                break;
              case error.POSITION_UNAVAILABLE:
                setErrorMessage('Lokasi tidak tersedia. Pastikan GPS aktif.');
                break;
              case error.TIMEOUT:
                setErrorMessage('Waktu pencarian lokasi habis. Coba lagi.');
                break;
              default:
                setErrorMessage('Gagal mendapatkan lokasi. Coba refresh GPS.');
            }
          },
          preciseOptions
        );
      },
      quickOptions
    );
  }, [updateMarker]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = L.map(mapContainer.current).setView([-6.2088, 106.8456], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);

    // Allow click to set location
    mapRef.current.on('click', async (e) => {
      updateMarker(e.latlng.lat, e.latlng.lng);
    });

    // Auto-get location immediately after map is initialized
    const timer = setTimeout(() => {
      getCurrentLocation();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [getCurrentLocation, updateMarker]);

  const accuracyColors = {
    high: 'text-success',
    medium: 'text-warning',
    low: 'text-destructive',
  };

  const accuracyLabels = {
    high: 'Akurasi Tinggi',
    medium: 'Akurasi Sedang',
    low: 'Akurasi Rendah',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* GPS Status & Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {gpsStatus === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-primary"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Mencari lokasi...</span>
            </motion.div>
          )}
          {gpsStatus === 'success' && currentLocation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-success" />
              <span className={cn('text-sm font-medium', accuracyColors[currentLocation.accuracy])}>
                {accuracyLabels[currentLocation.accuracy]}
              </span>
            </motion.div>
          )}
          {gpsStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-destructive"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errorMessage}</span>
            </motion.div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={gpsStatus === 'loading'}
          className="gap-2"
        >
          {gpsStatus === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh GPS
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-lg">
        <div 
          ref={mapContainer} 
          className="w-full h-64 lg:h-80"
        />
        
        {/* Loading overlay */}
        {gpsStatus === 'loading' && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center animate-bounce-soft">
                <Navigation className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Mencari lokasi Anda...</p>
            </div>
          </div>
        )}
      </div>

      {/* Address Display */}
      {currentLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-muted/50 border border-border"
        >
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Alamat Terdeteksi</p>
              {isReverseGeocoding ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Memuat alamat...</span>
                </div>
              ) : (
                <p className="text-sm font-medium text-foreground">{currentLocation.address}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Klik pada peta atau geser pin untuk mengubah lokasi
      </p>
    </div>
  );
}
