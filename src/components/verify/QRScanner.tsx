import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onDetected: (value: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onDetected }) => {
  const [hasPermission, setHasPermission] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        
        if (!mounted || !readerRef.current) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onDetected(decodedText);
          },
          () => {
            // Error callback - ignore decode failures
          }
        );
      } catch (e) {
        console.error("QR Scanner error:", e);
        if (mounted) setHasPermission(false);
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onDetected]);

  if (!hasPermission) {
    return (
      <div className="text-sm text-muted-foreground">
        Camera access denied or unavailable. Please allow camera permissions and try again.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div id="qr-reader" ref={readerRef} />
    </div>
  );
};

export default QRScanner;
