
import React, { useEffect } from 'react';
import { CheckIcon } from './Icons';

interface OrderSuccessProps {
  onNavigateHome: () => void;
  onNavigateToOrders: () => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ onNavigateHome, onNavigateToOrders }) => {
  return (
    <div className="container mx-auto px-6 py-24 flex justify-center">
      <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-lg shadow-xl">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <CheckIcon className="h-12 w-12 text-kmer-green" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Commande passée avec succès !</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Merci pour votre achat. Vous recevrez bientôt une confirmation par SMS.
          Votre commande sera préparée et livrée dans les plus brefs délais.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onNavigateHome}
            className="bg-kmer-green text-white font-bold py-3 px-8 rounded-full hover:bg-green-700 transition-colors"
          >
            Retourner à l'accueil
          </button>
          <button
            onClick={onNavigateToOrders}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 px-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            Voir mes commandes
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;