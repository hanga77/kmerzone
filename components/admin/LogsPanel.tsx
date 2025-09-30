import React, { useState, useMemo } from 'react';
import type { SiteActivityLog } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface LogsPanelProps {
    siteActivityLogs: SiteActivityLog[];
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ siteActivityLogs }) => {
    const { t } = useLanguage();
    const [filter, setFilter] = useState('');

    const filteredLogs = useMemo(() => {
        const sortedLogs = [...siteActivityLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (!filter) return sortedLogs;
        const lowerFilter = filter.toLowerCase();
        return sortedLogs.filter(log =>
            log.user.name.toLowerCase().includes(lowerFilter) ||
            log.action.toLowerCase().includes(lowerFilter) ||
            log.details.toLowerCase().includes(lowerFilter)
        );
    }, [siteActivityLogs, filter]);

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">{t('superadmin.logs.title')}</h2>
            <input
                type="text"
                placeholder={t('superadmin.logs.filterPlaceholder')}
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full p-2 border rounded-md mb-4 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                {filteredLogs.map(log => (
                    <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md text-sm">
                        <p className="font-mono text-xs text-gray-400 dark:text-gray-500">{new Date(log.timestamp).toLocaleString('fr-FR')}</p>
                        <p>
                            <span className="font-semibold">{log.user.name}</span> ({log.user.role}) {t('superadmin.logs.performedAction')}
                            <span className="font-bold text-kmer-green ml-1">{log.action}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">{t('superadmin.logs.details')} {log.details}</p>
                    </div>
                ))}
                {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>{t('superadmin.logs.noLogs')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
