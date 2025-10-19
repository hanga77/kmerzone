import React from 'react';
import type { User, Order, Store } from '../../types';
import { StarIcon, StarPlatinumIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={className}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{title}</h2>
        {children}
    </div>
);

export const DashboardTab: React.FC<{ user: User; userOrders: Order[]; allStores: Store[], onTabChange: (tab: string) => void; onSelectOrder: (order: Order) => void; }> = ({ user, userOrders, allStores, onTabChange, onSelectOrder }) => {
    const { t } = useLanguage();
    const lastOrder = userOrders.length > 0 ? userOrders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0] : null;
    const followedStores = allStores.filter(s => user.followedStores?.includes(s.id));
    
    return (
        <Section title={t('accountPage.welcome', user.name)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">{t('accountPage.loyaltyStatus')}</h3>
                    <div className="flex items-center gap-2">
                         {user.loyalty.status === 'premium' && <StarIcon className="w-6 h-6 text-kmer-yellow" />}
                         {user.loyalty.status === 'premium_plus' && <StarPlatinumIcon className="w-6 h-6 text-kmer-red" />}
                        <p>{t('accountPage.loyaltyMember', t(`loyaltyStatus.${user.loyalty.status}`))} </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{t('accountPage.totalOrders')}: {user.loyalty.orderCount}</p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">{t('accountPage.lastOrder')}</h3>
                    {lastOrder ? (
                        <>
                            <p>ID: <span className="font-mono text-sm">{lastOrder.id}</span></p>
                            <p>{t('common.status')}: {t(`orderStatus.${lastOrder.status}`)}</p>
                            <button onClick={() => onSelectOrder(lastOrder)} className="text-sm text-kmer-green font-semibold mt-2">{t('accountPage.viewDetails')}</button>
                        </>
                    ) : <p>{t('accountPage.noRecentOrder')}</p>}
                </div>
                <div className="md:col-span-2 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-bold text-lg mb-4">{t('accountPage.followedStoresTitle')}</h3>
                     {followedStores.length > 0 ? (
                        <div className="flex flex-wrap gap-4">
                            {followedStores.slice(0, 5).map(s => (
                                <div key={s.id} className="text-center">
                                    <img src={s.logoUrl} alt={s.name} className="w-16 h-16 rounded-full object-contain bg-white shadow-md"/>
                                    <p className="text-xs mt-1 w-16 truncate">{s.name}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p>{t('accountPage.noFollowedStores')}</p>}
                    <button onClick={() => onTabChange('followed-stores')} className="text-sm text-kmer-green font-semibold mt-4">{t('accountPage.manageStores')}</button>
                </div>
            </div>
        </Section>
    );
};
