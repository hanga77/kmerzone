import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { SiteSettings } from '../types';
import { ArrowLeftIcon, StarIcon, StarPlatinumIcon, ShieldCheckIcon, CheckCircleIcon } from './Icons';

interface BecomePremiumPageProps {
  siteSettings: SiteSettings;
  onBack: () => void;
  onBecomePremiumByCaution: () => void;
  onUpgradeToPremiumPlus: () => void;
}

const ProgressBar: React.FC<{ value: number; max: number; label: string }> = ({ value, max, label }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{value.toLocaleString('fr-CM')} / {max.toLocaleString('fr-CM')}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-kmer-green h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const BecomePremiumPage: React.FC<BecomePremiumPageProps> = ({ siteSettings, onBack, onBecomePremiumByCaution, onUpgradeToPremiumPlus }) => {
  const { user } = useAuth();
  if (!user) return null;

  const loyalty = user.loyalty;
  const loyaltySettings = siteSettings.customerLoyaltyProgram;
  
  const BenefitItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start gap-2">
      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
          <ArrowLeftIcon className="w-5 h-5" />
          Retour
        </button>

        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-4">Débloquez des Avantages Exclusifs</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Passez au niveau supérieur avec nos statuts Premium et Premium+ pour une expérience d'achat inégalée.</p>
        </div>

        <div className="max-w-xl mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Votre Statut Actuel : <span className="capitalize text-kmer-green">{loyalty.status.replace('_', '+')}</span></h2>
          {loyalty.status === 'standard' && loyaltySettings.isEnabled && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Atteignez le statut Premium en réalisant l'un des objectifs suivants :</p>
              <ProgressBar value={loyalty.orderCount} max={loyaltySettings.premium.thresholds.orders} label="Commandes passées" />
              <ProgressBar value={loyalty.totalSpent} max={loyaltySettings.premium.thresholds.spending} label="Total dépensé (FCFA)" />
            </div>
          )}
           {loyalty.status === 'premium' && <p className="text-gray-600 dark:text-gray-300">Félicitations ! Vous profitez déjà des avantages Premium.</p>}
           {loyalty.status === 'premium_plus' && <p className="text-gray-600 dark:text-gray-300">Merci d'être un membre Premium+ ! Vous bénéficiez de nos meilleurs avantages.</p>}
        </div>

        {loyaltySettings.isEnabled && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            <div className={`p-8 rounded-2xl shadow-lg flex flex-col ${loyalty.status === 'premium' || loyalty.status === 'premium_plus' ? 'bg-green-50 dark:bg-green-900/20 border-2 border-kmer-green' : 'bg-white dark:bg-gray-800'}`}>
              <div className="flex items-center gap-3 mb-4">
                <StarIcon className="w-8 h-8 text-kmer-yellow" />
                <h3 className="text-2xl font-bold">Premium</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">Idéal pour les acheteurs réguliers qui veulent plus d'avantages.</p>
              <ul className="space-y-3 mb-8">
                {loyaltySettings.premium.benefits.map((b, i) => <BenefitItem key={i}>{b}</BenefitItem>)}
              </ul>
              <div className="mt-auto">
                {loyalty.status === 'standard' && (
                  <button onClick={onBecomePremiumByCaution} className="w-full bg-kmer-yellow text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-300 transition-colors">
                    Payer la caution pour devenir Premium
                    <span className="block text-xs font-normal">Caution de {loyaltySettings.premium.cautionAmount.toLocaleString('fr-CM')} FCFA</span>
                  </button>
                )}
                {loyalty.status === 'premium' && (
                  <div className="text-center font-bold text-kmer-green p-3 rounded-lg bg-kmer-green/10">
                    <CheckCircleIcon className="w-6 h-6 mx-auto mb-2" />
                    Vous êtes déjà Premium
                  </div>
                )}
                {loyalty.status === 'premium_plus' && (
                  <div className="text-center font-bold text-gray-500 p-3">
                      Statut déjà atteint
                  </div>
                )}
              </div>
            </div>
            
            {loyaltySettings.premiumPlus.isEnabled && (
              <div className="p-8 rounded-2xl shadow-lg flex flex-col bg-gray-900 text-white border-2 border-kmer-red">
                <div className="flex items-center gap-3 mb-4">
                  <StarPlatinumIcon className="w-8 h-8 text-kmer-red" />
                  <h3 className="text-2xl font-bold">Premium+</h3>
                </div>
                <p className="text-gray-300 mb-6 flex-grow">L'expérience ultime pour nos clients les plus fidèles.</p>
                <ul className="space-y-3 mb-8">
                  {loyaltySettings.premiumPlus.benefits.map((b, i) => <BenefitItem key={i}>{b}</BenefitItem>)}
                </ul>
                <div className="mt-auto">
                  {loyalty.status !== 'premium_plus' && (
                    <button onClick={onUpgradeToPremiumPlus} className="w-full bg-kmer-red text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors">
                      {loyalty.status === 'premium' ? 'Payer pour passer à Premium+' : 'Payer pour devenir Premium+'}
                      <span className="block text-xs font-normal">{loyaltySettings.premiumPlus.annualFee.toLocaleString('fr-CM')} FCFA / an</span>
                    </button>
                  )}
                  {loyalty.status === 'premium_plus' && (
                  <div className="text-center font-bold text-kmer-red p-3 rounded-lg bg-kmer-red/10">
                    <CheckCircleIcon className="w-6 h-6 mx-auto mb-2" />
                    Vous êtes un membre Premium+
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BecomePremiumPage;