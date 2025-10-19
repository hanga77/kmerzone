import React, { useMemo, useState, useCallback } from 'react';
import type { Order, OrderStatus, Store, PickupPoint, User, UserAvailabilityStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { QrCodeIcon, MapIcon, ListBulletIcon, PhotoIcon, ChartPieIcon, XIcon, CheckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { ScannerModal } from './shared/ScannerModal';
import { SignatureModal } from './delivery/SignatureModal';
import { DeliveryFailureModal } from './delivery/DeliveryFailureModal';
import { MissionMap } from './delivery/MissionMap';

// FIX: Declare Leaflet types to resolve TS errors.
declare namespace L {
    interface LatLng {
        lat: number;
        lng: number;
        alt?: number;
    }
}
declare const L: any;


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
    'return-approved': 'Retour approuvé',
    'return-received': 'Retour reçu',
    'return-rejected': 'Retour rejeté',
    'depot-issue': 'Problème au dépôt',
    'delivery-failed': 'Échec de livraison',
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
        const _history = agentOrders.filter((o: Order) => ['delivered', 'delivery-failed', 'return-received'].includes(o.status));
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