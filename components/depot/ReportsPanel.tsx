import React, { useState, useMemo } from 'react';
import type { Order, User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { StatCard } from './StatCard';

export const ReportsPanel: React.FC<{ depotOrders: Order[], deliveryAgents: User[] }> = ({ depotOrders, deliveryAgents }) => {
    const { t } = useLanguage();
    const [period, setPeriod] = useState<'7days' | '30days'>('7days');

    const reportData = useMemo(() => {
        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - (period === '7days' ? 7 : 30));

        const filteredOrders = depotOrders.filter(o => new Date(o.orderDate) >= cutoffDate);
        if (filteredOrders.length === 0) return null;

        let checkedIn = 0;
        let shippedOut = 0;
        let totalProcessingTime = 0;
        let processedCount = 0;
        let successfulDeliveries = 0;

        const dailyFlow: { [day: string]: { in: number, out: number } } = {};

        filteredOrders.forEach(order => {
            const checkInEvent = order.trackingHistory.find(e => e.status === 'at-depot');
            const shipOutEvent = order.trackingHistory.find(e => e.status === 'out-for-delivery');

            if (checkInEvent) {
                checkedIn++;
                const day = new Date(checkInEvent.date).toLocaleDateString('fr-FR');
                dailyFlow[day] = { ...dailyFlow[day], in: (dailyFlow[day]?.in || 0) + 1 };
            }
            if (shipOutEvent) {
                shippedOut++;
                 const day = new Date(shipOutEvent.date).toLocaleDateString('fr-FR');
                dailyFlow[day] = { ...dailyFlow[day], out: (dailyFlow[day]?.out || 0) + 1 };
            }
            if(checkInEvent && shipOutEvent) {
                totalProcessingTime += new Date(shipOutEvent.date).getTime() - new Date(checkInEvent.date).getTime();
                processedCount++;
            }
            if(order.status === 'delivered') {
                successfulDeliveries++;
            }
        });
        
        const topDrivers = deliveryAgents.map(agent => {
            const agentDeliveries = filteredOrders.filter(o => o.agentId === agent.id && o.status === 'delivered').length;
            return { name: agent.name, count: agentDeliveries };
        }).sort((a,b) => b.count - a.count).slice(0, 5);

        return {
            checkedIn,
            shippedOut,
            avgProcessingTime: processedCount > 0 ? (totalProcessingTime / processedCount) / (1000 * 60 * 60) : 0, // in hours
            deliverySuccessRate: shippedOut > 0 ? (successfulDeliveries / shippedOut) * 100 : 0,
            dailyFlow: Object.entries(dailyFlow).map(([day, data]) => ({ day, ...data })),
            topDrivers
        };
    }, [depotOrders, deliveryAgents, period]);

    if (!reportData) {
        return <div className="p-6 text-center text-gray-500">{t('depotDashboard.reportsPanel.noData')}</div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-xl">{t('depotDashboard.reportsPanel.title')}</h3>
             <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{t('depotDashboard.reportsPanel.selectPeriod')}</p>
                <button onClick={() => setPeriod('7days')} className={`px-3 py-1 text-sm rounded-md ${period === '7days' ? 'bg-kmer-green text-white' : 'bg-gray-200'}`}>{t('common.days7')}</button>
                <button onClick={() => setPeriod('30days')} className={`px-3 py-1 text-sm rounded-md ${period === '30days' ? 'bg-kmer-green text-white' : 'bg-gray-200'}`}>{t('common.days30')}</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label={t('depotDashboard.reportsPanel.parcelsCheckedIn')} value={reportData.checkedIn} />
                <StatCard label={t('depotDashboard.reportsPanel.parcelsShippedOut')} value={reportData.shippedOut} />
                <StatCard label={t('depotDashboard.reportsPanel.avgProcessingTime')} value={`${reportData.avgProcessingTime.toFixed(1)} ${t('depotDashboard.reportsPanel.hours')}`} />
                <StatCard label={t('depotDashboard.reportsPanel.deliverySuccessRate')} value={`${reportData.deliverySuccessRate.toFixed(1)}%`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2">{t('depotDashboard.reportsPanel.dailyFlow')}</h4>
                    <div className="flex justify-around items-end h-56 border-l border-b border-gray-200 dark:border-gray-700 pl-4 pb-4">
                        {reportData.dailyFlow.map(({ day, in: inCount, out: outCount }) => (
                            <div key={day} className="flex flex-col items-center h-full justify-end" title={`${day}: ${inCount || 0} Entrées, ${outCount || 0} Sorties`}>
                                <div className="flex gap-1 items-end h-full">
                                    <div className="w-4 bg-green-500 rounded-t-sm" style={{ height: `${((inCount || 0) / Math.max(...reportData.dailyFlow.map(d => Math.max(d.in||0, d.out||0)), 1)) * 100}%` }}></div>
                                    <div className="w-4 bg-orange-500 rounded-t-sm" style={{ height: `${((outCount || 0) / Math.max(...reportData.dailyFlow.map(d => Math.max(d.in||0, d.out||0)), 1)) * 100}%` }}></div>
                                </div>
                                <p className="text-xs mt-1">{day.split('/')[0]}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2">{t('depotDashboard.reportsPanel.topDrivers')}</h4>
                    <ul>
                        {reportData.topDrivers.map((driver, index) => (
                            <li key={driver.name} className="flex justify-between items-center text-sm py-1 border-b last:border-b-0">
                                <span>{index + 1}. {driver.name}</span>
                                <span className="font-bold">{driver.count} {t('depotDashboard.reportsPanel.successfulDeliveries')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
