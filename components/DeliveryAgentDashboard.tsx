import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { Order, OrderStatus, Store, PickupPoint, User, UserAvailabilityStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { QrCodeIcon, MapIcon, ListBulletIcon, PhotoIcon, ChartPieIcon, XIcon, CheckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

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
  onLogout: () => void;
  siteData: any;
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
    t: (key: string) => string;
}> = ({ onClose, onScanSuccess, t }) => {
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

const SignatureModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: (orderId: string, recipientName: string) => void;
    t: (key: string) => string;
}> = ({ order, onClose, onConfirm, t }) => {
    const [recipientName, setRecipientName] = useState('');
    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 dark:text-white">{t('deliveryDashboard.confirmDelivery')}</h3>
                <p className="text-sm mb-4">{t('deliveryDashboard.order')}: <span className="font-mono">{order.id}</span></p>
                <div>
                    <label htmlFor="recipientName" className="block text-sm font-medium dark:text-gray-300">{t('deliveryDashboard.recipientName')}</label>
                    <input
                        id="recipientName"
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Ex: Jean Dupont"
                        required
                    />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg">{t('common.cancel')}</button>
                    <button onClick={() => onConfirm(order.id, recipientName)} disabled={!recipientName.trim()} className="bg-green-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 flex items-center gap-2">
                        <CheckIcon className="w-5 h-5"/> {t('deliveryDashboard.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeliveryFailureModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: (orderId: string, failureReason: Required<Order['deliveryFailureReason']>) => void;
    t: (key: string) => string;
}> = ({ order, onClose, onConfirm, t }) => {
    const [reason, setReason] = useState<'client-absent' | 'adresse-erronee' | 'colis-refuse'>('client-absent');
    const [details, setDetails] = useState('');
    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 dark:text-white">{t('deliveryDashboard.reportFailure')}</h3>
                <p className="text-sm mb-4">{t('deliveryDashboard.order')}: <span className="font-mono">{order.id}</span></p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="failureReason" className="block text-sm font-medium dark:text-gray-300">{t('deliveryDashboard.reason')}</label>
                        <select
                            id="failureReason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value as any)}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="client-absent">{t('deliveryDashboard.clientAbsent')}</option>
                            <option value="adresse-erronee">{t('deliveryDashboard.wrongAddress')}</option>
                            <option value="colis-refuse">{t('deliveryDashboard.packageRefused')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="failureDetails" className="block text-sm font-medium dark:text-gray-300">{t('deliveryDashboard.details')}</label>
                        <textarea
                            id="failureDetails"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={3}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Ex: Le client ne répond pas au téléphone, la porte est fermée..."
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg">{t('common.cancel')}</button>
                    <button onClick={() => onConfirm(order.id, { reason, details, date: new Date().toISOString() })} disabled={!details.trim()} className="bg-red-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 flex items-center gap-2">
                        <XIcon className="w-5 h-5"/> {t('deliveryDashboard.confirmFailure')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MissionMap: React.FC<{ start?: L.LatLng; end?: L.LatLng }> = ({ start, end }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>();
    const routingControlRef = useRef<any>(null);

    useEffect(() => {
        if (mapRef.current && !leafletMap.current) {
            leafletMap.current = L.map(mapRef.current).setView([4.05, 9.75], 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(leafletMap.current);
        }

        if (leafletMap.current && end) {
            if (routingControlRef.current) {
                leafletMap.current.removeControl(routingControlRef.current);
            }
            if(start) {
                routingControlRef.current = L.Routing.control({
                    waypoints: [start, end],
                    routeWhileDragging: false,
                    show: false,
                    createMarker: () => null
                }).addTo(leafletMap.current);
            } else {
                 L.marker(end).addTo(leafletMap.current);
                 leafletMap.current.setView(end, 14);
            }
        }
        setTimeout(() => leafletMap.current?.invalidateSize(), 100);
    }, [start, end]);

    return <div ref={mapRef} className="h-48 w-full rounded-md mt-4 z-0"></div>;
};

export const DeliveryAgentDashboard: React.FC<DeliveryAgentDashboardProps> = ({ onLogout, siteData }) => {
    const { user, updateUserInfo } = useAuth();
    const { t } = useLanguage();
    const [view, setView] = useState<'missions' | 'history'>('missions');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [modalState, setModalState] = useState<{ type: 'signature' | 'failure'; order: Order } | null>(null);
    const [openMapOrderId, setOpenMapOrderId] = useState<string | null>(null);
    const { allOrders, allStores, allPickupPoints } = siteData;
    
    const onUpdateUserAvailability = (userId: string, newStatus: UserAvailabilityStatus) => {
        updateUserInfo(userId, { availabilityStatus: newStatus });
    };

    const onUpdateDeliveryStatus = (orderId: string, status: OrderStatus, details?: { signature?: string; failureReason?: Order['deliveryFailureReason'] }) => {
        if (user) {
            siteData.handleUpdateDeliveryStatus(orderId, status, user, details);
        }
    };

    const { missions, history } = useMemo(() => {
        if (!user) return { missions: [], history: [] };
        const agentOrders = allOrders.filter((o: Order) => o.agentId === user.id);
        const _missions = agentOrders.filter((o: Order) => ['picked-up', 'at-depot', 'out-for-delivery', 'ready-for-pickup'].includes(o.status));
        const _history = agentOrders.filter((o: Order) => ['delivered', 'delivery-failed', 'returned'].includes(o.status));
        return { missions: _missions, history: _history };
    }, [allOrders, user]);

    const handleConfirmDelivery = useCallback((orderId: string, recipientName: string) => {
        onUpdateDeliveryStatus(orderId, 'delivered', { signature: recipientName });
        setModalState(null);
    }, [onUpdateDeliveryStatus]);

    const handleConfirmFailure = useCallback((orderId: string, failureReason: Required<Order['deliveryFailureReason']>) => {
        onUpdateDeliveryStatus(orderId, 'delivery-failed', { failureReason });
        setModalState(null);
    }, [onUpdateDeliveryStatus]);
    
    const handleScannerClose = useCallback(() => {
        setIsScannerOpen(false);
    }, []);
    const handleScanSuccess = useCallback((decodedText: string) => {
        setIsScannerOpen(false);
        const order = allOrders.find((o: Order) => o.trackingNumber === decodedText);
        if (!order) {
            alert('Commande non trouvée.');
            return;
        }
        if (order.status === 'ready-for-pickup') {
            onUpdateDeliveryStatus(order.id, 'picked-up');
            alert(`Commande ${order.id} marquée comme "Pris en charge".`);
        } else if (order.status === 'out-for-delivery') {
            setModalState({ type: 'signature', order });
        } else {
             alert(`Action non valide pour le statut actuel de la commande (${statusTranslations[order.status]}).`);
        }
    }, [allOrders, onUpdateDeliveryStatus]);

    const getRouteDetails = useCallback((order: Order) => {
        let start: L.LatLng | undefined;
        let end: L.LatLng | undefined;
        let destinationLabel = '';

        const agentZoneDepot = allPickupPoints.find((p: PickupPoint) => p.zoneId === user?.zoneId);
        if (agentZoneDepot?.latitude && agentZoneDepot?.longitude) {
            start = L.latLng(agentZoneDepot.latitude, agentZoneDepot.longitude);
        }

        if (order.status === 'ready-for-pickup') {
            const vendorName = order.items[0]?.vendor;
            const store = allStores.find((s: Store) => s.name === vendorName);
            if (store?.latitude && store?.longitude) {
                end = L.latLng(store.latitude, store.longitude);
                destinationLabel = `Récupérer chez : ${store.name}`;
            }
        } else if (['picked-up', 'at-depot', 'out-for-delivery'].includes(order.status)) {
            if (order.shippingAddress.latitude && order.shippingAddress.longitude) {
                end = L.latLng(order.shippingAddress.latitude, order.shippingAddress.longitude);
                destinationLabel = `Livrer à : ${order.shippingAddress.fullName}`;
            }
        }
        return { start, end, destinationLabel };
    }, [user, allStores, allPickupPoints]);
    
    if (!user) return null;

    return (
        <>
            {isScannerOpen && <ScannerModal onClose={handleScannerClose} onScanSuccess={handleScanSuccess} t={t} />}
            {modalState?.type === 'signature' && <SignatureModal order={modalState.order} onClose={() => setModalState(null)} onConfirm={handleConfirmDelivery} t={t} />}
            {modalState?.type === 'failure' && <DeliveryFailureModal order={modalState.order} onClose={() => setModalState(null)} onConfirm={handleConfirmFailure} t={t} />}
            
            <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
                <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                    <div className="container mx-auto px-4 sm:px-6 py-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('deliveryDashboard.title')}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('deliveryDashboard.agent')}: {user.name}</p>
                            </div>
                            <button onClick={onLogout} className="text-sm bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">{t('deliveryDashboard.logout')}</button>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-600 dark:text-gray-300">{t('deliveryDashboard.status')}</h3>
                                <p className={`text-xl font-bold ${user.availabilityStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>{user.availabilityStatus === 'available' ? t('deliveryDashboard.available') : t('deliveryDashboard.unavailable')}</p>
                            </div>
                             <button onClick={() => onUpdateUserAvailability(user.id, user.availabilityStatus === 'available' ? 'unavailable' : 'available')} className={`px-4 py-2 rounded-md font-semibold text-white ${user.availabilityStatus === 'available' ? 'bg-red-500' : 'bg-green-500'}`}>
                                {user.availabilityStatus === 'available' ? t('deliveryDashboard.setUnavailable') : t('deliveryDashboard.setAvailable')}
                            </button>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h3 className="font-bold text-gray-600 dark:text-gray-300">{t('deliveryDashboard.activeMissions')}</h3>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{missions.length}</p>
                        </div>
                        <button onClick={() => setIsScannerOpen(true)} className="md:col-span-1 p-4 bg-kmer-green text-white rounded-lg shadow-md flex flex-col justify-center items-center text-center hover:bg-green-700">
                            <QrCodeIcon className="w-8 h-8"/>
                            <p className="font-bold mt-1">{t('deliveryDashboard.scanPackage')}</p>
                        </button>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="p-2 border-b dark:border-gray-700 flex justify-start items-center">
                             <button onClick={() => setView('missions')} className={`px-4 py-2 font-semibold ${view === 'missions' ? 'border-b-2 border-kmer-green text-kmer-green' : ''}`}>{t('deliveryDashboard.currentMissions')}</button>
                             <button onClick={() => setView('history')} className={`px-4 py-2 font-semibold ${view === 'history' ? 'border-b-2 border-kmer-green text-kmer-green' : ''}`}>{t('deliveryDashboard.history')}</button>
                        </div>

                         <div className="space-y-4 p-4">
                            {(view === 'missions' ? missions : history).map(order => {
                                const { start, end, destinationLabel } = getRouteDetails(order);
                                return (
                                <div key={order.id} className="p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold">{order.id}</p>
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${order.status === 'out-for-delivery' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>{statusTranslations[order.status]}</span>
                                        </div>
                                        <p className="text-lg font-bold">{order.total.toLocaleString('fr-CM')} FCFA</p>
                                    </div>
                                    <div className="mt-4 border-t pt-4 dark:border-gray-700">
                                        <p className="font-semibold">{destinationLabel || `Client: ${order.shippingAddress.fullName} (${order.shippingAddress.phone})`}</p>
                                        <p>Adresse: {order.shippingAddress.address}, {order.shippingAddress.city}</p>
                                    </div>
                                    {openMapOrderId === order.id && end && <MissionMap start={start} end={end} />}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {end && <button onClick={() => setOpenMapOrderId(prev => prev === order.id ? null : order.id)} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"><MapIcon className="w-5 h-5"/>{openMapOrderId === order.id ? t('deliveryDashboard.hideMap') : t('deliveryDashboard.showMap')}</button>}
                                        {order.status === 'ready-for-pickup' && <button onClick={() => onUpdateDeliveryStatus(order.id, 'picked-up')} className="bg-blue-500 text-white px-3 py-2 rounded-lg font-semibold text-sm">{t('deliveryDashboard.pickedUpFromSeller')}</button>}
                                        {order.status === 'out-for-delivery' && (
                                            <>
                                                <button onClick={() => setModalState({ type: 'signature', order })} className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">{t('deliveryDashboard.delivered')}</button>
                                                <button onClick={() => setModalState({ type: 'failure', order })} className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">{t('deliveryDashboard.deliveryFailed')}</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};