import React from 'react';
import { ArrowLeftIcon, Cog8ToothIcon } from './Icons';

interface ServerErrorPageProps {
  onNavigateHome: () => void;
}

const ServerErrorPage: React.FC<ServerErrorPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="container mx-auto px-6 py-24 flex justify-center text-center">
      <div className="max-w-md">
        <Cog8ToothIcon className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-spin" />
        <h1 className="text-6xl font-bold text-blue-500">500</h1>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">Erreur Interne</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          Oups ! Quelque chose s'est mal passé de notre côté. Notre équipe technique a été notifiée. Veuillez réessayer plus tard.
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

export default ServerErrorPage;