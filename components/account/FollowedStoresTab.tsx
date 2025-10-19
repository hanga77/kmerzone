import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Store } from '../../types';
import StoreCard from '../StoreCard';
import { Section } from './common';

export const FollowedStoresTab: React.FC<{ allStores: Store[]; onVendorClick: (vendorName: string) => void }> = ({ allStores, onVendorClick }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const followedStores = allStores.filter(s => user?.followedStores?.includes(s.id));
    
    return (
        <Section title={t('accountPage.followedStores')}>
             {followedStores.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {followedStores.map(s => <StoreCard key={s.id} store={s} onVisitStore={onVendorClick} />)}
                </div>
            ) : <p>{t('accountPage.noFollowedStores')}</p>}
        </Section>
    );
};
