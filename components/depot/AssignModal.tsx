import React, { useState } from 'react';
import type { Order, User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export const AssignModal: React.FC<{ order: Order; agents: User[]; onAssign: (orderId: string, agentId: string) => void; onCancel: () => void }> = ({ order, agents, onAssign, onCancel }) => {
    const { t } = useLanguage();
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const availableAgents = agents.filter(a => a.availabilityStatus === 'available');
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">{t('depotDashboard.assignDriver')}</h3><p className="text-sm mb-4">{t('common.orderId')}: <span className="font-mono">{order.id}</span></p>
                <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">{t('depotDashboard.chooseAvailableDriver')}</option>{availableAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>
                <div className="flex justify-end gap-2 mt-4"><button onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded-lg">{t('common.cancel')}</button><button onClick={() => onAssign(order.id, selectedAgentId)} disabled={!selectedAgentId} className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">{t('depotDashboard.assign')}</button></div>
            </div>
        </div>
    );
};
