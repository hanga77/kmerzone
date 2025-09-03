import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Order, OrderStatus, User } from '../types';
import { QrCodeIcon, XIcon, ExclamationTriangleIcon, CheckIcon, ArchiveBoxIcon, ShoppingBagIcon, ChartPieIcon, BuildingStorefrontIcon, TruckIcon, SearchIcon, PrinterIcon, DocumentTextIcon, CalendarDaysIcon, MapPinIcon, PaperAirplaneIcon } from './Icons';

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
                        html5QrCode.stop().catch(() => {});
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

export const DepotAgentDashboard: React.FC<DepotAgentDashboardProps> = ({ user, allUsers, allOrders, onCheckIn, onReportDiscrepancy, onLogout, onProcessDeparture }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'inventory' | 'reports'>('overview');
    const [scanMode, setScanMode] = useState<'checkin' | 'checkout' | null>(null);
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualFormData, setManualFormData] = useState({ trackingNumber: '', storageLocation: '', notes: '' });

    const { inboundOrders, ordersInDepot } = useMemo(() => {
        const depotId = user.depotId;
        const inbound = allOrders.filter(o => o.status === 'picked-up' && (o.pickupPointId === depotId || o.deliveryMethod === 'home-delivery'));
        const inDepot = allOrders.filter(o => o.status === 'at-depot' && o.storageLocationId && (o.pickupPointId === depotId || o.deliveryMethod === 'home-delivery'));
        return { inboundOrders: inbound, ordersInDepot: inDepot };
    }, [allOrders, user.depotId]);

    const handleScanSuccess = (decodedText: string) => {
        setScanMode(null);
        const order = allOrders.find(o => o.trackingNumber === decodedText);
        if (!order) {
            alert('Commande non trouvée.');
            return;
        }

        if (scanMode === 'checkin') {
            if (order.status !== 'picked-up') {
                alert(`Impossible d'enregistrer. Statut actuel: ${statusTranslations[order.status]}.`);
                return;
            }
            const location = prompt("Entrez l'emplacement de stockage (ex: A1, B5):")?.toUpperCase();
            if (location && STORAGE_LOCATIONS.includes(location)) {
                const notes = prompt("Ajouter des notes ou signaler une anomalie (laisser vide si OK):") || undefined;
                onCheckIn(order.id, location, notes);
                alert(`Commande ${order.id} enregistrée à l'emplacement ${location}.`);
            } else if (location !== null) {
                alert("Emplacement invalide.");
            }
        } else if (scanMode === 'checkout') {
            if (order.status !== 'at-depot') {
                alert(`Impossible de sortir le colis. Statut actuel: ${statusTranslations[order.status]}.`);
                return;
            }
            
            if (order.deliveryMethod === 'pickup') {
                const name = prompt("Nom du client qui récupère:");
                const idNumber = prompt("Numéro de CNI du client:");
                if (name && idNumber) {
                    onProcessDeparture(order.id, { name, idNumber });
                    alert(`Commande ${order.id} remise au client.`);
                } else {
                    alert("Informations du client requises.");
                }
            } else {
                onProcessDeparture(order.id);
                alert(`Commande ${order.id} remise au livreur.`);
            }
        }
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
        onCheckIn(order.id, storageLocation.toUpperCase(), notes);
        alert(`Commande ${order.id} enregistrée manuellement.`);
        setManualFormData({ trackingNumber: '', storageLocation: '', notes: '' });
        setShowManualForm(false);
    };

    const InventoryPanel = () => {
        const [searchTerm, setSearchTerm] = useState('');
        const filteredInventory = useMemo(() => {
            return ordersInDepot.filter(o => {
                const query = searchTerm.toLowerCase();
                return o.id.toLowerCase().includes(query) ||
                    o.shippingAddress.fullName.toLowerCase().includes(query) ||
                    o.storageLocationId?.toLowerCase().includes(query);
            });
        }, [ordersInDepot, searchTerm]);
        
        const storageMap = useMemo(() => {
            const map = new Map<string, Order>();
            ordersInDepot.forEach(o => {
                if(o.storageLocationId) map.set(o.storageLocationId, o);
            });
            return map;
        }, [ordersInDepot]);

        return (
            <div>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <input
                            type="text"
                            placeholder="Rechercher par ID, client, emplacement..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                         <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredInventory.map(order => (
                                <div key={order.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <p className="font-bold">ID: {order.id}</p>
                                    <p className="text-sm">Client: {order.shippingAddress.fullName}</p>
                                    <p className="text-sm font-mono bg-gray-200 dark:bg-gray-600 inline-block px-2 py-0.5 rounded">Emplacement: {order.storageLocationId}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <h4 className="font-semibold mb-2">Plan de l'entrepôt</h4>
                        <div className="grid grid-cols-10 gap-1 p-2 bg-gray-200 dark:bg-gray-900 rounded-md">
                            {STORAGE_LOCATIONS.map(loc => {
                                const order = storageMap.get(loc);
                                const hasIssue = order?.status === 'depot-issue';
                                return (
                                    <div 
                                        key={loc} 
                                        className={`h-12 flex items-center justify-center text-xs font-mono rounded-sm text-center ${
                                            order ? (hasIssue ? 'bg-red-400 text-white' : 'bg-green-400 text-white') : 'bg-gray-50 dark:bg-gray-700'
                                        }`}
                                        title={order ? `ID: ${order.id}\nClient: ${order.shippingAddress.fullName}${hasIssue ? `\nProblème: ${order.discrepancy?.reason}` : ''}` : 'Libre'}
                                    >
                                        {loc}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 </div>
            </div>
        );
    };

    const ReportsPanel = () => {
        const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
        const [reportData, setReportData] = useState<{ checkedIn: Order[], checkedOut: Order[] } | null>(null);

        const generateReport = () => {
            const startOfDay = new Date(reportDate + 'T00:00:00');
            const endOfDay = new Date(reportDate + 'T23:59:59');

            const checkedIn = allOrders.filter(o => 
                o.checkedInAt && 
                new Date(o.checkedInAt) >= startOfDay && 
                new Date(o.checkedInAt) <= endOfDay &&
                allUsers.find(u => u.id === o.checkedInBy)?.depotId === user.depotId
            );

            const checkedOut = allOrders.filter(o => 
                o.processedForDepartureAt && 
                new Date(o.processedForDepartureAt) >= startOfDay && 
                new Date(o.processedForDepartureAt) <= endOfDay &&
                o.departureProcessedByAgentId === user.id
            );
            
            setReportData({ checkedIn, checkedOut });
        };
        
        return (
            <div>
                <h3 className="text-xl font-bold mb-4">Rapports Journaliers</h3>
                 <div className="flex items-center gap-4 mb-4">
                    <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    <button onClick={generateReport} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">Générer</button>
                    {reportData && <button className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Imprimer</button>}
                 </div>
                 {reportData && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 border rounded-lg">
                             <h4 className="font-semibold mb-2">Colis Reçus ({reportData.checkedIn.length})</h4>
                             <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">{reportData.checkedIn.map(o => <li key={o.id}>{o.id} - {o.storageLocationId}</li>)}</ul>
                        </div>
                        <div className="p-4 border rounded-lg">
                             <h4 className="font-semibold mb-2">Colis Sortis ({reportData.checkedOut.length})</h4>
                             <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">{reportData.checkedOut.map(o => <li key={o.id}>{o.id}</li>)}</ul>
                        </div>
                     </div>
                 )}
            </div>
        );
    };

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300">Colis en Attente de Réception</h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-200">{inboundOrders.length}</p>
                </div>
                 <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <h3 className="font-bold text-green-800 dark:text-green-300">Colis en Stock</h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-200">{ordersInDepot.length}</p>
                </div>
                 <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Anomalies Signalées</h3>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-200">{ordersInDepot.filter(o => o.discrepancy).length}</p>
                </div>
            </div>
            <div className="flex justify-center gap-4">
                <button onClick={() => setScanMode('checkin')} className="bg-kmer-green text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"><QrCodeIcon className="w-6 h-6"/> Enregistrer un Colis</button>
                <button onClick={() => setScanMode('checkout')} className="bg-kmer-red text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"><PaperAirplaneIcon className="w-6 h-6"/> Sortir un Colis</button>
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
                        <input type="text" id="trackingNumber" value={manualFormData.trackingNumber} onChange={e => setManualFormData(d => ({...d, trackingNumber: e.target.value}))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label htmlFor="storageLocation" className="block text-sm font-medium">Emplacement de stockage</label>
                        <input type="text" id="storageLocation" value={manualFormData.storageLocation} onChange={e => setManualFormData(d => ({...d, storageLocation: e.target.value.toUpperCase()}))} placeholder="Ex: A5, C12" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium">Notes / Anomalies (optionnel)</label>
                        <textarea id="notes" value={manualFormData.notes} onChange={e => setManualFormData(d => ({...d, notes: e.target.value}))} rows={2} placeholder="Ex: Colis endommagé sur un côté" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowManualForm(false)} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 py-2 rounded-md">Annuler</button>
                        <button type="submit" className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-md">Enregistrer</button>
                    </div>
                </form>
            )}
        </div>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return renderOverview();
            case 'checkin': return renderCheckIn();
            case 'inventory': return <InventoryPanel />;
            case 'reports': return <ReportsPanel />;
            default: return null;
        }
    };

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
                             <button onClick={() => setActiveTab('reports')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'reports' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><DocumentTextIcon className="w-5 h-5"/>Rapports</button>
                        </div>
                        <div className="p-4 sm:p-6">
                            {renderContent()}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};
