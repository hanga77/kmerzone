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
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const agentMarkerRef = useRef<any>(null);
    const routingControlRef = useRef<any>(null);

    const missions = useMemo(() => {
        if (!user) return [];
        return allOrders.filter(o => o.agentId === user.id && ['picked-up', 'at-depot', 'out-for-delivery', 'ready-for-pickup'].includes(o.status));
    }, [allOrders, user]);

    useEffect(() => {
        if (view === 'map' && mapContainerRef.current && !mapRef.current && typeof L !== 'undefined') {
            mapRef.current = L.map(mapContainerRef.current).setView([4.0511, 9.7679], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
            agentMarkerRef.current = L.marker([4.0511, 9.7679], { title: "Votre position" }).addTo(mapRef.current);
        }
    }, [view]);
    
     useEffect(() => {
        if (mapRef.current && missions.length > 0) {
            const waypoints = missions.flatMap(order => {
                const store = allStores.find(s => s.name === order.items[0].vendor);
                const pickupPoint = allPickupPoints.find(p => p.id === order.pickupPointId);
                const customerAddress = order.shippingAddress;
                
                const points = [];
                if (order.status === 'ready-for-pickup' && store?.latitude && store?.longitude) {
                    points.push(L.latLng(store.latitude, store.longitude));
                }
                if (order.deliveryMethod === 'pickup' && pickupPoint?.latitude && pickupPoint?.longitude) {
                    points.push(L.latLng(pickupPoint.latitude, pickupPoint.longitude));
                } else if (order.deliveryMethod === 'home-delivery' && customerAddress?.latitude && customerAddress?.longitude) {
                    points.push(L.latLng(customerAddress.latitude, customerAddress.longitude));
                }
                return points;
            }).filter(Boolean);
            
            if (routingControlRef.current) {
                routingControlRef.current.setWaypoints(waypoints);
            } else if (waypoints.length > 0) {
                routingControlRef.current = L.Routing.control({
                    waypoints,
                    routeWhileDragging: true
                }).addTo(mapRef.current);
            }
        }
     }, [missions, allStores, allPickupPoints, view]);

    // Fix: Updated the type of deliveryFailureReason to match the Order type.
    const handleUpdateStatus = (orderId: string, status: OrderStatus, deliveryFailureReason?: { reason: 'client-absent' | 'adresse-erronee' | 'colis-refuse', details: string }) => {
        const updates: Partial<Order> = { status };
        if(status === 'delivery-failed' && deliveryFailureReason) {
            updates.deliveryFailureReason = { ...deliveryFailureReason, date: new Date().toISOString() };
        }
        if(status === 'delivered') {
            const signature = prompt("Nom du réceptionnaire (ou description si laissé quelque part) :");
            if(signature) updates.signatureUrl = signature; // In real app, this would be an image URL
        }
        onUpdateOrder(orderId, updates);
    };
    
    const handleScanSuccess = (decodedText: string) => {
        setIsScannerOpen(false);
        const order = allOrders.find(o => o.trackingNumber === decodedText);
        if (!order) {
            alert('Commande non trouvée.');
            return;
        }
        if (order.status === 'ready-for-pickup') {
            handleUpdateStatus(order.id, 'picked-up');
            alert(`Commande ${order.id} marquée comme "Pris en charge".`);
        } else if (order.status === 'out-for-delivery') {
            handleUpdateStatus(order.id, 'delivered');
             alert(`Commande ${order.id} marquée comme "Livrée".`);
        } else {
             alert(`Action non valide pour le statut actuel de la commande (${statusTranslations[order.status]}).`);
        }
    };
    
    if (!user) return null;

    return (
        <>
            {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-600 dark:text-gray-300">Statut</h3>
                                <p className={`text-xl font-bold ${user.availabilityStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>{user.availabilityStatus === 'available' ? 'Disponible' : 'Indisponible'}</p>
                            </div>
                             <button onClick={() => onUpdateUserAvailability(user.id, user.availabilityStatus === 'available' ? 'unavailable' : 'available')} className={`px-4 py-2 rounded-md font-semibold text-white ${user.availabilityStatus === 'available' ? 'bg-red-500' : 'bg-green-500'}`}>
                                {user.availabilityStatus === 'available' ? 'Passer indisponible' : 'Passer disponible'}
                            </button>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h3 className="font-bold text-gray-600 dark:text-gray-300">Missions Actives</h3>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{missions.length}</p>
                        </div>
                        <button onClick={() => setIsScannerOpen(true)} className="md:col-span-1 p-4 bg-kmer-green text-white rounded-lg shadow-md flex flex-col justify-center items-center text-center hover:bg-green-700">
                            <QrCodeIcon className="w-8 h-8"/>
                            <p className="font-bold mt-1">Scanner un Colis</p>
                        </button>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="p-2 border-b dark:border-gray-700 flex justify-between items-center">
                             <h2 className="text-lg font-bold">Mes missions</h2>
                             <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                                <button onClick={() => setView('list')} className={`p-2 rounded-md ${view === 'list' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}><ListBulletIcon className="w-5 h-5"/></button>
                                <button onClick={() => setView('map')} className={`p-2 rounded-md ${view === 'map' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}><MapIcon className="w-5 h-5"/></button>
                            </div>
                        </div>

                        {view === 'list' ? (
                             <div className="space-y-4 p-4">
                                {missions.map(order => (
                                    <div key={order.id} className="p-3 border rounded-md dark:border-gray-700">
                                        <p className="font-bold">{order.id}</p>
                                        <p>Client: {order.shippingAddress.fullName}</p>
                                        <p>Adresse: {order.shippingAddress.address}, {order.shippingAddress.city}</p>
                                        <div className="mt-2 flex gap-2">
                                            {order.status === 'ready-for-pickup' && <button onClick={() => handleUpdateStatus(order.id, 'picked-up')} className="bg-blue-500 text-white px-3 py-1 rounded">Récupéré</button>}
                                            {order.status === 'out-for-delivery' && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(order.id, 'delivered')} className="bg-green-500 text-white px-3 py-1 rounded">Livré</button>
                                                    {/* Fix: Added validation for the reason from the prompt to match the required type. */}
                                                    <button onClick={() => {
                                                        const reason = prompt("Motif de l'échec (client-absent, adresse-erronee, colis-refuse):");
                                                        const details = prompt("Détails supplémentaires :");
                                                        if (reason && details) {
                                                            if (['client-absent', 'adresse-erronee', 'colis-refuse'].includes(reason)) {
                                                                handleUpdateStatus(order.id, 'delivery-failed', { reason: reason as 'client-absent' | 'adresse-erronee' | 'colis-refuse', details });
                                                            } else {
                                                                alert("Motif invalide. Veuillez choisir parmi : client-absent, adresse-erronee, colis-refuse.");
                                                            }
                                                        }
                                                    }} className="bg-red-500 text-white px-3 py-1 rounded">Échec livraison</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div ref={mapContainerRef} className="h-96 w-full"></div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};
