import React from 'react';

export const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
        <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
    </div>
);
