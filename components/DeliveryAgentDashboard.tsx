import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Order, OrderStatus, Store, PickupPoint, User, UserAvailabilityStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TruckIcon, MapPinIcon, BuildingStorefrontIcon, CheckIcon, ShoppingBagIcon, QrCodeIcon, XIcon, ExclamationTriangleIcon, MapIcon, ListBulletIcon, CheckCircleIcon, PaperAirplaneIcon, PhotoIcon, ArrowPathIcon, ChartPieIcon, SunIcon } from './Icons';

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

const statusTranslations: {[key in OrderStatus]: string} = {
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
        if (!Html5Qrcode) {
            setScannerError("La bibliothèque de scan n'a pas pu être chargée.");
            return;
        }

        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

        const startScanner = async () => {
            try {
                if (!html5QrCodeRef.current?.isScanning) {
                    setScannerError(null);
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText: string) => {
                           onScanSuccess(decodedText);
                           html5QrCode.stop();
                           onClose();
                        },
                        () => {}
                    );
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
                html5QrCodeRef.current.stop().catch((err: any) => {});
            }
        };
    }, [onClose, onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-6 max-w-lg w-full relative text-white">
                <h3 className="text-xl font-bold mb-4 text-center">Scanner le QR Code</h3>
                <div id="reader" className="w-full h-64 bg-gray-800 rounded-md"></div>
                {scannerError && <p className="text-red-400 text-center mt-2">{scannerError}</p>}
                <button onClick={onClose} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Fermer</button>
            </div>
        </div>
    );
};

const DeliveryConfirmationModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: (orderId: string, proofUrl: string) => void;
}> = ({ order, onClose, onConfirm }) => {
    const [proof, setProof] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => setProof(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold">Confirmer la livraison de #{order.id}</h3>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="mt-4 w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md hover:border-kmer-green">
                    <PhotoIcon className="w-6 h-6" />
                    Prendre une photo comme preuve
                </button>
                {proof && <img src={proof} alt="Preuve" className="mt-4 h-32 w-auto mx-auto rounded-md" />}
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
                    <button onClick={() => onConfirm(order.id, proof || '')} className="px-4 py-2 bg-kmer-green text-white rounded-md" disabled={!proof}>Confirmer</button>
                </div>
            </div>
        </div>
    );
};

const DeliveryFailureModal: React.FC<{
    order: Order;
    onClose: () => void;
    onReport: (orderId: string, reason: 'client-absent' | 'adresse-erronee' | 'colis-refuse', details: string, photoUrl: string) => void;
}> = ({ order, onClose, onReport }) => {
    const [reason, setReason] = useState<'client-absent' | 'adresse-erronee' | 'colis-refuse'>('client-absent');
    const [details, setDetails] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold">Signaler un échec de livraison</h3>
                <select value={reason} onChange={e => setReason(e.target.value as any)} className="w-full mt-4 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="client-absent">Client absent</option>
                    <option value="adresse-erronee">Adresse erronée</option>
                    <option value="colis-refuse">Colis refusé</option>
                </select>
                <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Détails supplémentaires..." className="w-full mt-2 p-2 border rounded-md" />
                {/* ... Photo upload logic similar to confirmation modal ... */}
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose}>Annuler</button>
                    <button onClick={() => onReport(order.id, reason, details, photo || '')}>Signaler</button>
                </div>
            </div>
        </div>
    );
};


export const DeliveryAgentDashboard: React.FC<DeliveryAgentDashboardProps> = ({ allOrders, allStores, allPickupPoints, onUpdateOrder, onLogout, onUpdateUserAvailability }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'missions' | 'map' | 'stats'>('missions');
    const [isAvailable, setIsAvailable] = useState(user?.availabilityStatus === 'available');
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
    const [failingOrder, setFailingOrder] = useState<Order | null>(null);

    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const routingControlRef = useRef<any>(null);

    const missions = useMemo(() => {
        const toPickup = allOrders.filter(o => ['ready-for-pickup'].includes(o.status));
        const toDeliver = allOrders.filter(o => ['picked-up', 'at-depot', 'out-for-delivery'].includes(o.status));
        return { toPickup, toDeliver };
    }, [allOrders]);

    const stats = useMemo(() => {
        const delivered = allOrders.filter(o => o.status === 'delivered');
        const failed = allOrders.filter(o => o.status === 'delivery-failed');
        const total = delivered.length + failed.length;
        return {
            delivered: delivered.length,
            failed: failed.length,
            successRate: total > 0 ? ((delivered.length / total) * 100).toFixed(0) : 100,
        };
    }, [allOrders]);
    
    useEffect(() => {
        if(user) onUpdateUserAvailability(user.id, isAvailable ? 'available' : 'unavailable');
    }, [isAvailable, user, onUpdateUserAvailability]);

    useEffect(() => {
        if (activeTab === 'map' && mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([4.05, 9.75], 13); // Centered on Douala
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
        }
        if (mapRef.current) {
            setTimeout(() => mapRef.current.invalidateSize(), 100);
        }
    }, [activeTab]);

    useEffect(() => {
        if (mapRef.current && activeTab === 'map') {
            if (routingControlRef.current) {
                mapRef.current.removeControl(routingControlRef.current);
            }
            
            const waypoints = [
                ...missions.toPickup.map(o => {
                    const store = allStores.find(s => s.name === o.items[0].vendor);
                    return store?.latitude && store?.longitude ? L.latLng(store.latitude, store.longitude) : null;
                }),
                ...missions.toDeliver.map(o => {
                    const point = allPickupPoints.find(p => p.id === o.pickupPointId);
                    if (o.deliveryMethod === 'pickup' && point?.latitude && point?.longitude) {
                        return L.latLng(point.latitude, point.longitude);
                    }
                    if (o.shippingAddress.latitude && o.shippingAddress.longitude) {
                        return L.latLng(o.shippingAddress.latitude, o.shippingAddress.longitude);
                    }
                    return null;
                })
            ].filter(wp => wp !== null);

            if (waypoints.length > 1) {
                routingControlRef.current = L.Routing.control({
                    waypoints,
                    routeWhileDragging: true,
                    show: false,
                    createMarker: () => null, // Disable default markers
                }).addTo(mapRef.current);
            }
        }
    }, [missions, allStores, allPickupPoints, activeTab]);

    const handleScanSuccess = (decodedText: string) => {
        const orderToUpdate = allOrders.find(o => o.trackingNumber === decodedText);
        if (orderToUpdate) {
            if (orderToUpdate.status === 'ready-for-pickup') onUpdateOrder(orderToUpdate.id, { status: 'picked-up' });
            else if (orderToUpdate.status === 'at-depot') onUpdateOrder(orderToUpdate.id, { status: 'out-for-delivery' });
            else alert(`Statut invalide pour le scan : ${statusTranslations[orderToUpdate.status]}`);
        } else {
            alert('Commande non trouvée');
        }
    };
    
    const handleConfirmDelivery = (orderId: string, proofUrl: string) => {
        onUpdateOrder(orderId, { status: 'delivered', proofOfDeliveryUrl: proofUrl });
        setConfirmingOrder(null);
    };

    const handleReportFailure = (orderId: string, reason: any, details: string, photoUrl: string) => {
        onUpdateOrder(orderId, { 
            status: 'delivery-failed', 
            deliveryFailureReason: { reason, details, date: new Date().toISOString() } 
        });
        setFailingOrder(null);
    };


    if (!user) return null;

    const renderMissions = () => (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold mb-2">À récupérer ({missions.toPickup.length})</h3>
                <div className="space-y-3">
                    {missions.toPickup.map(o => (
                        <div key={o.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="font-semibold">{o.items[0].vendor}</p>
                            <p className="text-sm">ID: {o.id}</p>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="font-bold mb-2">À livrer ({missions.toDeliver.length})</h3>
                <div className="space-y-3">
                    {missions.toDeliver.map(o => (
                        <details key={o.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <summary className="font-semibold cursor-pointer">{o.shippingAddress.fullName} <span className="text-xs font-normal">({o.shippingAddress.address}, {o.shippingAddress.city})</span></summary>
                            <div className="mt-3 pt-3 border-t dark:border-gray-600">
                                <h4 className="font-bold text-sm">Actions de livraison</h4>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => setConfirmingOrder(o)} className="text-xs bg-green-500 text-white font-semibold px-3 py-1 rounded-md">Livré</button>
                                    <button onClick={() => setFailingOrder(o)} className="text-xs bg-red-500 text-white font-semibold px-3 py-1 rounded-md">Échec</button>
                                </div>
                                <h4 className="font-bold text-sm mt-3">Messages Rapides</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <a href={`sms:${o.shippingAddress.phone}?body=Votre livreur KMER ZONE est en route.`} className="text-xs bg-blue-500 text-white font-semibold px-3 py-1 rounded-md">En route</a>
                                    <a href={`sms:${o.shippingAddress.phone}?body=Je suis à 5 minutes de votre adresse.`} className="text-xs bg-blue-500 text-white font-semibold px-3 py-1 rounded-md">J'arrive dans 5 min</a>
                                    <a href={`sms:${o.shippingAddress.phone}?body=Bonjour, j'ai du mal à trouver votre adresse. Pouvez-vous m'appeler ?`} className="text-xs bg-yellow-500 text-black font-semibold px-3 py-1 rounded-md">Problème d'adresse</a>
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderMap = () => (
        <div ref={mapContainerRef} className="h-96 w-full rounded-lg shadow-md z-0" />
    );

    const renderStats = () => (
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.delivered}</p>
                <p className="text-sm font-semibold text-green-800 dark:text-green-400">Livraisons Réussies</p>
            </div>
             <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.failed}</p>
                <p className="text-sm font-semibold text-red-800 dark:text-red-400">Échecs</p>
            </div>
            <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-center col-span-2">
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.successRate}%</p>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-400">Taux de Réussite</p>
            </div>
        </div>
    );

    return (
        <>
            {isScannerOpen && <ScannerModal onClose={() => setScannerOpen(false)} onScanSuccess={handleScanSuccess} />}
            {confirmingOrder && <DeliveryConfirmationModal order={confirmingOrder} onClose={() => setConfirmingOrder(null)} onConfirm={handleConfirmDelivery} />}
            {failingOrder && <DeliveryFailureModal order={failingOrder} onClose={() => setFailingOrder(null)} onReport={handleReportFailure} />}
            
            <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
                 <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                    <div className="container mx-auto px-4 sm:px-6 py-3">
                         <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Tableau de bord Livreur</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Bienvenue, {user.name}</p>
                            </div>
                            <button onClick={onLogout} className="text-sm bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Déconnexion</button>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex justify-between items-center">
                        <p className="font-semibold">Mon statut :</p>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isAvailable} onChange={() => setIsAvailable(v => !v)} className="sr-only peer" />
                            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-kmer-green"></div>
                            <span className={`ml-3 text-sm font-bold ${isAvailable ? 'text-kmer-green' : 'text-red-500'}`}>{isAvailable ? 'Disponible' : 'Indisponible'}</span>
                        </label>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="p-2 border-b dark:border-gray-700 flex justify-around">
                            <button onClick={() => setActiveTab('missions')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'missions' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ListBulletIcon className="w-5 h-5"/>Missions</button>
                            <button onClick={() => setActiveTab('map')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'map' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><MapIcon className="w-5 h-5"/>Carte</button>
                            <button onClick={() => setActiveTab('stats')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'stats' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ChartPieIcon className="w-5 h-5"/>Stats</button>
                        </div>
                        <div className="p-4">
                            {activeTab === 'missions' && renderMissions()}
                            {activeTab === 'map' && renderMap()}
                            {activeTab === 'stats' && renderStats()}
                        </div>
                    </div>

                    <button onClick={() => setScannerOpen(true)} className="fixed bottom-6 right-6 bg-kmer-green text-white rounded-full p-4 shadow-lg hover:bg-green-700 z-30">
                        <QrCodeIcon className="w-8 h-8" />
                    </button>
                </main>
            </div>
        </>
    );
};
