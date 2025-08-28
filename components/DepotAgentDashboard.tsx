import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Order, OrderStatus, User, PickupPoint } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { QrCodeIcon, XIcon, ExclamationTriangleIcon, CheckIcon, ArchiveBoxIcon, ShoppingBagIcon, ArrowPathIcon, ChartPieIcon, BuildingStorefrontIcon, ChevronDownIcon, TruckIcon, SearchIcon, CheckCircleIcon } from './Icons';

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

// @FIX: Add missing 'delivery-failed' status translation.
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
  'delivery-failed': 'Échec de livraison'
};

const CustomerPickupModal: React.FC<{
    order: Order;
    onClose: () => void;
    onSubmit: (recipientInfo: { name: string; idNumber: string }) => void;
}> = ({ order, onClose, onSubmit }) => {
    const [recipientName, setRecipientName] = useState(order.shippingAddress.fullName);
    const [recipientId, setRecipientId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipientName.trim() || !recipientId.trim()) {
            alert("Veuillez remplir le nom et le numéro de la pièce d'identité.");
            return;
        }
        onSubmit({ name: recipientName, idNumber: recipientId });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[70] flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-2 dark:text-white">Confirmation de Retrait Client</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Commande : {order.id}</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nom de la personne qui récupère</label>
                        <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Numéro de CNI / Passeport</label>
                        <input type="text" value={recipientId} onChange={e => setRecipientId(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">Annuler</button>
                    <button type="submit" className="bg-kmer-green text-white px-4 py-2 rounded-md">Confirmer la remise</button>
                </div>
            </form>
        </div>
    );
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
                <h3 className="text-xl font-bold mb-4 text-center">Scanner le Colis</h3>
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

export const DepotAgentDashboard: React.FC<DepotAgentDashboardProps> = ({ user, allUsers, allOrders, onCheckIn, onReportDiscrepancy, onLogout, onProcessDeparture }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'arrivals' | 'inventory'>('overview');
  const [modalState, setModalState] = useState<'closed' | 'scanner-checkin' | 'scanner-checkout' | 'choice' | 'storage' | 'discrepancy' | 'pickup-confirm'>('closed');
  const [scanResult, setScanResult] = useState<{ success: boolean, message: string } | null>(null);
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [orderToProcess, setOrderToProcess] = useState<Order | null>(null);
  const [arrivalsSearch, setArrivalsSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  
  const ordersForDepot = useMemo(() => {
    if (!user?.depotId) return [];
    return allOrders.filter(o => o.status === 'picked-up' && o.deliveryMethod === 'pickup' && o.pickupPointId === user.depotId);
  }, [allOrders, user]);

  const inventory = useMemo(() => {
    if (!user?.depotId) return [];
    return allOrders.filter(o => o.status === 'at-depot' && o.pickupPointId === user.depotId);
  }, [allOrders, user]);

  const occupiedSlots = useMemo(() => inventory.map(o => o.storageLocationId!).filter(Boolean), [inventory]);

  const filteredArrivals = useMemo(() => {
    if (!arrivalsSearch.trim()) return ordersForDepot;
    const searchTerm = arrivalsSearch.toLowerCase();
    return ordersForDepot.filter(o =>
        o.id.toLowerCase().includes(searchTerm) ||
        o.shippingAddress.fullName.toLowerCase().includes(searchTerm) ||
        o.items.some(i => i.vendor.toLowerCase().includes(searchTerm))
    );
  }, [ordersForDepot, arrivalsSearch]);

  const filteredInventory = useMemo(() => {
    if (!inventorySearch.trim()) return inventory;
    const searchTerm = inventorySearch.toLowerCase();
    return inventory.filter(o =>
        o.id.toLowerCase().includes(searchTerm) ||
        o.shippingAddress.fullName.toLowerCase().includes(searchTerm) ||
        o.storageLocationId?.toLowerCase().includes(searchTerm)
    );
  }, [inventory, inventorySearch]);

  const handleScanSuccess = (decodedText: string) => {
    if (scanResult) return;

    if (modalState === 'scanner-checkin') {
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
    } else if (modalState === 'scanner-checkout') {
        if (orderToProcess && (decodedText === orderToProcess.id || decodedText === orderToProcess.trackingNumber)) {
            if(orderToProcess.deliveryMethod === 'pickup') {
                setModalState('pickup-confirm');
            } else {
                onProcessDeparture(orderToProcess.id);
                setScanResult({ success: true, message: `Départ du colis ${orderToProcess.id} enregistré.` });
            }
        } else {
            setScanResult({ success: false, message: `Le code-barres ne correspond pas au colis attendu (${orderToProcess?.id}).` });
        }
    }
  };
  
  const closeModal = () => {
    setModalState('closed');
    setScanResult(null);
    setScannedOrder(null);
    setOrderToProcess(null);
  };

  const handleAssignLocation = (orderId: string, locationId: string) => {
      onCheckIn(orderId, locationId);
      closeModal();
  };
  
  const handleDiscrepancySubmit = (orderId: string, reason: string) => {
    onReportDiscrepancy(orderId, reason);
    closeModal();
  };

  const handlePickupConfirmSubmit = (recipientInfo: { name: string, idNumber: string }) => {
      if(orderToProcess) {
          onProcessDeparture(orderToProcess.id, recipientInfo);
      }
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

  const StatCard: React.FC<{icon: React.ReactNode, label: string, value: string | number}> = ({icon, label, value}) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-4">
        <div className="text-kmer-green">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
);

  const renderContent = () => {
      switch(activeTab) {
          case 'arrivals':
              return (
                  <div className="p-6">
                      <h2 className="text-xl font-bold mb-4 dark:text-white">Colis en attente de réception</h2>
                       <div className="relative mb-4">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={arrivalsSearch}
                                onChange={e => setArrivalsSearch(e.target.value)}
                                placeholder="Rechercher par ID, nom client ou vendeur..."
                                className="w-full p-2 pl-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-kmer-green focus:border-kmer-green"
                            />
                        </div>
                      <div className="space-y-3">
                          {filteredArrivals.length > 0 ? (
                            filteredArrivals.map(o => (
                              <div key={o.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                  <p className="font-semibold">{o.id}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">En provenance de: {o.items.map(i => i.vendor).join(', ')}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-gray-500 py-8">Aucun colis trouvé.</p>
                          )}
                      </div>
                  </div>
              );
          case 'inventory':
              return (
                  <div className="p-6">
                      <h2 className="text-xl font-bold mb-4 dark:text-white">Inventaire Actuel</h2>
                       <div className="relative mb-4">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={inventorySearch}
                                onChange={e => setInventorySearch(e.target.value)}
                                placeholder="Rechercher par ID, nom client ou emplacement..."
                                className="w-full p-2 pl-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-kmer-green focus:border-kmer-green"
                            />
                        </div>
                      <div className="space-y-3">
                          {filteredInventory.length > 0 ? (
                            filteredInventory.map(o => {
                              const checkedInByAgent = allUsers.find(u => u.id === o.checkedInBy);
                              return (
                                  <div key={o.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex justify-between items-center">
                                      <div>
                                          <p className="font-semibold">{o.id}</p>
                                          <p className="text-sm text-gray-500">Client: {o.shippingAddress.fullName}</p>
                                          <p className="text-xs text-gray-400">Enregistré par {checkedInByAgent?.name || 'Inconnu'} le {o.checkedInAt ? new Date(o.checkedInAt).toLocaleDateString() : 'N/A'}</p>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="font-mono text-lg font-bold bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md">{o.storageLocationId}</span>
                                        <button
                                            onClick={() => {
                                                setOrderToProcess(o);
                                                setModalState('scanner-checkout');
                                            }}
                                            className="text-sm bg-blue-500 text-white font-semibold px-3 py-2 rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
                                        >
                                            <TruckIcon className="w-4 h-4"/>
                                            Traiter le départ
                                        </button>
                                      </div>
                                  </div>
                              );
                            })
                          ) : (
                            <p className="text-center text-gray-500 py-8">Aucun colis trouvé.</p>
                          )}
                      </div>
                  </div>
              );
          case 'overview':
          default:
              return (
                   <div className="p-6">
                      <h2 className="text-xl font-bold mb-4 dark:text-white">Aperçu du Dépôt</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label="Colis à recevoir" value={analytics.itemsToReceive} />
                          <StatCard icon={<ArchiveBoxIcon className="w-7 h-7"/>} label="Colis en stock" value={analytics.itemsInStock} />
                          <StatCard icon={<ChartPieIcon className="w-7 h-7"/>} label="Capacité utilisée" value={analytics.capacity} />
                      </div>
                  </div>
              );
      }
  }

  return (
    <>
      {modalState.startsWith('scanner') && <ScannerModal onClose={closeModal} onScanSuccess={handleScanSuccess} scanResult={scanResult} />}
      {modalState === 'choice' && scannedOrder && <ActionChoiceModal order={scannedOrder} onClose={closeModal} onAssign={() => setModalState('storage')} onReport={() => setModalState('discrepancy')} />}
      {modalState === 'storage' && scannedOrder && <StorageModal orderId={scannedOrder.id} occupiedSlots={occupiedSlots} onAssign={handleAssignLocation} onClose={closeModal} />}
      {modalState === 'discrepancy' && scannedOrder && <DiscrepancyModal order={scannedOrder} onClose={closeModal} onSubmit={handleDiscrepancySubmit} />}
      {modalState === 'pickup-confirm' && orderToProcess && <CustomerPickupModal order={orderToProcess} onClose={closeModal} onSubmit={handlePickupConfirmSubmit} />}
      
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de bord Agent de Dépôt</h1>
                <p className="text-gray-500 dark:text-gray-400">Dépôt: {user.depotId}</p>
              </div>
              <button onClick={onLogout} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Déconnexion</button>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <TabButton icon={<ChartPieIcon className="w-5 h-5"/>} label="Aperçu" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <TabButton icon={<BuildingStorefrontIcon className="w-5 h-5"/>} label="Arrivages" isActive={activeTab === 'arrivals'} onClick={() => setActiveTab('arrivals')} count={ordersForDepot.length} />
                    <TabButton icon={<ArchiveBoxIcon className="w-5 h-5"/>} label="Inventaire" isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} count={inventory.length} />
                </div>
                <button 
                  onClick={() => setModalState('scanner-checkin')}
                  className="w-full sm:w-auto bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <QrCodeIcon className="w-5 h-5"/> Enregistrer un Colis
                </button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                {renderContent()}
            </div>
        </main>
      </div>
    </>
  );
};
