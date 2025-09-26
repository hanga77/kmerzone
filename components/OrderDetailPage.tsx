import React, { useState, useEffect, useRef } from 'react';
import type { Order, OrderStatus, PickupPoint, DisputeMessage, User } from '../types';
import { ArrowLeftIcon, CheckIcon, TruckIcon, ExclamationTriangleIcon, XIcon, QrCodeIcon, PrinterIcon, PhotoIcon, TrashIcon, PaperAirplaneIcon } from './Icons';

declare const QRCode: any;

interface OrderDetailPageProps {
  order: Order;
  onBack: () => void;
  allPickupPoints: PickupPoint[];
  allUsers: User[];
  onCancelOrder: (orderId: string) => void;
  onRequestRefund: (orderId: string, reason: string, evidenceUrls: string[]) => void;
  onCustomerDisputeMessage: (orderId: string, message: string) => void;
}

const RefundRequestModal: React.FC<{
    onClose: () => void;
    onSubmit: (reason: string, evidenceUrls: string[]) => void;
}> = ({ onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [evidence, setEvidence] = useState<string[]>([]); // To store data URLs
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (evidence.length + files.length > 5) {
                alert("Vous pouvez télécharger jusqu'à 5 fichiers.");
                return;
            }
            files.forEach((file: Blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setEvidence(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };
    
    const removeEvidence = (index: number) => {
        setEvidence(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert("Veuillez fournir un motif pour votre demande de remboursement.");
            return;
        }
        onSubmit(reason, evidence);
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <XIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold mb-4 dark:text-white">Demander un remboursement</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Veuillez décrire pourquoi le produit reçu ne correspond pas à vos attentes. Votre demande sera examinée par un administrateur.
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motif de la demande</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Ex: Le produit est arrivé endommagé, la couleur ne correspond pas à la photo..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ajouter des preuves (photos, vidéos...)</label>
                        <div className="mt-1 flex items-center gap-4">
                            <label htmlFor="evidence-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
                                <PhotoIcon className="w-5 h-5"/>
                                Choisir des fichiers
                            </label>
                            <input id="evidence-upload" name="evidence-upload" type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/*,video/*" />
                        </div>
                        {evidence.length > 0 && (
                            <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {evidence.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <img src={url} alt={`Preview ${i}`} className="h-20 w-full object-cover rounded-md"/>
                                        <button onClick={() => removeEvidence(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

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
    refunded: { title: 'Remboursé', description: 'Cette commande a été remboursée.' },
    returned: { title: 'Retourné', description: 'Le colis a été retourné.' },
    'depot-issue': { title: 'Problème au dépôt', description: 'Un problème a été signalé avec votre colis au dépôt.' },
    'delivery-failed': { title: 'Échec de livraison', description: 'Un problème est survenu lors de la livraison.' },
};


const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ order, onBack, allPickupPoints, allUsers, onCancelOrder, onRequestRefund, onCustomerDisputeMessage }) => {
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const currentStatusIndex = statusSteps.indexOf(order.status);
  
  const pickupPoint = order.deliveryMethod === 'pickup' ? allPickupPoints.find(p => p.id === order.pickupPointId) : null;
  const deliveryAgent = order.deliveryMethod === 'home-delivery' && order.agentId ? allUsers.find(u => u.id === order.agentId) : null;

  const canCancel = ['confirmed', 'ready-for-pickup'].includes(order.status);
  const canRequestRefund = order.status === 'delivered';

  useEffect(() => {
    if (qrCodeRef.current && order.trackingNumber && typeof QRCode !== 'undefined') {
      QRCode.toCanvas(qrCodeRef.current, order.trackingNumber, { width: 128 }, (error: any) => {
        if (error) console.error(error);
      });
    }
  }, [order.trackingNumber]);

  const handleRefundSubmit = (reason: string, evidenceUrls: string[]) => {
    onRequestRefund(order.id, reason, evidenceUrls);
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
  
  const relevantStatusSteps = order.deliveryMethod === 'pickup' 
    ? statusSteps.filter(step => step !== 'out-for-delivery') 
    : statusSteps;
    
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    {isRefundModalOpen && <RefundRequestModal onClose={() => setIsRefundModalOpen(false)} onSubmit={handleRefundSubmit} />}
    <div className="bg-gray-100 dark:bg-gray-950 min-h-[80vh] py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-8 no-print">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold">
              <ArrowLeftIcon className="w-5 h-5" />
              Retour à l'historique
            </button>
             <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                <PrinterIcon className="w-5 h-5"/> Imprimer la facture
            </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 printable">
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
            {['cancelled', 'refund-requested', 'refunded', 'depot-issue', 'delivery-failed'].includes(order.status) ? (
                <div className={`p-4 rounded-lg ${
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                    order.status === 'refund-requested' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                    order.status === 'depot-issue' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold' :
                    order.status === 'delivery-failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold' :
                    'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                    {statusTranslations[order.status].title}
                    {order.status === 'depot-issue' && <p className="font-normal mt-1">{order.discrepancy?.reason}</p>}
                    {order.status === 'delivery-failed' && <p className="font-normal mt-1">{order.deliveryFailureReason?.reason}: {order.deliveryFailureReason?.details}</p>}
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  {relevantStatusSteps.map((step, index) => {
                    const stepIndexInOriginal = statusSteps.indexOf(step);
                    const isActive = stepIndexInOriginal <= currentStatusIndex;
                    const isCurrent = stepIndexInOriginal === currentStatusIndex;

                    return (
                      <div key={step} className="flex sm:flex-col sm:flex-1 items-center text-center relative w-full sm:w-auto mb-6 sm:mb-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10 ${isActive ? 'bg-kmer-green border-kmer-green text-white' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500'}`}>
                           {isActive ? getStepIcon(step) : <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>}
                        </div>
                        <div className="ml-4 sm:ml-0 sm:mt-2 text-left sm:text-center">
                          <p className={`text-sm font-semibold ${isActive ? 'text-kmer-green' : 'text-gray-500 dark:text-gray-400'}`}>{statusTranslations[step].title}</p>
                          {isCurrent && <p className="text-xs text-gray-500 dark:text-gray-400 px-2">{statusTranslations[step].description}</p>}
                        </div>
                        
                        {index < relevantStatusSteps.length - 1 && (
                            <div className={`absolute left-5 sm:left-1/2 top-10 sm:top-5 h-full sm:h-0.5 w-0.5 sm:w-full ${index < currentStatusIndex ? 'bg-kmer-green' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        )}
                      </div>
                    )
                  })}
                </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 border-t dark:border-gray-700 pt-6 mt-8">
            <div>
                <h3 className="font-semibold mb-4 dark:text-white">Historique des statuts</h3>
                <div className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 max-h-48 overflow-y-auto">
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        {(order.statusChangeLog || []).map((log, index) => (
                            <li key={index}>
                                <span className="font-semibold">{new Date(log.date).toLocaleString('fr-FR')}:</span> {statusTranslations[log.status].title} <span className="text-xs text-gray-400">(par {log.changedBy})</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 dark:text-white flex items-center gap-2"><QrCodeIcon className="w-5 h-5"/> Suivi par QR Code</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <canvas ref={qrCodeRef} className="rounded-lg shadow-sm"></canvas>
                  <div>
                    <p className="text-sm font-semibold dark:text-gray-200">Numéro de suivi :</p>
                    <p className="font-mono text-lg bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md inline-block">{order.trackingNumber}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Utilisez ce code pour le suivi auprès de nos agents.</p>
                  </div>
              </div>
            </div>
          </div>
          
          {order.disputeLog && order.disputeLog.length > 0 && (
            <div className="border-t dark:border-gray-700 pt-6 mt-8">
                <h3 className="font-semibold mb-4 dark:text-white">Discussion sur le litige</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                        {order.disputeLog.map((msg, i) => {
                            const isMe = msg.author === 'customer';
                            const authorName = msg.author.charAt(0).toUpperCase() + msg.author.slice(1);
                            return (
                               <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md p-3 rounded-xl text-sm ${isMe ? 'bg-kmer-green text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <p className="font-bold mb-1">{isMe ? 'Vous' : authorName}</p>
                                    <p>{msg.message}</p>
                                    <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.date).toLocaleTimeString('fr-FR')}</p>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                    <form onSubmit={e => { e.preventDefault(); const input = (e.target as any).message; onCustomerDisputeMessage(order.id, input.value); input.value=''; }}>
                        <div className="flex gap-2">
                            <input name="message" placeholder="Envoyer un message..." className="flex-grow text-sm p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            <button type="submit" className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"><PaperAirplaneIcon className="w-5 h-5"/></button>
                        </div>
                    </form>
                </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 border-t dark:border-gray-700 pt-6 mt-8">
            <div>
              <h3 className="font-semibold mb-2 dark:text-white">Adresse de Livraison</h3>
              <address className="not-italic text-gray-600 dark:text-gray-300">
                {order.shippingAddress.fullName}<br/>
                {order.shippingAddress.address}<br/>
                {order.shippingAddress.city}<br/>
                {order.shippingAddress.phone}
              </address>
              {order.deliveryMethod === 'pickup' && pickupPoint && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                  <p className="font-bold text-sm text-blue-800 dark:text-blue-200">Point de retrait:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{pickupPoint.name}, {pickupPoint.neighborhood}</p>
                </div>
              )}
               {deliveryAgent && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/50 rounded-lg">
                  <p className="font-bold text-sm text-green-800 dark:text-green-200">Votre livreur:</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{deliveryAgent.name}</p>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2 dark:text-white">Articles</h3>
              <ul className="space-y-2">
                {order.items.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-sm">
                    <span className="dark:text-gray-300">{item.name} x {item.quantity}</span>
                    <span className="font-semibold dark:text-white">{(item.promotionPrice ?? item.price).toLocaleString('fr-CM')} FCFA</span>
                  </li>
                ))}
              </ul>
              <div className="border-t dark:border-gray-700 mt-4 pt-4">
                 <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{order.subtotal.toLocaleString('fr-CM')} FCFA</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span>Livraison</span>
                    <span>{order.deliveryFee.toLocaleString('fr-CM')} FCFA</span>
                 </div>
                 <div className="flex justify-between font-bold mt-2">
                    <span>Total</span>
                    <span>{order.total.toLocaleString('fr-CM')} FCFA</span>
                 </div>
              </div>
            </div>
          </div>
          
           <div className="mt-8 pt-6 border-t dark:border-gray-700 flex flex-col sm:flex-row gap-4 no-print">
              {canRequestRefund && (
                 <button onClick={() => setIsRefundModalOpen(true)} className="flex-1 w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2">
                     <ExclamationTriangleIcon className="w-5 h-5"/> Demander un remboursement
                 </button>
              )}
              {canCancel && (
                 <button onClick={() => onCancelOrder(order.id)} className="flex-1 w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2">
                     <XIcon className="w-5 h-5"/> Annuler la commande
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