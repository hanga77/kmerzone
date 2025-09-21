import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { Order, OrderStatus, Store, PickupPoint, User, UserAvailabilityStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { QrCodeIcon, MapIcon, ListBulletIcon, PhotoIcon, ChartPieIcon } from './Icons';

declare namespace L {
    // Basic type for LatLng to satisfy the type checker for the global L object from Leaflet.
    interface LatLng {
        lat: number;
        lng: number;
        alt?: number;
    }
}

declare const L: any; // Leaflet is loaded from a script tag in index.html
declare const Html5Qrcode: any;

interface DeliveryAgentDashboardProps {
  allOrders: Order[];
  allStores: Store[];
  allPickupPoints: PickupPoint[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  onLogout: () => void;
  onUpdateUserAvailability: (userId: string, newStatus: UserAvailabilityStatus) => void;
}

const statusTranslations: { [key in OrderStatus]: string } = {
    confirmed: 'Confirmée',
    'ready-for-pickup': 'Prêt pour enlèvement',
    'picked-up': 'Pris en charge',
    'at-depot': 'Au dépôt',
    'out-for-delivery': 'En livraison',
    delivered: 'Livré',
    cancelled: 'Annulé',
    'refund-requested': 'Remboursement demandé',
    refunded: 'Remboursé',
    returned: 'Retourné',
    'depot-issue': 'Problème au dépôt',
    'delivery-failed': 'Échec de livraison',
};

const ScannerModal: React.FC<{
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}> = ({ onClose, onScanSuccess }) => {
    const html5QrCodeRef = useRef<any>(null);
    const [scannerError, setScannerError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof Html5Qrcode === 'undefined') {
            setScannerError("La bibliothèque de scan n'a pas pu être chargée.");
            return;
        }

        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

        const startScanner = async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length) {
                    if (!html5QrCodeRef.current?.isScanning) {
                        setScannerError(null);
                        await html5QrCode.start(
                            { facingMode: "environment" },
                            config,
                            (decodedText: string) => {
                               onScanSuccess(decodedText);
                            },
                            () => {}
                        );
                    }
                } else {
                     setScannerError("Aucune caméra trouvée.");
                }
            } catch (err) {
                console.error("Failed to start scanner", err);
                setScannerError("Impossible d'activer la caméra. Veuillez vérifier les permissions.");
            }
        };

        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch((err: any) => console.error("Error stopping scanner", err));
            }
        };
    }, [onClose, onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-white">
                <h3 className="text-xl font-bold mb-4">Scanner le colis</h3>
                <div id="reader" className="w-full h-64 bg-gray-900 rounded-md"></div>
                {scannerError && <p className="text-red-400 mt-2">{scannerError}</p>}
                <button onClick={onClose} className="mt-4 w-full bg-gray-600 py-2 rounded-md">Annuler</button>
            </div>
        </div>
    );
};

export const DeliveryAgentDashboard: React.FC<DeliveryAgentDashboardProps> = ({ allOrders, allStores, allPickupPoints, onUpdateOrder, onLogout, onUpdateUserAvailability }) => {
    const { user } = useAuth();
    const [view, setView] = useState<'list' | 'map'>('list');
    
    const missions = useMemo(() => {
        if (!user) return [];
        return allOrders.filter(o => o.agentId === user.id && ['picked-up', 'at-depot', 'out-for-delivery', 'ready-for-pickup'].includes(o.status));
    }, [allOrders, user]);

    const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
        onUpdateOrder(orderId, { status });
    };

    if (!user) return null;

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 py-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Tableau de bord Livreur</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Agent: {user.name}</p>
                        </div>
                        <button onClick={onLogout} className="text-sm bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Déconnexion</button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <h2 className="text-lg font-bold">Mes missions ({missions.length})</h2>
                    {missions.map(order => (
                        <div key={order.id} className="mt-2 p-2 border-t dark:border-gray-700">
                            <p>Commande: {order.id}</p>
                            <p>Client: {order.shippingAddress.fullName}</p>
                            <p>Adresse: {order.shippingAddress.address}, {order.shippingAddress.city}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};
