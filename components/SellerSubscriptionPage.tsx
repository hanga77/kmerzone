import React from 'react';
import type { SiteSettings } from '../types';
import { CheckCircleIcon, StarIcon, StarPlatinumIcon, BuildingStorefrontIcon } from './Icons';

interface SellerSubscriptionPageProps {
  siteSettings: SiteSettings;
  onSelectSubscription: (status: 'standard' | 'premium' | 'super_premium') => void;
}

const PlanCard: React.FC<{
    title: string;
    description: string;
    price: string;
    icon: React.ReactNode;
    features: string[];
    onSelect: () => void;
    isFeatured?: boolean;
}> = ({ title, description, price, icon, features, onSelect, isFeatured }) => (
    <div className={`p-8 rounded-2xl shadow-lg flex flex-col border-2 ${isFeatured ? 'bg-kmer-green/5 dark:bg-kmer-green/10 border-kmer-green' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
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
        <button onClick={onSelect} className={`w-full font-bold py-3 mt-auto rounded-lg transition-colors ${isFeatured ? 'bg-kmer-green text-white hover:bg-green-700' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300'}`}>
            Choisir ce plan
        </button>
    </div>
);

const SellerSubscriptionPage: React.FC<SellerSubscriptionPageProps> = ({ siteSettings, onSelectSubscription }) => {

    const plans = [
        {
            title: 'Vendeur Standard',
            description: "Idéal pour les artisans et les petites boutiques qui débutent.",
            price: 'Gratuit',
            icon: <BuildingStorefrontIcon className="w-8 h-8 text-gray-500" />,
            features: [
                "Visibilité standard sur la plateforme",
                "Gestion de base du catalogue produits",
                "Support technique par email",
                "Statistiques sur les visites de la boutique"
            ],
            onSelect: () => onSelectSubscription('standard'),
            isFeatured: false,
        },
        {
            title: 'Vendeur Premium',
            description: "Pour les boutiques établies souhaitant accélérer leur croissance.",
            price: `${siteSettings.premiumPlan.price.toLocaleString('fr-CM')} FCFA / ${siteSettings.premiumPlan.durationDays} jrs`,
            icon: <StarIcon className="w-8 h-8 text-kmer-yellow" />,
            features: [
                "Tous les avantages Standard",
                "Mise en avant dans les catégories et suggestions",
                "Support technique plus rapide (chat, téléphone)",
                "Tarifs d'expédition réduits via nos partenaires",
                "Meilleure gestion du catalogue (plus d'images)",
                "Visibilité sur nos réseaux sociaux"
            ],
            onSelect: () => onSelectSubscription('premium'),
            isFeatured: true,
        },
        {
            title: 'Super Premium (Entreprise)',
            description: "Conçu pour les grandes entreprises et les marques reconnues.",
            price: `${siteSettings.superPremiumPlan.price.toLocaleString('fr-CM')} FCFA / ${siteSettings.superPremiumPlan.durationDays} jrs`,
            icon: <StarPlatinumIcon className="w-8 h-8 text-kmer-red" />,
            features: [
                "Tous les avantages Premium",
                "Visibilité maximale sur la page d'accueil",
                "Frais de commission réduits",
                "Assistance dédiée et résolution prioritaire des litiges",
                "Gestion avancée du catalogue (vidéos...)",
                "Intégration dans les contenus éditoriaux du site"
            ],
            onSelect: () => onSelectSubscription('super_premium'),
            isFeatured: false,
        }
    ];

    return (
        <div className="bg-gray-50 dark:bg-gray-900 py-12">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-4">Félicitations et bienvenue !</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">Votre boutique est presque prête. Choisissez le plan qui correspond le mieux à vos ambitions pour finaliser votre inscription.</p>
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
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SellerSubscriptionPage;