import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Order, OrderStatus, Store, PickupPoint } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TruckIcon, MapPinIcon, BuildingStorefrontIcon, CheckIcon, ShoppingBagIcon, QrCodeIcon, XIcon, ExclamationTriangleIcon, MapIcon, ListBulletIcon } from './Icons';

declare const L: any; // Leaflet is loaded from a script tag in index.html

interface DeliveryAgentDashboardProps {
  allOrders: Order[];
  allStores: Store[];
  allPickupPoints: PickupPoint[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
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

const getActionForOrder = (order: Order) => {
    switch (order.status) {
      case 'ready-for-pickup':
        return { text: 'Scanner la prise en charge', newStatus: 'picked-up' as OrderStatus };
      case 'picked-up':
        // The delivery agent's job is done for this package. It now needs to be scanned in at the depot.
        return null;
      case 'at-depot':
        if (order.deliveryMethod === 'home-delivery') {
          return { text: 'Scanner pour livraison', newStatus: 'out-for-delivery' as OrderStatus };
        }
        return null; // For pickup orders, depot agent handles it.
      case 'out-for-delivery':
        return { text: 'Scanner comme Livré', newStatus: 'delivered' as OrderStatus };
      default:
        return null;
    }
};

const ScannerModal: React.FC<{
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    scanResult: { success: boolean, message: string } | null;
}> = ({ onClose, onScanSuccess, scanResult }) => {
    const html5QrCodeRef = useRef<any>(null);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const viewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!(window as any).Html5Qrcode) {
            console.error("Html5Qrcode library not loaded!");
            setScannerError("La bibliothèque de scan n'a pas pu être chargée. Veuillez rafraîchir la page.");
            return;
        }

        const html5QrCode = new (window as any).Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const startScanner = async () => {
            try {
                if (!html5QrCodeRef.current?.isScanning) {
                    setScannerError(null);
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText: string, decodedResult: any) => {
                           onScanSuccess(decodedText);
                        },
                        (errorMessage: string) => {}
                    );
                }
            } catch (err) {
                console.error("Failed to start scanner", err);
                setScannerError("Impossible d'activer la caméra. Veuillez vérifier les permissions dans votre navigateur.");
            }
        };

        // Delay start to ensure DOM is ready
        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch((err: any) => console.error("Failed to stop scanner on unmount", err));
            }
        };
    }, [onScanSuccess]);

    useEffect(() => {
        if (scanResult && html5QrCodeRef.current?.isScanning) {
            html5QrCodeRef.current.stop().catch((err: any) => console.error("Failed to stop scanner on result", err));
            if (viewRef.current) {
                viewRef.current.style.display = 'none';
            }
        }
    }, [scanResult]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-6 max-w-lg w-full relative text-white">
                <h3 className="text-xl font-bold mb-4 text-center">Scanner le code-barres du colis</h3>
                
                <div className="w-full h-64 bg-gray-800 rounded-md overflow-hidden flex items-center justify-center">
                    <div id="reader" ref={viewRef} className="w-full"></div>
                    
                    {scannerError && (
                         <div className="text-center p-4">
                            <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-4 mx-auto"/>
                            <p className="text-red-300 font-semibold">Erreur de Caméra</p>
                            <p className="text-sm text-red-300/80">{scannerError}</p>
                        </div>
                    )}
                    
                    {scanResult && (
                        <div className="text-center p-4">
                            <div className={`p-3 rounded-full mb-4 inline-block ${scanResult.success ? 'bg-green-600/30' : 'bg-red-600/30'}`}>
                               {scanResult.success ? <CheckIcon className="w-10 h-10 text-green-300"/> : <ExclamationTriangleIcon className="w-10 h-10 text-red-300"/>}
                            </div>
                            <p className={`font-semibold text-lg ${scanResult.success ? 'text-green-300' : 'text-red-300'}`}>
                               {scanResult.message}
                            </p>
                        </div>
                    )}
                </div>

                {!scanResult && !scannerError && (
                    <p className="text-center text-gray-400 text-sm mt-4">Visez le code-barres avec votre caméra.</p>
                )}
                
                <button onClick={onClose} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    Fermer
                </button>
            </div>
        </div>
    );
};


const DeliveryAgentDashboard: React.FC<DeliveryAgentDashboardProps> = ({ allOrders, allStores, allPickupPoints, onUpdateOrderStatus, onLogout }) => {
  const { user } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean, message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  
  const assignedOrders = useMemo(() => {
    if (!user) return [];
    return allOrders.filter(order => order.agentId === user.id)
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [allOrders, user]);

  const tasks = useMemo(() => {
    if (!user) return [];
    const taskList: { type: 'pickup' | 'dropoff' | 'delivery', order: Order, location: any }[] = [];

    assignedOrders.forEach(order => {
        if (order.status === 'ready-for-pickup') {
            const store = allStores.find(s => s.name === order.items[0].vendor);
            if (store && store.latitude && store.longitude) {
                taskList.push({ type: 'pickup', order, location: store });
            }
        } else if (order.status === 'picked-up' && order.deliveryMethod === 'pickup') {
            const depot = allPickupPoints.find(p => p.id === order.pickupPointId);
            if (depot && depot.latitude && depot.longitude) {
                taskList.push({ type: 'dropoff', order, location: depot });
            }
        } else if (order.status === 'at-depot' && order.deliveryMethod === 'home-delivery') {
            const { latitude, longitude } = order.shippingAddress;
            if (latitude && longitude) {
                taskList.push({ type: 'delivery', order, location: { latitude, longitude, name: order.shippingAddress.fullName, physicalAddress: order.shippingAddress.address } });
            }
        }
    });
    return taskList;
  }, [assignedOrders, allStores, allPickupPoints, user]);
  
  const ordersToPickup = assignedOrders.filter(o => o.status === 'ready-for-pickup');
  const ordersInProgress = assignedOrders.filter(o => ['picked-up', 'at-depot', 'out-for-delivery'].includes(o.status));
  const ordersCompleted = assignedOrders.filter(o => ['delivered', 'cancelled', 'refunded'].includes(o.status));

  useEffect(() => {
    if (viewMode === 'map' && mapContainerRef.current && !mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([3.95, 10.6], 7); // Center on Cameroon
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);
    }
    if (viewMode === 'map' && mapRef.current) {
        setTimeout(() => mapRef.current.invalidateSize(), 100);
    }
  }, [viewMode]);

  useEffect(() => {
      if (mapRef.current && viewMode === 'map') {
          mapRef.current.eachLayer((layer: any) => {
              if (layer instanceof L.Marker) mapRef.current.removeLayer(layer);
          });

          if (tasks.length > 0) {
            const markers: any[] = [];
            tasks.forEach(task => {
                const { type, order, location } = task;
                const colors = { pickup: '#16a34a', dropoff: '#2563eb', delivery: '#dc2626' };
                const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colors[type]}" class="w-8 h-8 drop-shadow-lg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`;
                const popupContent = `<b>${type.charAt(0).toUpperCase() + type.slice(1)}:</b> ${order.id}<br><b>${type === 'pickup' ? 'Boutique' : (type === 'dropoff' ? 'Dépôt' : 'Client')}:</b> ${location.name}<br>${location.physicalAddress || `${location.street}, ${location.neighborhood}`}`;

                const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
                const marker = L.marker([location.latitude, location.longitude], { icon }).addTo(mapRef.current).bindPopup(popupContent);
                markers.push(marker);
            });
            if (markers.length > 0) {
              const group = L.featureGroup(markers);
              mapRef.current.fitBounds(group.getBounds().pad(0.3));
            }
          }
      }
  }, [tasks, viewMode]);


  if (!user || user.role !== 'delivery_agent') {
    return <div className="p-8 text-center text-red-500">Accès non autorisé.</div>;
  }
  
  const handleScanSuccess = (decodedText: string) => {
    if (scanResult) return;

    const order = allOrders.find(o => o.id === decodedText || o.trackingNumber === decodedText);

    if (!order) {
        setScanResult({ success: false, message: "Code-barres inconnu. Colis non trouvé." });
        return;
    }

    if (order.agentId !== user?.id) {
        setScanResult({ success: false, message: "Ce colis ne vous est pas assigné." });
        return;
    }

    const action = getActionForOrder(order);

    if (!action) {
        const message = order.status === 'delivered' ? "Ce colis a déjà été livré." : "Aucune action disponible pour ce colis.";
        setScanResult({ success: false, message });
        return;
    }

    onUpdateOrderStatus(order.id, action.newStatus);
    setScanResult({ success: true, message: `Statut mis à jour: ${statusTranslations[action.newStatus]}` });
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
      const action = getActionForOrder(order);
      const sellerStore = allStores.find(s => s.name === order.items[0].vendor);
      const pickupPoint = order.deliveryMethod === 'pickup' ? allPickupPoints.find(p => p.id === order.pickupPointId) : null;
      
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3 flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Code à scanner:</p>
                     <p className="font-bold text-kmer-green tracking-wider bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md inline-block">{order.trackingNumber || order.id}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Statut: <span className="font-semibold">{statusTranslations[order.status]}</span></p>
                </div>
                 <p className="text-sm font-semibold dark:text-white">{order.total.toLocaleString('fr-CM')} FCFA</p>
            </div>
            
             <div className="text-sm text-gray-700 dark:text-gray-300 border-t dark:border-gray-700 pt-3 flex-grow">
                <p className="font-semibold">Client: {order.shippingAddress.fullName}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex items-start gap-2">
                    <BuildingStorefrontIcon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p><span className="font-semibold">Départ:</span> {sellerStore?.name || 'Inconnu'} ({sellerStore?.physicalAddress}, {sellerStore?.location})</p>
                        {sellerStore?.sellerPhone && <p className="font-mono text-xs text-gray-500 dark:text-gray-400">Tél: {sellerStore.sellerPhone}</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    {order.deliveryMethod === 'home-delivery' ? <TruckIcon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5"/> : <MapPinIcon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5"/>}
                    <p><span className="font-semibold">Arrivée:</span> {order.deliveryMethod === 'home-delivery' ? `${order.shippingAddress.address}, ${order.shippingAddress.city}` : `${pickupPoint?.name}, ${pickupPoint?.city}`}</p>
                  </div>
                </div>
            </div>
            
            {action && (
              <div className="border-t dark:border-gray-700 pt-3 text-center bg-kmer-yellow/10 dark:bg-kmer-yellow/20 p-2 rounded-b-md">
                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                  Action suivante : {action.text}
                </p>
              </div>
            )}
        </div>
      );
  }
  
  const OrderList: React.FC<{title: string, orders: Order[], icon: React.ReactNode}> = ({ title, orders, icon }) => (
    <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
          {icon}
          {title} ({orders.length})
        </h2>
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-4 rounded-lg">Aucune commande dans cette catégorie.</p>
        )}
    </div>
  );

  return (
    <>
      {isScannerOpen && (
        <ScannerModal
          onClose={() => {
              setIsScannerOpen(false);
              setScanResult(null);
          }}
          onScanSuccess={handleScanSuccess}
          scanResult={scanResult}
        />
      )}
      <div className="bg-gray-100 dark:bg-gray-900 min-h-[calc(100vh-100px)] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tableau de bord Livreur</h1>
              <div className="flex items-center gap-4">
                  <div className="bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm">
                      <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-sm font-semibold rounded-full flex items-center gap-1 ${viewMode === 'list' ? 'bg-kmer-green text-white' : 'text-gray-600 dark:text-gray-300'}`}><ListBulletIcon className="w-5 h-5"/> Liste</button>
                      <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 text-sm font-semibold rounded-full flex items-center gap-1 ${viewMode === 'map' ? 'bg-kmer-green text-white' : 'text-gray-600 dark:text-gray-300'}`}><MapIcon className="w-5 h-5"/> Carte</button>
                  </div>
                  <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <QrCodeIcon className="w-5 h-5" />
                    Scanner
                  </button>
                  <button onClick={onLogout} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Déconnexion</button>
              </div>
          </div>
            {viewMode === 'list' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <OrderList title="À Récupérer" orders={ordersToPickup} icon={<BuildingStorefrontIcon className="w-6 h-6 text-kmer-red"/>}/>
                    <OrderList title="En Cours" orders={ordersInProgress} icon={<TruckIcon className="w-6 h-6 text-blue-500"/>}/>
                    <OrderList title="Terminées" orders={ordersCompleted} icon={<CheckIcon className="w-6 h-6 text-kmer-green"/>}/>
                </div>
            ) : (
                <div ref={mapContainerRef} className="h-[70vh] w-full rounded-lg shadow-md bg-gray-200 dark:bg-gray-800" />
            )}
        </div>
      </div>
    </>
  );
};

export default DeliveryAgentDashboard;