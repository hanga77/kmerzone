import React, { useState, useEffect } from 'react';
import type { PickupPoint, AgentSchedule, Shift } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircleIcon } from '../Icons';

export const AgentsPanel: React.FC<{ 
    agents: any[];
    depot: PickupPoint;
    onSaveSchedule: (depotId: string, schedule: AgentSchedule) => void;
}> = ({ agents, depot, onSaveSchedule }) => {
    const { t } = useLanguage();
    const [schedule, setSchedule] = useState<AgentSchedule>(depot.schedule || {});
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSchedule(depot.schedule || {});
    }, [depot.schedule]);

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const shifts: Shift[] = ['Matin', 'Après-midi', 'Nuit', 'Repos'];
    
    const translatedShifts: Record<Shift, string> = {
        'Matin': t('depotDashboard.shifts.morning'),
        'Après-midi': t('depotDashboard.shifts.afternoon'),
        'Nuit': t('depotDashboard.shifts.night'),
        'Repos': t('depotDashboard.shifts.off'),
    };

    const handleScheduleChange = (agentId: string, day: string, value: Shift) => {
        setSchedule(prev => ({
            ...prev,
            [agentId]: {
                ...(prev[agentId] || {}),
                [day]: value,
            },
        }));
    };
    
    const handleSave = () => {
        onSaveSchedule(depot.id, schedule);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
    <div className="space-y-6">
        <div>
            <h3 className="font-bold mb-4">{t('depotDashboard.schedule')}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border dark:border-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">{t('depotDashboard.table.agent')}</th>
                            {days.map(day => <th key={day} className="p-2 text-center">{t(`depotDashboard.weekdays.${day}`)}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => (
                            <tr key={agent.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-semibold">{agent.name}</td>
                                {days.map(day => (
                                    <td key={day} className="p-1">
                                        <select
                                            value={schedule[agent.id]?.[day] || 'Repos'}
                                            onChange={e => handleScheduleChange(agent.id, day, e.target.value as Shift)}
                                            className="w-full p-1 border rounded-md text-xs dark:bg-gray-600 dark:border-gray-500"
                                        >
                                            {shifts.map(shift => (
                                                <option key={shift} value={shift}>{translatedShifts[shift]}</option>
                                            ))}
                                        </select>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="mt-4 flex justify-end items-center gap-4">
                {saved && <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircleIcon className="w-5 h-5"/> {t('depotDashboard.scheduleSaved')}</span>}
                <button onClick={handleSave} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">{t('depotDashboard.saveSchedule')}</button>
            </div>
        </div>
    </div>);
}
