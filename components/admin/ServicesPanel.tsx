import React, { useMemo } from 'react';
import type { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface ServicesPanelProps {
    allProducts: Product[];
}

export const ServicesPanel: React.FC<ServicesPanelProps> = ({ allProducts }) => {
    const { t } = useLanguage();
    const serviceProducts = useMemo(() => allProducts.filter(p => p.type === 'service'), [allProducts]);

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">{t('superadmin.tabs.services')} ({serviceProducts.length})</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">Nom du Service</th>
                            <th className="p-2 text-left">Vendeur</th>
                            <th className="p-2 text-right">Prix</th>
                            <th className="p-2 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {serviceProducts.map(service => (
                            <tr key={service.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-semibold">{service.name}</td>
                                <td className="p-2">{service.vendor}</td>
                                <td className="p-2 text-right">{service.price.toLocaleString('fr-CM')} FCFA</td>
                                <td className="p-2 text-center">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                        service.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                                    }`}>{service.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {serviceProducts.length === 0 && <p className="text-center text-gray-500 py-8">Aucun service trouvé.</p>}
            </div>
        </div>
    );
};