import React from 'react';
import { ArrowLeftIcon, ExclamationTriangleIcon } from './Icons';

interface ForbiddenPageProps {
  onNavigateHome: () => void;
}

const ForbiddenPage: React.FC<ForbiddenPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="container mx-auto px-6 py-24 flex justify-center text-center">
      <div className="max-w-md">
        <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-red-500">403</h1>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">Accès Refusé</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          Désolé, vous n'avez pas les autorisations nécessaires pour accéder à cette page.
        </p>
        <button
          onClick={onNavigateHome}
          className="mt-8 bg-kmer-green text-white font-bold py-3 px-8 rounded-full hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Retourner à l'accueil
        </button>
      </div>
    </div>
  );
};

export default ForbiddenPage;