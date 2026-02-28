import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KTPCameraProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  address?: string;
}

export const KTPCamera = ({ onCapture, onCancel, address }: KTPCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraReady(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);

        const now = new Date();
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const dayText = days[now.getDay()];
        const dateText = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        const timeText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

        // Helper function for wrapping text
        const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          const words = text.split(' ');
          let line = '';
          let currentY = y;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              context.fillText(line, x, currentY);
              line = words[n] + ' ';
              currentY += lineHeight;
            }
            else {
              line = testLine;
            }
          }
          context.fillText(line, x, currentY);
          return currentY; // Return last Y position for calculating next element position
        };

        const drawWatermark = (ctx: CanvasRenderingContext2D, logoImg?: HTMLImageElement) => {
          const padding = 20;

          if (logoImg) {
            // Draw logo top right
            // Darken background for logo
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            // Add roundRect polyfill if not available in all browsers
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(canvas.width - 240, 20, 220, 90, 10);
              ctx.fill();
            } else {
              // Fallback for browsers not supporting roundRect
              ctx.fillRect(canvas.width - 240, 20, 220, 90);
            }
            ctx.drawImage(logoImg, canvas.width - 240, 20, 220, 90);
          }

          // Main info box
          const boxHeight = 250;
          const startY = canvas.height - boxHeight;

          // Draw time
          ctx.fillStyle = 'white';
          ctx.font = 'bold 80px "Oswald", "Arial Narrow", Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(timeText, padding, startY + 20);

          // Measure time text width
          const timeWidth = ctx.measureText(timeText).width;

          // Draw vertical divider
          ctx.strokeStyle = '#0284c7'; // Blue color matching user screenshot
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(padding + timeWidth + 15, startY + 25);
          ctx.lineTo(padding + timeWidth + 15, startY + 95);
          ctx.stroke();

          // Draw Date & Day
          ctx.font = '24px Arial';
          ctx.fillText(dateText, padding + timeWidth + 30, startY + 30);
          ctx.fillText(dayText, padding + timeWidth + 30, startY + 65);

          // Draw address wrapping
          ctx.font = '30px Arial';
          let addressY = startY + 130;
          if (address) {
            addressY = wrapText(ctx, address, padding, startY + 130, canvas.width * 0.65, 40);
          }

          // Draw Usaha background
          const usahaY = addressY + 50;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(padding, usahaY - 10, canvas.width / 1.5, 50);

          ctx.fillStyle = 'white';
          ctx.font = '26px Arial';
          ctx.fillText('Usaha: Playstation Racing Game', padding + 15, usahaY);
        }

        const logoImg = new Image();
        logoImg.onload = () => {
          drawWatermark(ctx, logoImg);
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedImage(imageData);
          stopCamera();
        };

        logoImg.onerror = () => {
          drawWatermark(ctx);
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedImage(imageData);
          stopCamera();
        };

        logoImg.src = '/PRG LOGO FIX.png';
      }
    }
  }, [stopCamera, address]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Confirm photo
  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
    }
  }, [capturedImage, onCapture, stopCamera]);

  // Cancel
  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  // Start camera on mount
  useState(() => {
    startCamera();
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Foto Setup PS</h3>
          <button
            onClick={handleCancel}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-white/80 text-sm mt-2">
          Pastikan setup PS dan TV terlihat jelas
        </p>
      </div>

      {/* Camera/Preview */}
      <div className="flex-1 relative flex items-center justify-center">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* KTP Frame Guide */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="relative w-full max-w-md aspect-[1.6/1] border-4 border-white/50 rounded-xl">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                    Posisikan setup PS di dalam frame
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured Setup PS"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {!capturedImage ? (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={capturePhoto}
              disabled={!isCameraReady}
              className={cn(
                "w-20 h-20 rounded-full bg-white hover:bg-white/90 shadow-2xl",
                !isCameraReady && "opacity-50"
              )}
            >
              <Camera className="w-8 h-8 text-black" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={retakePhoto}
              variant="outline"
              className="flex-1 gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4" />
              Foto Ulang
            </Button>
            <Button
              onClick={confirmPhoto}
              className="flex-1 gap-2 gradient-success text-secondary-foreground"
            >
              <Check className="w-4 h-4" />
              Gunakan Foto
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
