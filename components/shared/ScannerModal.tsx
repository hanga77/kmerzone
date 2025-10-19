import React, { useEffect, useRef, useState } from 'react';

declare const Html5Qrcode: any;

interface ScannerModalProps {
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    t: (key: string) => string;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanSuccess, t }) => {
    const html5QrCodeRef = useRef<any>(null);
    const [scannerError, setScannerError] = useState<string | null>(null);
    
    const onScanSuccessRef = useRef(onScanSuccess);
    onScanSuccessRef.current = onScanSuccess;
    const tRef = useRef(t);
    tRef.current = t;

    useEffect(() => {
        if (typeof Html5Qrcode === 'undefined') {
            setScannerError("La bibliothèque de scan n'a pas pu être chargée.");
            return;
        }

        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const startScanner = async () => {
            try {
                if (!html5QrCodeRef.current?.isScanning) {
                    setScannerError(null);
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText: string) => {
                           onScanSuccessRef.current(decodedText);
                        },
                        (errorMessage: string) => {
                            // This callback is called frequently when no QR code is found and can be ignored.
                        }
                    );
                }
            } catch (err) {
                console.error("Failed to start scanner", err);
                setScannerError(tRef.current('deliveryDashboard.scannerError'));
            }
        };

        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch((err: any) => console.error("Error stopping scanner", err));
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-white">
                <h3 className="text-xl font-bold mb-4">{t('deliveryDashboard.scanPackage')}</h3>
                <div id="reader" className="w-full h-64 bg-gray-900 rounded-md"></div>
                {scannerError && <p className="text-red-400 mt-2">{scannerError}</p>}
                <button onClick={onClose} className="mt-4 w-full bg-gray-600 py-2 rounded-md">{t('common.cancel')}</button>
            </div>
        </div>
    );
};
