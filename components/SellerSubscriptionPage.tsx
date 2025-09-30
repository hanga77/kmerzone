import React from 'react';
import type { SiteSettings } from '../types';
import { CheckCircleIcon, StarIcon, StarPlatinumIcon, BuildingStorefrontIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

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
}> = ({ title, description, price, icon, features, onSelect, isFeatured }) => {
    const { t } = useLanguage();
    return (
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
                {t('sellerSubscription.selectPlan')}
            </button>
        </div>
    );
};

const SellerSubscriptionPage: React.FC<SellerSubscriptionPageProps> = ({ siteSettings, onSelectSubscription }) => {
    const { t } = useLanguage();

    const plans = [
        {
            title: t('sellerSubscription.standardTitle'),
            description: t('sellerSubscription.standardDescription'),
            price: `${siteSettings.standardPlan.price.toLocaleString('fr-CM')} FCFA / ${siteSettings.standardPlan.durationDays} jrs`,
            icon: <BuildingStorefrontIcon className="w-8 h-8 text-gray-500" />,
            features: t('sellerSubscription.standardFeatures', siteSettings.standardPlan.productLimit, siteSettings.standardPlan.commissionRate).split('|'),
            onSelect: () => onSelectSubscription('standard'),
            isFeatured: false,
        },
        {
            title: t('sellerSubscription.premiumTitle'),
            description: t('sellerSubscription.premiumDescription'),
            price: `${siteSettings.premiumPlan.price.toLocaleString('fr-CM')} FCFA / ${siteSettings.premiumPlan.durationDays} jrs`,
            icon: <StarIcon className="w-8 h-8 text-kmer-yellow" />,
            features: t('sellerSubscription.premiumFeatures', siteSettings.premiumPlan.productLimit, siteSettings.premiumPlan.commissionRate).split('|'),
            onSelect: () => onSelectSubscription('premium'),
            isFeatured: true,
        },
        {
            title: t('sellerSubscription.superPremiumTitle'),
            description: t('sellerSubscription.superPremiumDescription'),
            price: `${siteSettings.superPremiumPlan.price.toLocaleString('fr-CM')} FCFA / ${siteSettings.superPremiumPlan.durationDays} jrs`,
            icon: <StarPlatinumIcon className="w-8 h-8 text-kmer-red" />,
            features: t('sellerSubscription.superPremiumFeatures', siteSettings.superPremiumPlan.productLimit, siteSettings.superPremiumPlan.commissionRate).split('|'),
            onSelect: () => onSelectSubscription('super_premium'),
            isFeatured: false,
        }
    ];

    return (
        <div className="bg-gray-50 dark:bg-gray-900 py-12">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-4">{t('sellerSubscription.title')}</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">{t('sellerSubscription.subtitle')}</p>
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
