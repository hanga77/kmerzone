import React, { useState, useMemo, useCallback } from 'react';
import type { Order, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ScannerModal } from './shared/ScannerModal';
import { SignatureModal } from './delivery/SignatureModal';
import { DeliveryFailureModal } from './delivery/DeliveryFailureModal';
import { MissionMap } from './delivery/MissionMap';
import { TruckIcon, MapIcon, CheckIcon, XIcon } from './Icons';

interface DeliveryAgentDashboardProps {
  onLogout: () => void;
  siteData: any;
}

export const DeliveryAgentDashboard: React.FC<DeliveryAgentDashboardProps> = ({ onLogout, siteData }) => {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const { allOrders, handleDriverPickup, handleConfirmDelivery, handleDeliveryFailure } = siteData;

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const activeMissions = useMemo(() =>
        allOrders.filter((o: Order) => o.agentId === user?.id && ['picked-up', 'at-depot', 'out-for-delivery'].includes(o.status))
    , [allOrders, user]);

    const handleStatusToggle = () => {
        if (user) {
            const newStatus = user.availabilityStatus === 'available' ? 'unavailable' : 'available';
            updateUser({ availabilityStatus: newStatus });
        }
    };

    const handleScanSuccess = useCallback((decodedText: string) => {
        setIsScannerOpen(false);
        const order = allOrders.find((o: Order) => o.trackingNumber === decodedText);
        if (order) {
            setSelectedOrder(order);
            if (order.status === 'ready-for-pickup') {
                handleDriverPickup(order.id);
            }
        } else {
            alert("Commande non trouvée.");
        }
    }, [allOrders, handleDriverPickup]);

    const handleConfirmDeliveryAndClose = (orderId: string, recipientName: string) => {
        handleConfirmDelivery(orderId, recipientName);
        setIsSignatureModalOpen(false);
        setSelectedOrder(null);
    };

    const handleFailureReportAndClose = (orderId: string, failureReason: Required<Order['deliveryFailureReason']>) => {
        handleDeliveryFailure(orderId, failureReason);
        setIsFailureModalOpen(false);
        setSelectedOrder(null);
    };
    
    if (!user) return null;

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
            {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} t={t} />}
            {isSignatureModalOpen && selectedOrder && <SignatureModal order={selectedOrder} onClose={() => setIsSignatureModalOpen(false)} onConfirm={handleConfirmDeliveryAndClose} t={t} />}
            {isFailureModalOpen && selectedOrder && <DeliveryFailureModal order={selectedOrder} onClose={() => setIsFailureModalOpen(false)} onConfirm={handleFailureReportAndClose} t={t} />}

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

            <main className="container mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-6">
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h2 className="font-bold text-lg mb-4">{t('deliveryDashboard.status')}</h2>
                            <button onClick={handleStatusToggle} className={`w-full font-bold py-3 rounded-lg ${user.availabilityStatus === 'available' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {user.availabilityStatus === 'available' ? t('deliveryDashboard.setUnavailable') : t('deliveryDashboard.setAvailable')}
                            </button>
                        </div>
                         <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h2 className="font-bold text-lg mb-4">{t('deliveryDashboard.activeMissions')} ({activeMissions.length})</h2>
                            <button onClick={() => setIsScannerOpen(true)} className="w-full bg-kmer-green text-white font-bold py-3 rounded-lg">{t('deliveryDashboard.scanPackage')}</button>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                             <h2 className="font-bold text-lg mb-4">{t('deliveryDashboard.currentMissions')}</h2>
                             <div className="space-y-4">
                                {activeMissions.map(order => (
                                    <div key={order.id} className="p-4 border rounded-lg dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => setSelectedOrder(order)}>
                                        <p className="font-bold">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                                        <p className="text-sm text-gray-500">{order.id}</p>
                                    </div>
                                ))}
                                {activeMissions.length === 0 && <p className="text-center text-gray-500 py-4">Aucune mission en cours.</p>}
                             </div>
                        </div>

                        {selectedOrder && (
                            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-in">
                                <h3 className="font-bold text-lg mb-2">Détails de la mission</h3>
                                <p className="font-mono text-sm">{selectedOrder.id}</p>
                                <address className="not-italic my-2">
                                    <p className="font-semibold">{selectedOrder.shippingAddress.fullName}</p>
                                    <p>{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}</p>
                                    <p>{selectedOrder.shippingAddress.phone}</p>
                                </address>
                                <button onClick={() => setShowMap(s => !s)} className="text-sm text-blue-500 font-semibold flex items-center gap-1 my-2">
                                    <MapIcon className="w-4 h-4" /> {showMap ? t('deliveryDashboard.hideMap') : t('deliveryDashboard.showMap')}
                                </button>
                                {showMap && <MissionMap end={{ lat: selectedOrder.shippingAddress.latitude || 4.05, lng: selectedOrder.shippingAddress.longitude || 9.75 }} />}
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => setIsSignatureModalOpen(true)} className="flex-1 bg-green-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"><CheckIcon className="w-5 h-5"/> {t('deliveryDashboard.delivered')}</button>
                                    <button onClick={() => setIsFailureModalOpen(true)} className="flex-1 bg-red-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"><XIcon className="w-5 h-5"/> {t('deliveryDashboard.deliveryFailed')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};