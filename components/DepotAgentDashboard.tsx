import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Order, OrderStatus, User } from '../types';
import { QrCodeIcon, XIcon, ExclamationTriangleIcon, CheckIcon, ArchiveBoxIcon, ShoppingBagIcon, ChartPieIcon, BuildingStorefrontIcon, TruckIcon, SearchIcon, PrinterIcon, DocumentTextIcon, CalendarDaysIcon, MapPinIcon } from './Icons';

declare const Html5Qrcode: any;

interface DepotAgentDashboardProps {
  user: User;
  allUsers: User[];
  allOrders: Order[];
  onCheckIn: (orderId: string, storageLocationId: string, notes?: string) => void;
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
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualFormData, setManualFormData] = useState({ trackingNumber: '', storageLocation: '', notes: '' });

    const depotOrders = useMemo(() => allOrders.filter(o => o.pickupPointId === user.depotId || o.status === 'picked-up'), [allOrders, user.depotId]);
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
    
    const handleManualCheckin = (e: React.FormEvent) => {
        e.preventDefault();
        const { trackingNumber, storageLocation, notes } = manualFormData;
        const order = allOrders.find(o => o.trackingNumber === trackingNumber);
        if(!order) {
            alert("Aucune commande trouvée avec ce numéro de suivi.");
            return;
        }
        if(!STORAGE_LOCATIONS.includes(storageLocation.toUpperCase())) {
            alert("Emplacement de stockage invalide.");
            return;
        }
        onCheckIn(order.id, storageLocation.toUpperCase(), notes || undefined);
        if(notes) {
            onReportDiscrepancy(order.id, notes);
        }
        alert(`Commande ${order.id} enregistrée manuellement.`);
        setManualFormData({ trackingNumber: '', storageLocation: '', notes: '' });
        setShowManualForm(false);
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
        <div>
            <div className="p-8 border-2 border-dashed rounded-lg text-center">
                <h3 className="text-xl font-bold">Enregistrement des Colis</h3>
                <p className="text-gray-500 my-4">Scannez le QR code d'un colis ou saisissez ses informations manuellement.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => setScanMode('checkin')} className="bg-kmer-green text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2">
                        <QrCodeIcon className="w-6 h-6"/> Démarrer le Scan
                    </button>
                    <button onClick={() => setShowManualForm(prev => !prev)} className="bg-gray-600 text-white font-bold py-3 px-6 rounded-lg">
                        Saisie Manuelle
                    </button>
                </div>
            </div>
            {showManualForm && (
                <form onSubmit={handleManualCheckin} className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 space-y-4 animate-in">
                    <h4 className="font-semibold text-lg">Saisie Manuelle</h4>
                    <div>
                        <label htmlFor="trackingNumber" className="block text-sm font-medium">Numéro de suivi</label>
                        <input 
                            type="text" 
                            id="trackingNumber" 
                            value={manualFormData.trackingNumber}
                            onChange={e => setManualFormData(d => ({...d, trackingNumber: e.target.value}))}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required 
                        />
                    </div>
                    <div>
                        <label htmlFor="storageLocation" className="block text-sm font-medium">Emplacement de stockage</label>
                        <input 
                            type="text" 
                            id="storageLocation" 
                            value={manualFormData.storageLocation}
                            onChange={e => setManualFormData(d => ({...d, storageLocation: e.target.value.toUpperCase()}))}
                            placeholder="Ex: A5, C12"
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required 
                        />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium">Notes / Anomalies (optionnel)</label>
                        <textarea 
                            id="notes" 
                            value={manualFormData.notes}
                            onChange={e => setManualFormData(d => ({...d, notes: e.target.value}))}
                            rows={2}
                            placeholder="Ex: Colis endommagé sur un côté"
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowManualForm(false)} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 py-2 rounded-md">Annuler</button>
                        <button type="submit" className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-md">Enregistrer</button>
                    </div>
                </form>
            )}
        </div>
    );

    return (
        <>
            {scanMode && <ScannerModal title={scanMode === 'checkin' ? 'Enregistrer un colis' : 'Sortir un colis'} onClose={() => setScanMode(null)} onScanSuccess={handleScanSuccess} />}
            <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
                 <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                    <div className="container mx-auto px-4 sm:px-6 py-3">
                         <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Tableau de bord Agent de Dépôt</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Dépôt: {user.depotId || 'Non assigné'} | Agent: {user.name}</p>
                            </div>
                            <button onClick={onLogout} className="text-sm bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Déconnexion</button>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="p-2 border-b dark:border-gray-700 flex justify-around">
                             <button onClick={() => setActiveTab('overview')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'overview' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ChartPieIcon className="w-5 h-5"/>Aperçu</button>
                             <button onClick={() => setActiveTab('checkin')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'checkin' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ArchiveBoxIcon className="w-5 h-5"/>Enregistrement</button>
                             <button onClick={() => setActiveTab('inventory')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'inventory' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ShoppingBagIcon className="w-5 h-5"/>Inventaire</button>
                             <button onClick={() => setActiveTab('reports')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'reports' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ExclamationTriangleIcon className="w-5 h-5"/>Rapports</button>
                        </div>
                        <div className="p-4 sm:p-6">
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'checkin' && renderCheckIn()}
                            {activeTab === 'inventory' && <p>La section Inventaire sera bientôt disponible.</p>}
                            {activeTab === 'reports' && <p>La section Rapports sera bientôt disponible.</p>}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};