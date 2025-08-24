import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Order, OrderStatus, Store, PickupPoint, UserAvailabilityStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TruckIcon, MapPinIcon, BuildingStorefrontIcon, CheckIcon, ShoppingBagIcon, QrCodeIcon, XIcon, ExclamationTriangleIcon, MapIcon, ListBulletIcon, CheckCircleIcon } from './Icons';

declare const L: any; // Leaflet is loaded from a script tag in index.html
declare const Html5Qrcode: any;

interface DeliveryAgentDashboardProps {
  allOrders: Order[];
  allStores: Store[];
  allPickupPoints: PickupPoint[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
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
  'depot-issue': 'Problème au dépôt'
};

const getActionForOrder = (order: Order) => {
    switch (order.status) {
      case 'ready-for-pickup':
        return { text: 'Scanner la prise en charge', newStatus: 'picked-up' as OrderStatus };
      case 'picked-up':
        return null;
      case 'at-depot':
        if (order.deliveryMethod === 'home-delivery') {
          return { text: 'Scanner pour livraison', newStatus: 'out-for-delivery' as OrderStatus };
        }
        return null; 
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
        if (!Html5Qrcode) {
            console.error("Html5Qrcode library not loaded!");
            setScannerError("La bibliothèque de scan n'a pas pu être chargée. Veuillez rafraîchir la page.");
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
                               {scanResult.success ? <CheckCircleIcon className="w-10 h-10 text-green-300"/> : <ExclamationTriangleIcon className="w-10 h-10 text-red-300"/>}
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


const DeliveryAgentDashboard: React.FC<DeliveryAgentDashboardProps> = ({ allOrders, allStores, allPickupPoints, onUpdateOrderStatus, onLogout, onUpdateUserAvailability }) => {
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
    const taskList: { type: 'pickup' | 'dropoff' | 'delivery', order: Order, location: any, name: string }[] = [];
    
    assignedOrders.forEach(order => {
        // Pickup from store
        if (order.status === 'ready-for-pickup') {
            const store = allStores.find(s => s.name === order.items[0].vendor);
            if (store) {
                taskList.push({ type: 'pickup', order, location: { lat: store.latitude, lng: store.longitude, address: store.physicalAddress }, name: `Retrait chez ${store.name}` });
            }
        }
        // Dropoff at depot/pickup point or deliver to customer
        if (order.status === 'picked-up' || order.status === 'at-depot' || order.status === 'out-for-delivery') {
            if (order.deliveryMethod === 'pickup') {
                const point = allPickupPoints.find(p => p.id === order.pickupPointId);
                if (point) {
                    taskList.push({ type: 'dropoff', order, location: { lat: point.latitude, lng: point.longitude, address: `${point.name}, ${point.neighborhood}` }, name: `Dépôt à ${point.name}` });
                }
            } else {
                 taskList.push({ type: 'delivery', order, location: { lat: order.shippingAddress.latitude, lng: order.shippingAddress.longitude, address: order.shippingAddress.address }, name: `Livraison chez ${order.shippingAddress.fullName}` });
            }
        }
    });
    return taskList;
  }, [assignedOrders, allStores, allPickupPoints, user]);
  
  const deliveryMissions = useMemo(() => {
    return assignedOrders.map(order => {
        const store = allStores.find(s => s.name === order.items[0]?.vendor);
        const startPoint = (store && store.latitude && store.longitude) 
            ? { lat: store.latitude, lng: store.longitude, name: `Retrait: ${store.name}` }
            : null;

        let endPoint = null;
        if (order.deliveryMethod === 'home-delivery' && order.shippingAddress.latitude && order.shippingAddress.longitude) {
            endPoint = { lat: order.shippingAddress.latitude, lng: order.shippingAddress.longitude, name: `Livraison: ${order.shippingAddress.fullName}` };
        } else if (order.deliveryMethod === 'pickup') {
            const pickupPoint = allPickupPoints.find(p => p.id === order.pickupPointId);
            if (pickupPoint && pickupPoint.latitude && pickupPoint.longitude) {
                endPoint = { lat: pickupPoint.latitude, lng: pickupPoint.longitude, name: `Dépôt: ${pickupPoint.name}` };
            }
        }
        
        if (startPoint && endPoint) {
            return { order, startPoint, endPoint };
        }
        return null;
    }).filter((mission): mission is { order: Order; startPoint: any; endPoint: any; } => mission !== null);
  }, [assignedOrders, allStores, allPickupPoints]);


  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);

  const handleScanSuccess = (decodedText: string) => {
      if (scanResult) return;

      const orderToActOn = scannedOrder || assignedOrders.find(o => o.id === decodedText || o.trackingNumber === decodedText);

      if (!orderToActOn) {
          setScanResult({ success: false, message: "Code-barres inconnu ou commande non assignée." });
          return;
      }
      
      if (scannedOrder && scannedOrder.trackingNumber !== decodedText) {
          setScanResult({ success: false, message: `Code-barres incorrect. Attendu pour: ${scannedOrder.id}` });
          return;
      }

      const action = getActionForOrder(orderToActOn);
      if (action) {
          onUpdateOrderStatus(orderToActOn.id, action.newStatus);
          setScanResult({ success: true, message: `Statut de ${orderToActOn.id} mis à jour vers: ${statusTranslations[action.newStatus]}` });
      } else {
          setScanResult({ success: false, message: `Aucune action disponible pour le statut: ${statusTranslations[orderToActOn.status]}` });
      }
  };


  const closeScanner = () => {
    setIsScannerOpen(false);
    setScanResult(null);
    setScannedOrder(null);
  };
  
  // Map Initialization & Cleanup
  useEffect(() => {
    if (viewMode === 'map' && mapContainerRef.current && !mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([3.8480, 11.5021], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);
    } else if (viewMode !== 'map' && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
    }
    
    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, [viewMode]);

  // Drawing on Map
  useEffect(() => {
    if (mapRef.current && viewMode === 'map') {
        mapRef.current.eachLayer((layer: any) => { 
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                mapRef.current.removeLayer(layer);
            }
        });

        const greenIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        const redIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        const allPoints = [];

        deliveryMissions.forEach(mission => {
            const { startPoint, endPoint, order } = mission;
            const startLatLng = L.latLng(startPoint.lat, startPoint.lng);
            const endLatLng = L.latLng(endPoint.lat, endPoint.lng);

            L.marker(startLatLng, { icon: greenIcon }).addTo(mapRef.current)
                .bindPopup(`<b>${startPoint.name}</b><br>Commande: ${order.id}`);
            L.marker(endLatLng, { icon: redIcon }).addTo(mapRef.current)
                .bindPopup(`<b>${endPoint.name}</b><br>Commande: ${order.id}`);
            
            L.polyline([startLatLng, endLatLng], { color: '#003366', dashArray: '5, 10' }).addTo(mapRef.current);
            
            allPoints.push(startLatLng, endLatLng);
        });

        if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }
  }, [deliveryMissions, viewMode]);

  if (!user || user.role !== 'delivery_agent') {
    return <div className="p-8 text-center text-red-500">Accès non autorisé.</div>;
  }

  const handleAvailabilityToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus: UserAvailabilityStatus = e.target.checked ? 'available' : 'unavailable';
    onUpdateUserAvailability(user.id, newStatus);
  };
  
  return (
    <>
      {isScannerOpen && (
        <ScannerModal 
          onClose={closeScanner}
          onScanSuccess={handleScanSuccess}
          scanResult={scanResult}
        />
      )}
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de bord Livreur</h1>
                <p className="text-gray-500 dark:text-gray-400">Bienvenue, {user.name}</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2">
                    <label htmlFor="agent-availability-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="agent-availability-toggle"
                                className="sr-only peer"
                                checked={user.availabilityStatus === 'available'}
                                onChange={handleAvailabilityToggle}
                            />
                            <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full peer-checked:bg-kmer-green/70"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform transform peer-checked:translate-x-full"></div>
                        </div>
                    </label>
                    <span className={`font-bold text-lg ${user.availabilityStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                        {user.availabilityStatus === 'available' ? 'Disponible' : 'Indisponible'}
                    </span>
                 </div>
                 <button onClick={onLogout} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Déconnexion</button>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-kmer-green shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
                  <ListBulletIcon className="w-5 h-5 inline-block sm:hidden"/> <span className="hidden sm:inline">Liste</span>
                </button>
                <button onClick={() => setViewMode('map')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-gray-800 text-kmer-green shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
                  <MapIcon className="w-5 h-5 inline-block sm:hidden"/> <span className="hidden sm:inline">Carte</span>
                </button>
              </div>
              <button 
                onClick={() => {
                  setScannedOrder(null);
                  setIsScannerOpen(true);
                }}
                className="w-full sm:w-auto bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <QrCodeIcon className="w-5 h-5"/> Scanner un Colis
              </button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6">
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {tasks.length > 0 ? tasks.map((task, index) => {
                const action = getActionForOrder(task.order);
                return (
                  <div key={`${task.order.id}-${index}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${task.type === 'pickup' ? 'bg-green-100 dark:bg-green-900/50 text-green-600' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'}`}>
                        {task.type === 'pickup' ? <BuildingStorefrontIcon className="w-6 h-6"/> : <MapPinIcon className="w-6 h-6"/>}
                      </div>
                      <div>
                        <p className="font-bold text-lg dark:text-white">{task.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{task.order.id}</p>
                        <p className="text-sm dark:text-gray-300 mt-1">{task.location.address}</p>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto flex-shrink-0 text-right">
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.order.status === 'ready-for-pickup' ? 'bg-yellow-100 text-yellow-800' : (task.order.status === 'out-for-delivery' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800')}`}>
                          {statusTranslations[task.order.status]}
                       </span>
                       {action && (
                          <button 
                              onClick={() => { 
                                  setIsScannerOpen(true);
                                  setScannedOrder(task.order);
                              }}
                              className="mt-2 w-full sm:w-auto text-sm bg-kmer-green text-white font-semibold px-3 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                              <QrCodeIcon className="w-4 h-4"/> {action.text}
                          </button>
                       )}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <h2 className="text-2xl font-semibold mb-2 dark:text-white">Aucune tâche pour le moment.</h2>
                  <p className="text-gray-600 dark:text-gray-400">Vos courses et livraisons assignées apparaîtront ici.</p>
                </div>
              )}
            </div>
          ) : (
            <div ref={mapContainerRef} style={{ height: '70vh', width: '100%' }} className="rounded-lg shadow-md bg-gray-300 dark:bg-gray-700"></div>
          )}
        </main>
      </div>
    </>
  );
};

export default DeliveryAgentDashboard;