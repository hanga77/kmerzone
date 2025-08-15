import React from 'react';
import { ArrowLeftIcon } from './Icons';

interface InfoPageProps {
  title: string;
  content: string;
  onBack: () => void;
}

const InfoPage: React.FC<InfoPageProps> = ({ title, content, onBack }) => {
  return (
    <div className="container mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour à l'accueil
      </button>
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{title}</h1>
        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
};

export default InfoPage;