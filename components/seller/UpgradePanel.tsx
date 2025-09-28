import React from 'react';
import type { Store, SiteSettings } from '../../types';
import { StarIcon } from '../Icons';

interface UpgradePanelProps {
    store: Store;
    siteSettings: SiteSettings;
    onRequestUpgrade: (storeId: string, level: 'premium' | 'super_premium') => void;
    featureName: string;
}

const UpgradePanel: React.FC<UpgradePanelProps> = ({ store, siteSettings, onRequestUpgrade, featureName }) => (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <StarIcon className="w-12 h-12 text-kmer-yellow mx-auto mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Débloquez la fonctionnalité "{featureName}"</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Passez au statut Premium pour accéder à des outils avancés et booster votre visibilité.</p>
        <button onClick={() => onRequestUpgrade(store.id, 'premium')} className="bg-kmer-yellow text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors">
            Je veux devenir Premium
        </button>
    </div>
);

export default UpgradePanel;
