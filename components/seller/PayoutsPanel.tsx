import React from 'react';
import type { Payout } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface PayoutsPanelProps {
    payouts: Payout[];
}

const PayoutsPanel: React.FC<PayoutsPanelProps> = ({ payouts }) => {
    const { t } = useLanguage();
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{t('sellerDashboard.payouts.title')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">{t('sellerDashboard.payouts.table.date')}</th>
                            <th className="p-2 text-right">{t('sellerDashboard.payouts.table.amount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payouts.map(payout => (
                            <tr key={payout.date} className="border-b dark:border-gray-700">
                                <td className="p-2">{new Date(payout.date).toLocaleDateString()}</td>
                                <td className="p-2 text-right font-semibold text-green-600">{payout.amount.toLocaleString('fr-CM')} FCFA</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayoutsPanel;