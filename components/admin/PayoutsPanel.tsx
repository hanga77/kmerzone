import React, { useMemo } from 'react';
import type { Order, Store, Payout, SiteSettings } from '../../types';

interface PayoutsPanelProps {
    allOrders: Order[];
    allStores: Store[];
    payouts: Payout[];
    onPayoutSeller: (storeId: string, amount: number) => void;
    siteSettings: SiteSettings;
}

export const PayoutsPanel: React.FC<PayoutsPanelProps> = ({ allOrders, allStores, payouts, onPayoutSeller, siteSettings }) => {
    
    const getCommissionRate = (store: Store) => {
        switch (store.premiumStatus) {
            case 'premium':
                return siteSettings.premiumPlan.commissionRate / 100;
            case 'super_premium':
                return siteSettings.superPremiumPlan.commissionRate / 100;
            default:
                return siteSettings.commissionRate / 100;
        }
    };

    const payoutData = useMemo(() => {
        return allStores
            .filter(s => s.status === 'active')
            .map(store => {
                const commissionRate = getCommissionRate(store);
                const storeOrders = allOrders.filter(o => o.status === 'delivered' && o.items.some(i => i.vendor === store.name));
                const totalRevenue = storeOrders.reduce((sum, order) => {
                    const sellerItemsTotal = order.items
                        .filter(item => item.vendor === store.name)
                        .reduce((itemSum, item) => itemSum + (item.promotionPrice ?? item.price) * item.quantity, 0);
                    return sum + sellerItemsTotal;
                }, 0);

                const paidAmount = payouts
                    .filter(p => p.storeId === store.id)
                    .reduce((sum, p) => sum + p.amount, 0);
                
                const totalCommission = totalRevenue * commissionRate;
                const balanceDue = totalRevenue - totalCommission - paidAmount;

                return {
                    storeId: store.id,
                    storeName: store.name,
                    totalRevenue,
                    totalCommission,
                    paidAmount,
                    balanceDue,
                };
            }).filter(data => data.balanceDue > 0);
    }, [allOrders, allStores, payouts, siteSettings]);

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">Paiements des Vendeurs</h2>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                <p className="font-semibold">Taux de commission actuel : {siteSettings.commissionRate}% (Standard)</p>
                <p className="text-sm">Le solde dû est calculé sur les commandes livrées, moins la commission et les paiements déjà effectués.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">Boutique</th>
                            <th className="p-2 text-right">Revenu Total</th>
                            <th className="p-2 text-right">Commission Due</th>
                            <th className="p-2 text-right">Déjà Payé</th>
                            <th className="p-2 text-right">Solde Dû</th>
                            <th className="p-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payoutData.map(data => (
                            <tr key={data.storeId} className="border-b dark:border-gray-700">
                                <td className="p-2 font-semibold">{data.storeName}</td>
                                <td className="p-2 text-right">{data.totalRevenue.toLocaleString('fr-CM')} F</td>
                                <td className="p-2 text-right text-red-500">-{data.totalCommission.toLocaleString('fr-CM')} F</td>
                                <td className="p-2 text-right text-green-500">{data.paidAmount.toLocaleString('fr-CM')} F</td>
                                <td className="p-2 text-right font-bold">{data.balanceDue.toLocaleString('fr-CM')} F</td>
                                <td className="p-2 text-center">
                                    <button onClick={() => onPayoutSeller(data.storeId, data.balanceDue)} className="bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-green-600">
                                        Marquer comme payé
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {payoutData.length === 0 && <p className="text-center text-gray-500 py-8">Aucun paiement en attente.</p>}
            </div>
        </div>
    );
};