import React from 'react';

export const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={className}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{title}</h2>
        {children}
    </div>
);
