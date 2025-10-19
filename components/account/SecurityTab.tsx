import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Section } from './common';

export const SecurityTab: React.FC = () => {
    const { t } = useLanguage();
    const { user, changePassword } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t('accountPage.passwordMismatch') });
            return;
        }
        if (user && changePassword(user.id, oldPassword, newPassword)) {
            setMessage({ type: 'success', text: t('accountPage.passwordSuccess') });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setMessage({ type: 'error', text: t('accountPage.passwordIncorrect') });
        }
    };

    return (
        <Section title={t('accountPage.security')}>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <h3 className="font-semibold text-lg">{t('accountPage.changePassword')}</h3>
                 <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder={t('accountPage.oldPassword')} className="w-full p-2 border rounded-md" required />
                 <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('accountPage.newPassword')} className="w-full p-2 border rounded-md" required />
                 <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('accountPage.confirmNewPassword')} className="w-full p-2 border rounded-md" required />
                {message && <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
                <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">{t('accountPage.update')}</button>
            </form>
        </Section>
    );
};
