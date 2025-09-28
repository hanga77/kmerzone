import React from 'react';
import type { SiteSettings, Store } from '../../types';
import { CheckCircleIcon, StarIcon, StarPlatinumIcon, BuildingStorefrontIcon } from '../Icons';

interface SubscriptionPanelProps {
  store: Store;
  siteSettings: SiteSettings;
  onUpgrade: (level: 'premium' | 'super_premium') => void;
}

const PlanCard: React.FC<{
    title: string;
    description: string;
    price: string;
    icon: React.ReactNode;
    features: string[];
    onSelect: () => void;
    isFeatured?: boolean;
    isCurrent?: boolean;
    isDisabled?: boolean;
}> = ({ title, description, price, icon, features, onSelect, isFeatured, isCurrent, isDisabled }) => (
    <div className={`p-8 rounded-2xl shadow-lg flex flex-col border-2 ${isCurrent ? 'bg-green-50 dark:bg-green-900/20 border-kmer-green' : isFeatured ? 'bg-kmer-yellow/5 dark:bg-kmer-yellow/10 border-kmer-yellow' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
        <div className="flex items-center gap-3 mb-4">
            {icon}
            <h3 className="text-2xl font-bold">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">{description}</p>
        <p className="text-4xl font-extrabold mb-6">{price}</p>
        <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <div className="mt-auto">
            {isCurrent ? (
                <div className="text-center font-bold text-kmer-green p-3 rounded-lg bg-kmer-green/10">
                    <CheckCircleIcon className="w-6 h-6 mx-auto mb-2" />
                    Votre plan actuel
                </div>
            ) : (
                <button 
                    onClick={onSelect} 
                    disabled={isDisabled}
                    className={`w-full font-bold py-3 rounded-lg transition-colors ${
                        isDisabled 
                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
                            : isFeatured 
                                ? 'bg-kmer-yellow text-gray-900 hover:bg-yellow-300' 
                                : 'bg-kmer-green text-white hover:bg-green-700'
                    }`}
                >
                    {isDisabled ? 'Plan inférieur' : 'Mettre à niveau'}
                </button>
            )}
        </div>
    </div>
);

const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({ store, siteSettings, onUpgrade }) => {

    const currentStatus = store.premiumStatus;

    const plans = [
        {
            title: 'Vendeur Standard',
            status: 'standard',
            description: "Idéal pour les artisans et les petites boutiques qui débutent.",
            price: 'Gratuit',
            icon: <BuildingStorefrontIcon className="w-8 h-8 text-gray-500" />,
            features: [
                "Visibilité standard sur la plateforme",
                `Limite de ${siteSettings.commissionRate}% de commission`,
                "Support technique par email",
            ],
            onSelect: () => {},
            isFeatured: false,
        },
        {
            title: 'Vendeur Premium',
            status: 'premium',
            description: "Pour les boutiques établies souhaitant accélérer leur croissance.",
            price: `${siteSettings.premiumPlan.price.toLocaleString('fr-CM')} FCFA / ${siteSettings.premiumPlan.durationDays} jrs`,
            icon: <StarIcon className="w-8 h-8 text-kmer-yellow" />,
            features: [
                `Limite de ${siteSettings.premiumPlan.productLimit} produits`,
                `Commission réduite à ${siteSettings.premiumPlan.commissionRate}%`,
                "Mise en avant dans les catégories",
                "Support technique plus rapide",
                "Gestion de la livraison",
            ],
            onSelect: () => onUpgrade('premium'),
            isFeatured: true,
        },
        {
            title: 'Super Premium',
            status: 'super_premium',
            description: "Conçu pour les grandes entreprises et les marques reconnues.",
            price: `${siteSettings.superPremiumPlan.price.toLocaleString('fr-CM')} FCFA / ${siteSettings.superPremiumPlan.durationDays} jrs`,
            icon: <StarPlatinumIcon className="w-8 h-8 text-kmer-red" />,
            features: [
                `Limite de ${siteSettings.superPremiumPlan.productLimit} produits`,
                `Commission réduite à ${siteSettings.superPremiumPlan.commissionRate}%`,
                "Visibilité maximale sur la page d'accueil",
                "Assistance dédiée",
                `${siteSettings.superPremiumPlan.photoServiceIncluded ? 'Service photo inclus' : ''}`,
            ],
            onSelect: () => onUpgrade('super_premium'),
            isFeatured: false,
        }
    ];

    const planHierarchy = {
        'standard': 0,
        'premium': 1,
        'super_premium': 2,
    };

    return (
        <div className="p-6">
             <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">Gérez votre abonnement</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">Passez à un plan supérieur pour débloquer de nouvelles fonctionnalités et booster vos ventes.</p>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan, index) => (
                    <PlanCard
                        key={index}
                        title={plan.title}
                        description={plan.description}
                        price={plan.price}
                        icon={plan.icon}
                        features={plan.features}
                        onSelect={plan.onSelect}
                        isFeatured={plan.isFeatured}
                        isCurrent={currentStatus === plan.status}
                        isDisabled={plan.status !== 'standard' && planHierarchy[currentStatus] >= planHierarchy[plan.status as 'standard' | 'premium' | 'super_premium']}
                    />
                ))}
            </div>
        </div>
    );
};

export default SubscriptionPanel;
