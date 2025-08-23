import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Order, OrderStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { QrCodeIcon, XIcon, ExclamationTriangleIcon, CheckIcon, ArchiveBoxIcon, ShoppingBagIcon, ArrowPathIcon, ChartPieIcon, BuildingStorefrontIcon, ChevronDownIcon } from './Icons';

declare const Html5Qrcode: any;

interface DepotAgentDashboardProps {
  allOrders: Order[];
  onCheckIn: (orderId: string, storageLocationId: string) => void;
  onReportDiscrepancy: (orderId: string, reason: string) => void;
  onLogout: () => void;
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
  'depot-issue': 'Problème au dépôt'
};

const ScannerModal: React.FC<{
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    scanResult: { success: boolean, message: string } | null;
}> = ({ onClose, onScanSuccess, scanResult }) => {
    const html5QrCodeRef = useRef<any>(null);
    const [scannerError, setScannerError] = useState<string | null>(null);

    useEffect(() => {
        if (!Html5Qrcode) {
            setScannerError("La bibliothèque de scan n'a pas pu être chargée.");
            return;
        }

        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const startScanner = async () => {
            try {
                if (!html5QrCodeRef.current?.isScanning) {
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText: string) => onScanSuccess(decodedText),
                        (errorMessage: string) => {}
                    );
                }
            } catch (err) {
                setScannerError("Impossible d'activer la caméra. Veuillez vérifier les permissions.");
            }
        };
        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(() => {});
            }
        };
    }, [onScanSuccess]);

    useEffect(() => {
        if (scanResult && html5QrCodeRef.current?.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
        }
    }, [scanResult]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-lg w-full text-white">
                <h3 className="text-xl font-bold mb-4 text-center">Scanner le Colis à Enregistrer</h3>
                <div className="w-full h-64 bg-gray-800 rounded-md flex items-center justify-center">
                    <div id="reader" className="w-full" hidden={!!scanResult || !!scannerError}></div>
                    {scannerError && <p className="text-red-400">{scannerError}</p>}
                    {scanResult && (
                        <div className={`text-center p-4 ${scanResult.success ? 'text-green-300' : 'text-red-300'}`}>
                           {scanResult.success ? <CheckIcon className="w-12 h-12 mx-auto"/> : <ExclamationTriangleIcon className="w-12 h-12 mx-auto"/>}
                           <p className="font-semibold mt-2">{scanResult.message}</p>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 font-bold py-2 rounded-lg">Fermer</button>
            </div>
        </div>
    );
};

const StorageModal: React.FC<{
    orderId: string;
    occupiedSlots: string[];
    onAssign: (orderId: string, locationId: string) => void;
    onClose: () => void;
}> = ({ orderId, occupiedSlots, onAssign, onClose }) => {
    const locations = Array.from({ length: 100 }, (_, i) => {
        const row = String.fromCharCode(65 + Math.floor(i / 10));
        const col = (i % 10) + 1;
        return `${row}${col}`;
    });

    return (
       <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Choisir un emplacement de stockage pour {orderId}</h3>
                <div className="grid grid-cols-10 gap-2">
                    {locations.map(loc => {
                        const isOccupied = occupiedSlots.includes(loc);
                        return (
                            <button
                                key={loc}
                                onClick={() => onAssign(orderId, loc)}
                                disabled={isOccupied}
                                className={`h-12 w-12 rounded-md font-mono text-xs font-bold transition-colors
                                  ${isOccupied ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed' : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'}`}
                            >
                                {loc}
                            </button>
                        );
                    })}
                </div>
                 <button onClick={onClose} className="mt-6 w-full bg-gray-200 dark:bg-gray-700 font-bold py-2 rounded-lg">Annuler</button>
            </div>
        </div>
    );
};

const DiscrepancyModal: React.FC<{
    order: Order;
    onClose: () => void;
    onSubmit: (orderId: string, reason: string) => void;
}> = ({ order, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert("Veuillez fournir un motif.");
            return;
        }
        onSubmit(order.id, reason);
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-2 dark:text-white">Signaler un problème</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Commande : {order.id}</p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Ex: Colis endommagé, code-barres incorrect, etc."
                />
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">Annuler</button>
                    <button onClick={handleSubmit} className="bg-red-500 text-white px-4 py-2 rounded-md">Signaler</button>
                </div>
            </div>
        </div>
    );
};

const ActionChoiceModal: React.FC<{
    order: Order;
    onClose: () => void;
    onAssign: () => void;
    onReport: () => void;
}> = ({ order, onClose, onAssign, onReport }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full text-center">
                 <CheckIcon className="w-12 h-12 mx-auto text-green-500"/>
                <h3 className="text-xl font-bold mt-4 mb-2 dark:text-white">Colis scanné avec succès !</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Commande : {order.id}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={onAssign} className="w-full bg-kmer-green text-white font-bold py-3 rounded-lg hover:bg-green-700">
                        Assigner un emplacement de stockage
                    </button>
                    <button onClick={onReport} className="w-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold py-3 rounded-lg hover:bg-red-200">
                        Signaler un problème (ex: colis abîmé)
                    </button>
                </div>
                 <button onClick={onClose} className="mt-6 text-sm text-gray-500 hover:underline">Fermer</button>
            </div>
        </div>
    );
};

const DepotAgentDashboard: React.FC<DepotAgentDashboardProps> = ({ allOrders, onCheckIn, onReportDiscrepancy, onLogout }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'arrivals' | 'inventory'>('overview');
  const [modalState, setModalState] = useState<'closed' | 'scanner' | 'choice' | 'storage' | 'discrepancy'>('closed');
  const [scanResult, setScanResult] = useState<{ success: boolean, message: string } | null>(null);
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  
  const ordersForDepot = useMemo(() => allOrders.filter(o => o.status === 'picked-up'), [allOrders]);
  const inventory = useMemo(() => allOrders.filter(o => o.status === 'at-depot'), [allOrders]);
  const occupiedSlots = useMemo(() => inventory.map(o => o.storageLocationId!).filter(Boolean), [inventory]);

  const handleScanSuccess = (decodedText: string) => {
    if (scanResult) return;
    const order = allOrders.find(o => o.id === decodedText || o.trackingNumber === decodedText);

    if (!order) {
        setScanResult({ success: false, message: "Code-barres inconnu." });
        return;
    }
    if (order.status !== 'picked-up') {
        setScanResult({ success: false, message: `Colis déjà traité (Statut: ${statusTranslations[order.status]})` });
        return;
    }
    setScanResult({ success: true, message: `Colis ${order.id} validé.` });
    setScannedOrder(order);
    setModalState('choice');
  };
  
  const closeModal = () => {
    setModalState('closed');
    setScanResult(null);
    setScannedOrder(null);
  };

  const handleAssignLocation = (orderId: string, locationId: string) => {
      onCheckIn(orderId, locationId);
      closeModal();
  };
  
  const handleDiscrepancySubmit = (orderId: string, reason: string) => {
    onReportDiscrepancy(orderId, reason);
    closeModal();
  };

  const analytics = useMemo(() => ({
      itemsToReceive: ordersForDepot.length,
      itemsInStock: inventory.length,
      capacity: `${Math.round((occupiedSlots.length / 100) * 100)}%`,
  }), [ordersForDepot, inventory, occupiedSlots]);

  if (!user || user.role !== 'depot_agent') {
    return <div className="p-8 text-center text-red-500">Accès non autorisé.</div>;
  }
  
  const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number }> = ({ icon, label, isActive, onClick, count }) => (
    <button onClick={onClick} className={`relative flex items-center gap-2 px-3 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${isActive ? 'text-kmer-green border-kmer-green' : 'text-gray-500 border-transparent hover:text-kmer-green'}`}>
        {icon} <span className="hidden sm:inline">{label}</span>
        {count !== undefined && count > 0 && <span className="ml-1 text-xs bg-kmer-red text-white rounded-full px-1.5 py-0.5">{count}</span>}
    </button>
  );

  return (
    <>
      {modalState === 'scanner' && <ScannerModal onClose={closeModal} onScanSuccess={handleScanSuccess} scanResult={scanResult} />}
      {modalState === 'choice' && scannedOrder && <ActionChoiceModal order={scannedOrder} onClose={closeModal} onAssign={() => setModalState('storage')} onReport={() => setModalState('discrepancy')} />}
      {modalState === 'storage' && scannedOrder && <StorageModal orderId={scannedOrder.id} occupiedSlots={occupiedSlots} onAssign={handleAssignLocation} onClose={closeModal} />}
      {modalState === 'discrepancy' && scannedOrder && <DiscrepancyModal order={scannedOrder} onClose={closeModal} onSubmit={handleDiscrepancySubmit} />}
      
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
          <header className="bg-white dark:bg-gray-800 shadow-sm">
              <div className="container mx-auto px-4 sm:px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de bord Dépôt</h1>
                    <button onClick={onLogout} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Déconnexion</button>
                  </div>
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-2 -mb-5">
                      <div className="flex space-x-2">
                          <TabButton icon={<ChartPieIcon className="w-5 h-5"/>} label="Aperçu" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                          <TabButton icon={<QrCodeIcon className="w-5 h-5"/>} label="Arrivages" isActive={activeTab === 'arrivals'} onClick={() => setActiveTab('arrivals')} count={analytics.itemsToReceive} />
                          <TabButton icon={<ArchiveBoxIcon className="w-5 h-5"/>} label="Inventaire" isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} count={analytics.itemsInStock} />
                      </div>
                  </div>
              </div>
          </header>
          <main className="container mx-auto px-4 sm:px-6 py-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-2xl font-bold dark:text-white">{analytics.itemsToReceive}</p><p className="text-sm text-gray-500 dark:text-gray-400">Colis en attente de réception</p></div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-2xl font-bold dark:text-white">{analytics.itemsInStock}</p><p className="text-sm text-gray-500 dark:text-gray-400">Colis en stock</p></div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-2xl font-bold dark:text-white">{analytics.capacity}</p><p className="text-sm text-gray-500 dark:text-gray-400">Capacité de stockage utilisée</p></div>
                      </div>
                  )}
                  {activeTab === 'arrivals' && (
                       <div>
                           <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Arrivages Attendus</h2>
                                <button onClick={() => setModalState('scanner')} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
                                    <QrCodeIcon className="w-5 h-5"/> Scanner une nouvelle arrivée
                                </button>
                           </div>
                           <div className="space-y-2">
                            {ordersForDepot.length > 0 ? ordersForDepot.map(order => (
                                <details key={order.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md group">
                                    <summary className="font-semibold cursor-pointer flex justify-between items-center">
                                      <span>{order.id} - Client: {order.shippingAddress.fullName}</span>
                                      <ChevronDownIcon className="w-5 h-5 group-open:rotate-180 transition-transform"/>
                                    </summary>
                                    <div className="mt-2 pt-2 border-t dark:border-gray-700 text-sm">
                                      <p className="font-bold">Contenu du colis :</p>
                                      <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                                        {order.items.map(item => (
                                          <li key={item.id}>{item.name} (x{item.quantity})</li>
                                        ))}
                                      </ul>
                                    </div>
                                </details>
                            )) : <p className="text-sm text-gray-500">Aucun colis en transit vers le dépôt.</p>}
                           </div>
                       </div>
                  )}
                  {activeTab === 'inventory' && (
                       <div>
                           <h2 className="text-xl font-bold mb-4">Inventaire Actuel</h2>
                           <div className="space-y-2">
                            {inventory.length > 0 ? inventory.map(order => (
                                <details key={order.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md group">
                                    <summary className="font-semibold cursor-pointer flex justify-between items-center">
                                      <div className="flex items-center gap-4">
                                        <span>{order.id} - Client: {order.shippingAddress.fullName}</span>
                                        <span className="font-mono text-base font-bold bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md">{order.storageLocationId}</span>
                                      </div>
                                      <ChevronDownIcon className="w-5 h-5 group-open:rotate-180 transition-transform"/>
                                    </summary>
                                    <div className="mt-2 pt-2 border-t dark:border-gray-700 text-sm">
                                      <p className="font-bold">Contenu du colis :</p>
                                      <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                                        {order.items.map(item => (
                                          <li key={item.id}>{item.name} (x{item.quantity})</li>
                                        ))}
                                      </ul>
                                    </div>
                                </details>
                            )) : <p className="text-sm text-gray-500">Aucun article en stock.</p>}
                           </div>
                       </div>
                  )}
              </div>
          </main>
      </div>
    </>
  );
};

export default DepotAgentDashboard;