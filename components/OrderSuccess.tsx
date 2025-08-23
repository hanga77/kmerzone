import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { Order } from '../types';
import { CheckIcon, QrCodeIcon, PrinterIcon } from './Icons';

interface OrderSuccessProps {
  order: Order;
  onNavigateHome: () => void;
  onNavigateToOrders: () => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ order, onNavigateHome, onNavigateToOrders }) => {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCodeRef.current && order.trackingNumber) {
      QRCode.toCanvas(qrCodeRef.current, order.trackingNumber, { width: 160 }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [order.trackingNumber]);
  
  const handlePrint = () => {
    window.print();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 flex justify-center">
      <div className="text-center bg-white dark:bg-gray-800 p-6 sm:p-12 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-green-100 mb-6">
          <CheckIcon className="h-10 w-10 sm:h-12 sm:w-12 text-kmer-green" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">Commande passée avec succès !</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Merci pour votre achat. Votre commande est confirmée et sera préparée pour expédition.
        </p>
        
        <div className="printable bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg p-6 my-8 text-left space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Récapitulatif</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Commande #{order.id}</p>
                    <p className="text-sm font-semibold text-kmer-green">Total: {order.total.toLocaleString('fr-CM')} FCFA</p>
                </div>
                <div className="text-center">
                    <canvas ref={qrCodeRef} className="rounded-lg shadow-sm mx-auto"></canvas>
                    <p className="text-sm font-semibold mt-2 dark:text-gray-200">N° de suivi:</p>
                    <p className="font-mono text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md inline-block">{order.trackingNumber}</p>
                </div>
            </div>
            <div>
                <h3 className="font-semibold dark:text-white">Livraison à:</h3>
                <address className="text-sm text-gray-600 dark:text-gray-300 not-italic">
                    {order.shippingAddress.fullName}<br/>
                    {order.shippingAddress.address}, {order.shippingAddress.city}<br/>
                    {order.shippingAddress.phone}
                </address>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onNavigateToOrders}
            className="w-full sm:w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 px-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            Voir mes commandes
          </button>
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto bg-kmer-green text-white font-bold py-3 px-6 rounded-full hover:bg-green-700 transition-colors"
          >
            Continuer mes achats
          </button>
        </div>
         <button onClick={handlePrint} className="mt-6 text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center justify-center gap-2 mx-auto">
            <PrinterIcon className="w-4 h-4" />
            Imprimer le reçu
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;