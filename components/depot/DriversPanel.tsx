import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const DriversPanel: React.FC<{ deliveryAgents: any[] }> = ({ deliveryAgents }) => {
    const { t } = useLanguage();
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                        <th className="p-2 text-left">{t('depotDashboard.table.agent')}</th>
                        <th className="p-2 text-left">{t('depotDashboard.table.availability')}</th>
                        <th className="p-2 text-left">{t('depotDashboard.table.performance')}</th>
                    </tr>
                </thead>
                <tbody>
                    {deliveryAgents.map(agent => (
                        <tr key={agent.id} className="border-b dark:border-gray-700">
                            <td className="p-2 font-semibold">{agent.name}</td>
                            <td className="p-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${agent.availabilityStatus === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {agent.availabilityStatus === 'available' ? t('deliveryDashboard.available') : t('deliveryDashboard.unavailable')}
                                </span>
                            </td>
                            <td>{t('depotDashboard.successRate')}: {agent.successRate.toFixed(1)}% ({t('depotDashboard.deliveriesSucceeded', agent.deliveredCount, agent.totalMissions)})</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
