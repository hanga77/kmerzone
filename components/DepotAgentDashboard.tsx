import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Order, OrderStatus, User } from '../types';
import { QrCodeIcon, XIcon, ExclamationTriangleIcon, CheckIcon, ArchiveBoxIcon, ShoppingBagIcon, ChartPieIcon, BuildingStorefrontIcon, TruckIcon, SearchIcon, PrinterIcon, DocumentTextIcon, CalendarDaysIcon, MapPinIcon } from './Icons';

declare const Html5Qrcode: any;

interface DepotAgentDashboardProps {
  user: User;
  allUsers: User[];
  allOrders: Order[];
  onCheckIn: (orderId: string, storageLocationId: string) => void;
  onReportDiscrepancy: (orderId: string, reason: string) => void;
  onLogout: () => void;
  onProcessDeparture: (orderId: string, recipientInfo?: { name: string; idNumber: string }) => void;
}

const STORAGE_LOCATIONS = Array.from({ length: 5 }, (_, i) => String.fromCharCode(65 + i)) // A-E
    .flatMap(row => Array.from({ length: 10 }, (_, j) => `${row}${j + 1}`)); // 1-10

const ScannerModal: React.FC<{
    title: string;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}> = ({ title, onClose, onScanSuccess }) => {
    const html5QrCodeRef = useRef<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!Html5Qrcode) return;
        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;

        const startScanner = async () => {
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText: string) => {
                        onScanSuccess(decodedText);
                        html5QrCode.stop();
                    },
                    () => {}
                );
            } catch (err) {
                setError("Impossible de démarrer la caméra. Vérifiez les permissions.");
            }
        };
        startScanner();

        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(() => {});
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-white">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <div id="reader" className="w-full h-64 bg-gray-900 rounded-md"></div>
                {error && <p className="text-red-400 mt-2">{error}</p>}
                <button onClick={onClose} className="mt-4 w-full bg-gray-600 py-2 rounded-md">Annuler</button>
            </div>
        </div>
    );
};

export const DepotAgentDashboard: React.FC<DepotAgentDashboardProps> = ({ user, allOrders, onCheckIn, onReportDiscrepancy, onLogout, onProcessDeparture }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'inventory' | 'reports'>('overview');
    const [scanMode, setScanMode] = useState<'checkin' | 'checkout' | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const depotOrders = useMemo(() => allOrders.filter(o => o.pickupPointId === user.depotId), [allOrders, user.depotId]);
    const ordersInDepot = useMemo(() => depotOrders.filter(o => o.status === 'at-depot'), [depotOrders]);

    const handleScanSuccess = (decodedText: string) => {
        const order = allOrders.find(o => o.trackingNumber === decodedText);
        if (!order) {
            alert('Commande non trouvée.');
            setScanMode(null);
            return;
        }

        if (scanMode === 'checkin') {
            const location = prompt("Entrez l'emplacement de stockage (ex: A1, B5):")?.toUpperCase();
            if (location && STORAGE_LOCATIONS.includes(location)) {
                onCheckIn(order.id, location);
                alert(`Commande ${order.id} enregistrée à l'emplacement ${location}.`);
            } else {
                alert("Emplacement invalide.");
            }
        } else if (scanMode === 'checkout') {
            onProcessDeparture(order.id);
            alert(`Commande ${order.id} marquée comme sortie.`);
        }
        setScanMode(null);
    };

    const renderOverview = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <h3 className="font-bold text-blue-800 dark:text-blue-300">Colis en Attente</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-200">{depotOrders.filter(o => o.status === 'picked-up').length}</p>
            </div>
             <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <h3 className="font-bold text-green-800 dark:text-green-300">Colis en Stock</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-200">{ordersInDepot.length}</p>
            </div>
             <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <h3 className="font-bold text-gray-800 dark:text-gray-300">Colis Sortis (24h)</h3>
                <p className="text-3xl font-bold text-gray-600 dark:text-gray-200">0</p>
            </div>
        </div>
    );
    
    const renderCheckIn = () => (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-bold">Enregistrement des Colis</h3>
            <p className="text-gray-500 my-4">Scannez le QR code d'un colis pour l'enregistrer à son arrivée au dépôt.</p>
            <button onClick={() => setScanMode('checkin')} className="bg-kmer-green text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 mx-auto">
                <QrCodeIcon className="w-6 h-6"/> Démarrer le Scan d'Arrivée
            </button>
        </div>
    );

    const renderInventory = () => (
        <div>
            <h3 className="text-xl font-bold mb-4">Plan de l'Entrepôt</h3>
            <div className="grid grid-cols-10 gap-2 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                {STORAGE_LOCATIONS.map(loc => {
                    const order = ordersInDepot.find(o => o.storageLocationId === loc);
                    const isSelected = selectedOrder?.storageLocationId === loc;
                    return (
                        <button key={loc} onClick={() => setSelectedOrder(order || null)} 
                                className={`h-16 rounded-md flex flex-col items-center justify-center text-xs font-bold transition-all
                                ${order ? 'bg-orange-200 dark:bg-orange-800 hover:bg-orange-300' : 'bg-green-200 dark:bg-green-800 hover:bg-green-300'}
                                ${isSelected ? 'ring-2 ring-kmer-green' : ''}`}>
                            <span>{loc}</span>
                            {order && <ArchiveBoxIcon className="w-5 h-5 mt-1" />}
                        </button>
                    )
                })}
            </div>
            {selectedOrder && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-bold">Détails de l'Emplacement {selectedOrder.storageLocationId}</h4>
                    <p>Commande: {selectedOrder.id}</p>
                    <p>Client: {selectedOrder.shippingAddress.fullName}</p>
                    <button onClick={() => { onProcessDeparture(selectedOrder.id); setSelectedOrder(null); }} className="mt-2 text-sm bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-md">
                        Marquer comme sorti
                    </button>
                </div>
            )}
        </div>
    );

    const renderReports = () => (
        <div className="text-center p-8">
            <h3 className="text-xl font-bold">Rapports</h3>
            <p className="text-gray-500 my-4">Générez des rapports sur les activités du dépôt.</p>
            <button className="bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg cursor-not-allowed">
                Rapport journalier (Bientôt disponible)
            </button>
        </div>
    );

    const renderTabContent = () => {
        switch(activeTab) {
            case 'overview': return renderOverview();
            case 'checkin': return renderCheckIn();
            case 'inventory': return renderInventory();
            case 'reports': return renderReports();
            default: return null;
        }
    }

    return (
    <>
        {scanMode && <ScannerModal title={scanMode === 'checkin' ? "Scanner un colis à l'arrivée" : "Scanner un colis au départ"} onClose={() => setScanMode(null)} onScanSuccess={handleScanSuccess} />}
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                 <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de bord Agent de Dépôt</h1>
                        <p className="text-gray-500 dark:text-gray-400">Dépôt: {allOrders.find(o => o.pickupPointId === user.depotId)?.pickupPointId || 'Non assigné'}</p>
                      </div>
                      <button onClick={onLogout} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Déconnexion</button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="p-2 border-b dark:border-gray-700 flex justify-around">
                        <button onClick={() => setActiveTab('overview')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'overview' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ChartPieIcon className="w-5 h-5"/> Aperçu</button>
                        <button onClick={() => setActiveTab('checkin')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'checkin' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ArchiveBoxIcon className="w-5 h-5"/> Arrivages</button>
                        <button onClick={() => setActiveTab('inventory')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'inventory' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><BuildingStorefrontIcon className="w-5 h-5"/> Inventaire</button>
                        <button onClick={() => setActiveTab('reports')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'reports' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><DocumentTextIcon className="w-5 h-5"/> Rapports</button>
                    </div>
                    <div className="p-6">
                        {renderTabContent()}
                    </div>
                </div>
            </main>
        </div>
    </>
    );
};
