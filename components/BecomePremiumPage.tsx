import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, StarIcon, CheckCircleIcon, CurrencyDollarIcon, StarPlatinumIcon } from './Icons';
import type { SiteSettings } from '../types';

interface BecomePremiumPageProps {
  siteSettings: SiteSettings;
  onBack: () => void;
  onBecomePremiumByCaution: () => void;
  onUpgradeToPremiumPlus: () => void;
}

const BecomePremiumPage: React.FC<BecomePremiumPageProps> = ({ siteSettings, onBack, onBecomePremiumByCaution, onUpgradeToPremiumPlus }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <div className="p-8 text-center">Veuillez vous connecter pour voir cette page.</div>;
  }
  
  const { isPremiumProgramEnabled, premiumThresholds, premiumCautionAmount, isPremiumPlusEnabled, premiumPlusAnnualFee } = siteSettings;

  if (!isPremiumProgramEnabled) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Programme Premium</h1>
        <p className="text-gray-600 dark:text-gray-400">Le programme de fidélité n'est pas actif pour le moment. Revenez plus tard !</p>
        <button onClick={onBack} className="mt-6 bg-kmer-green text-white font-bold py-2 px-6 rounded-full">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const orderProgress = user.loyalty.orderCount;
  const spendingProgress = user.loyalty.totalSpent;
  const orderProgressPercent = Math.min((orderProgress / premiumThresholds.orders) * 100, 100);
  const spendingProgressPercent = Math.min((spendingProgress / premiumThresholds.spending) * 100, 100);

  const advantages = [
    "Badge Exclusif KMER Premium",
    "10% de réduction sur toutes les livraisons",
    "Accès anticipé aux ventes flash (bientôt !)",
    "Offres exclusives réservées aux membres",
    "Support client prioritaire"
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-[80vh]">
      <div className="container mx-auto px-6 py-12">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
          <ArrowLeftIcon className="w-5 h-5" />
          Retour
        </button>

        <div className="text-center">
            <StarIcon filled className="w-16 h-16 text-kmer-yellow mx-auto mb-4"/>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Devenez un Membre <span className="text-kmer-yellow">KMER Premium</span></h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">Rejoignez notre programme de fidélité exclusif et profitez d'avantages uniques sur toute la plateforme.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mt-12 max-w-5xl mx-auto">
            {/* Advantages */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Vos Avantages Premium</h2>
                <ul className="space-y-4">
                    {advantages.map((adv, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <CheckCircleIcon className="w-6 h-6 text-kmer-green flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{adv}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* How to become premium */}
            <div className="space-y-8">
                {/* Method 1: Loyalty */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Option 1 : Par la fidélité</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Devenez membre Premium automatiquement et gratuitement en atteignant les objectifs suivants :</p>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                                <span>Commandes passées</span>
                                <span>{orderProgress} / {premiumThresholds.orders}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                                <div className="bg-kmer-green h-2.5 rounded-full" style={{ width: `${orderProgressPercent}%` }}></div>
                            </div>
                        </div>
                        <div>
                             <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                                <span>Total dépensé</span>
                                <span>{spendingProgress.toLocaleString('fr-CM')} / {premiumThresholds.spending.toLocaleString('fr-CM')} FCFA</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                                <div className="bg-kmer-green h-2.5 rounded-full" style={{ width: `${spendingProgressPercent}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Method 2: Deposit */}
                 <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Option 2 : Accès Immédiat</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Ne patientez plus ! Obtenez le statut Premium instantanément en versant une caution unique.</p>
                     <button onClick={onBecomePremiumByCaution} className="w-full bg-kmer-yellow text-gray-900 font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-3 hover:bg-yellow-400 transition-colors">
                        <CurrencyDollarIcon className="w-6 h-6" />
                        Payer la caution de {premiumCautionAmount.toLocaleString('fr-CM')} FCFA
                     </button>
                </div>
            </div>

            {isPremiumPlusEnabled && (
              <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white p-8 rounded-lg shadow-lg lg:col-span-2">
                  <div className="flex items-center gap-4">
                      <StarPlatinumIcon className="w-10 h-10 text-gray-300"/>
                      <div>
                          <h3 className="text-2xl font-bold">Passez au niveau supérieur : <span className="text-gray-200">Premium+</span></h3>
                          <p className="text-sm text-gray-400">Pour les clients les plus exigeants.</p>
                      </div>
                  </div>
                  <ul className="my-6 space-y-3 text-gray-300">
                      <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" /><span>Tous les avantages Premium</span></li>
                      <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" /><span>Livraison <strong>GRATUITE</strong> sur toutes les commandes</span></li>
                      <li className="flex items-start gap-3"><CheckCircleIcon className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" /><span>Promotions exclusives supplémentaires</span></li>
                  </ul>
                  <button onClick={onUpgradeToPremiumPlus} className="w-full bg-gray-200 text-gray-900 font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-3 hover:bg-white transition-colors">
                      <StarPlatinumIcon className="w-6 h-6" />
                      Souscrire pour {premiumPlusAnnualFee.toLocaleString('fr-CM')} FCFA/an
                  </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BecomePremiumPage;