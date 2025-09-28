import React from 'react';
import type { Payout } from '../../types';

interface PayoutsPanelProps {
    payouts: Payout[];
}

const PayoutsPanel: React.FC<PayoutsPanelProps> = ({ payouts }) => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Historique des Paiements</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-right">Montant</th>
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
