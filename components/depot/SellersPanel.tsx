import React, { useMemo } from 'react';
import type { Order, Store } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export const SellersPanel: React.FC<{ depotInventory: Order[], allStores: Store[] }> = ({ depotInventory, allStores }) => {
    const { t } = useLanguage();
    const sellersWithParcels = useMemo(() => {
        const sellerParcelCount: Record<string, number> = {};
        depotInventory.forEach(order => {
            order.items.forEach(item => {
                sellerParcelCount[item.vendor] = (sellerParcelCount[item.vendor] || 0) + 1;
            });
        });
        return Object.entries(sellerParcelCount).map(([name, count]) => ({ name, count, store: allStores.find(s => s.name === name) }));
    }, [depotInventory, allStores]);

    return (<div>
        <h3 className="font-bold mb-4">{t('depotDashboard.sellersWithParcels')}</h3>
        <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-2 text-left">{t('depotDashboard.table.seller')}</th><th className="p-2 text-left">{t('depotDashboard.table.location')}</th><th className="p-2 text-right">{t('depotDashboard.table.parcels')}</th></tr></thead>
            <tbody>
                {sellersWithParcels.map(({ name, count, store }) => (<tr key={name} className="border-b dark:border-gray-700">
                    <td className="p-2 font-semibold">{name}</td><td className="p-2">{store?.location}, {store?.neighborhood}</td><td className="p-2 text-right font-bold">{count}</td>
                </tr>))}
            </tbody>
        </table>
    </div>);
};
