import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Section } from './common';

export const NotificationsTab: React.FC = () => {
    const { t } = useLanguage();
    const { user, updateUserInfo } = useAuth();
    const [prefs, setPrefs] = useState(user?.notificationPreferences || { promotions: true, orderUpdates: true, newsletters: true });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setPrefs(p => ({ ...p, [name]: checked }));
    };

    const handleSave = () => {
        if (user) {
            updateUserInfo(user.id, { notificationPreferences: prefs });
            alert(t('accountPage.preferencesSaved'));
        }
    };

    return (
        <Section title={t('accountPage.notifications')}>
            <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border rounded-lg">
                    <input type="checkbox" name="orderUpdates" checked={prefs.orderUpdates} onChange={handleChange} className="h-5 w-5 rounded"/>
                    <span>{t('accountPage.orderUpdates')}</span>
                </label>
                 <label className="flex items-center gap-3 p-4 border rounded-lg">
                    <input type="checkbox" name="promotions" checked={prefs.promotions} onChange={handleChange} className="h-5 w-5 rounded"/>
                    <span>{t('accountPage.promotions')}</span>
                </label>
                 <label className="flex items-center gap-3 p-4 border rounded-lg">
                    <input type="checkbox" name="newsletters" checked={prefs.newsletters} onChange={handleChange} className="h-5 w-5 rounded"/>
                    <span>{t('accountPage.newsletters')}</span>
                </label>
            </div>
            <button onClick={handleSave} className="mt-6 bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">{t('accountPage.savePreferences')}</button>
        </Section>
    );
};
