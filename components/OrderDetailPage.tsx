import React, { useState } from 'react';
import type { Order, OrderStatus, PickupPoint, TrackingEvent } from '../types';
import { ArrowLeftIcon, CheckIcon, TruckIcon, BuildingStorefrontIcon, ExclamationTriangleIcon, XIcon, ClockIcon } from './Icons';

interface OrderDetailPageProps {
  order: Order;
  onBack: () => void;
  allPickupPoints: PickupPoint[];
  onCancelOrder: (orderId: string) => void;
  onRequestRefund: (orderId: string, reason: string) => void;
}

const RefundRequestModal: React.FC<{
    onClose: () => void;
    onSubmit: (reason: string) => void;
}> = ({ onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    
    const handleSubmit = () => {
        if (!reason.trim()) {
            alert("Veuillez fournir un motif pour votre demande de remboursement.");
            return;
        }
        onSubmit(reason);
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <XIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold mb-4 dark:text-white">Demander un remboursement</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Veuillez décrire pourquoi le produit reçu ne correspond pas à vos attentes. Votre demande sera examinée par un administrateur.
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Ex: Le produit est arrivé endommagé, la couleur ne correspond pas à la photo..."
                />
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">Annuler</button>
                    <button onClick={handleSubmit} className="bg-kmer-red text-white px-4 py-2 rounded-md">Envoyer la demande</button>
                </div>
            </div>
        </div>
    );
}

const statusSteps: OrderStatus[] = ['confirmed', 'ready-for-pickup', 'picked-up', 'at-depot', 'out-for-delivery', 'delivered'];

const statusTranslations: Record<OrderStatus, { title: string, description: string }> = {
    confirmed: { title: 'Commande confirmée', description: 'La boutique prépare le colis.' },
    'ready-for-pickup': { title: 'Prêt pour expédition', description: "Le vendeur a préparé votre colis pour l'enlèvement." },
    'picked-up': { title: 'Colis pris en charge', description: 'Un transporteur a récupéré le colis.' },
    'at-depot': { 
      title: 'Arrivée au centre de destination', 
      description: '' // This will be dynamic based on delivery method in the main component
    },
    'out-for-delivery': { title: 'En cours de livraison', description: 'Le livreur est en route.' },
    delivered: { title: 'Livré', description: 'Votre colis a été remis.' },
    cancelled: { title: 'Annulé', description: 'Votre commande a été annulée.' },
    'refund-requested': { title: 'Remboursement demandé', description: 'Votre demande est en cours d\'examen.' },
    refunded: { title: 'Remboursé', description: 'Cette commande a été remboursée.' }
};


const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ order, onBack, allPickupPoints, onCancelOrder, onRequestRefund }) => {
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const currentStatusIndex = statusSteps.indexOf(order.status);
  const pickupPoint = order.deliveryMethod === 'pickup' ? allPickupPoints.find(p => p.id === order.pickupPointId) : null;

  const canCancel = ['confirmed', 'ready-for-pickup'].includes(order.status);
  const canRequestRefund = order.status === 'delivered';

  const handleRefundSubmit = (reason: string) => {
    onRequestRefund(order.id, reason);
    setIsRefundModalOpen(false);
  };
  
  statusTranslations['at-depot'].description = order.deliveryMethod === 'pickup' ? 'Votre colis est prêt pour le retrait.' : 'Prêt pour la distribution locale.';

  const getStepIcon = (step: OrderStatus) => {
    switch(step) {
      case 'out-for-delivery': return <TruckIcon className="w-6 h-6" />;
      case 'delivered': return <CheckIcon className="w-6 h-6" />;
      default: return <CheckIcon className="w-6 h-6" />;
    }
  }
  
  // Exclude 'out-for-delivery' for pickup orders
  const relevantStatusSteps = order.deliveryMethod === 'pickup' 
    ? statusSteps.filter(step => step !== 'out-for-delivery') 
    : statusSteps;

  return (
    <>
    {isRefundModalOpen && <RefundRequestModal onClose={() => setIsRefundModalOpen(false)} onSubmit={handleRefundSubmit} />}
    <div className="bg-gray-100 dark:bg-gray-950 min-h-[80vh] py-12">
      <div className="container mx-auto px-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
          <ArrowLeftIcon className="w-5 h-5" />
          Retour à l'historique
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b dark:border-gray-700 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Détails de la commande</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID: {order.id}</p>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0">
                <p className="text-sm text-gray-500 dark:text-gray-400">Commandé le {new Date(order.orderDate).toLocaleDateString('fr-FR')}</p>
                <p className="font-semibold dark:text-white">Total: {order.total.toLocaleString('fr-CM')} FCFA</p>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6 dark:text-white">Suivi de la commande</h2>
            {order.status === 'cancelled' ? (
                <div className="p-4 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-lg">
                    Cette commande a été annulée.
                </div>
            ) : order.status === 'refund-requested' ? (
                <div className="p-4 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-lg">
                    Votre demande de remboursement est en cours d'examen.
                </div>
            ) : order.status === 'refunded' ? (
                <div className="p-4 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg">
                    Cette commande a été remboursée.
                </div>
            ) : (
                <div className="flex justify-between items-start">
                  {relevantStatusSteps.map((step, index) => {
                    const stepIndexInOriginal = statusSteps.indexOf(step);
                    const isActive = stepIndexInOriginal <= currentStatusIndex;
                    const isCurrent = stepIndexInOriginal === currentStatusIndex;

                    return (
                      <div key={step} className="flex-1 text-center relative">
                        <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center border-2 ${isActive ? 'bg-kmer-green border-kmer-green text-white' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500'}`}>
                           {isActive ? getStepIcon(step) : null}
                        </div>
                        <p className={`mt-2 text-sm font-semibold ${isActive ? 'text-kmer-green' : 'text-gray-500 dark:text-gray-400'}`}>{statusTranslations[step].title}</p>
                        {isCurrent && <p className="text-xs text-gray-500 dark:text-gray-400 px-2">{statusTranslations[step].description}</p>}
                        
                        {index < relevantStatusSteps.length - 1 && (
                            <div className={`absolute top-5 left-1/2 w-full h-0.5 ${index < currentStatusIndex ? 'bg-kmer-green' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        )}
                      </div>
                    )
                  })}
                </div>
            )}
          </div>
          
          {order.trackingHistory && order.trackingHistory.length > 0 && (
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Historique détaillé du suivi</h2>
                <div className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                    <ul className="space-y-4">
                        {order.trackingHistory
                            .slice()
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((event, index) => (
                                <li key={index} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${index === 0 ? 'bg-kmer-green' : 'bg-gray-400 dark:bg-gray-500'}`}>
                                            <ClockIcon className="w-4 h-4" />
                                        </div>
                                        {index < order.trackingHistory.length - 1 && <div className="w-px flex-grow bg-gray-300 dark:bg-gray-600"></div>}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{statusTranslations[event.status].title}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{event.details}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(event.date).toLocaleString('fr-FR')} - <span className="font-medium">{event.location}</span></p>
                                    </div>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 border-t dark:border-gray-700 pt-6 mt-8">
            <div>
              <h3 className="font-semibold mb-4 dark:text-white">Articles commandés</h3>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img src={item.imageUrls[0]} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                    <div>
                      <p className="font-semibold dark:text-gray-200">{item.name}</p>
                      {item.selectedVariant && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {Object.entries(item.selectedVariant).map(([key, value]) => `${key}: ${value}`).join(' / ')}
                          </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity} x {(item.promotionPrice ?? item.price).toLocaleString('fr-CM')} FCFA</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
                {order.deliveryMethod === 'home-delivery' ? (
                  <div>
                    <h3 className="font-semibold mb-4 dark:text-white flex items-center gap-2"><TruckIcon className="w-5 h-5"/> Livraison à Domicile</h3>
                    <div className="text-gray-600 dark:text-gray-300 space-y-1">
                      <p className="font-bold">{order.shippingAddress.fullName}</p>
                      <p>{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                      <p>{order.shippingAddress.phone}</p>
                      {order.deliveryTimeSlot && <p className="font-medium text-kmer-green">Créneau: {order.deliveryTimeSlot}</p>}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-4 dark:text-white flex items-center gap-2"><BuildingStorefrontIcon className="w-5 h-5"/> Retrait en Point de Dépôt</h3>
                    {pickupPoint ? (
                      <div className="text-gray-600 dark:text-gray-300 space-y-1">
                        <p className="font-bold">{pickupPoint.name}</p>
                        <p>{pickupPoint.address}</p>
                        <p>{pickupPoint.city}</p>
                      </div>
                    ) : (
                      <p className="text-red-500">Information sur le point de dépôt non disponible.</p>
                    )}
                  </div>
                )}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-4">
            {canCancel && (
                <button
                    onClick={() => onCancelOrder(order.id)}
                    className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold py-2 px-6 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                >
                    <ExclamationTriangleIcon className="w-5 h-5"/>
                    Annuler la commande
                </button>
            )}
            {canRequestRefund && (
                <button
                    onClick={() => setIsRefundModalOpen(true)}
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 font-bold py-2 px-6 rounded-lg hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2"
                >
                    <ExclamationTriangleIcon className="w-5 h-5"/>
                    Demander un remboursement
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default OrderDetailPage;