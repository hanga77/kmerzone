import React from 'react';
import { ArrowLeftIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface NotFoundPageProps {
  onNavigateHome: () => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigateHome }) => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-6 py-24 flex justify-center text-center">
      <div className="max-w-md">
        <h1 className="text-6xl font-bold text-kmer-green">404</h1>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">{t('notFound.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          {t('notFound.description')}
        </p>
        <button
          onClick={onNavigateHome}
          className="mt-8 bg-kmer-green text-white font-bold py-3 px-8 rounded-full hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          {t('notFound.backHome')}
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
