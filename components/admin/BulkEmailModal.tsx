import React, { useState, useEffect } from 'react';
import type { User, EmailTemplate } from '../../types';
import { XIcon, PaperAirplaneIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface BulkEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (subject: string, body: string) => void;
    recipients: User[];
    emailTemplates: EmailTemplate[];
}

const BulkEmailModal: React.FC<BulkEmailModalProps> = ({ isOpen, onClose, onSend, recipients, emailTemplates }) => {
    const { t } = useLanguage();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    useEffect(() => {
        if (selectedTemplateId) {
            const template = emailTemplates.find(t => t.id === selectedTemplateId);
            if (template) {
                setSubject(template.subject);
                setBody(template.body.replace('{emailContent}', '')); // Remove placeholder for custom content
            }
        } else {
            setSubject('');
            setBody('');
        }
    }, [selectedTemplateId, emailTemplates]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSend(subject, body);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{t('superadmin.emailModal.title')}</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6"/></button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    {t('superadmin.emailModal.recipients', recipients.length)}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium">{t('superadmin.emailModal.useTemplate')}</label>
                        <select 
                            id="template"
                            value={selectedTemplateId}
                            onChange={e => setSelectedTemplateId(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="">{t('superadmin.emailModal.customEmail')}</option>
                            {emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="subject" className="block text-sm font-medium">{t('superadmin.emailModal.subject')}</label>
                        <input 
                            type="text" 
                            id="subject" 
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="body" className="block text-sm font-medium">{t('superadmin.emailModal.body')}</label>
                        <textarea 
                            id="body" 
                            rows={8}
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">{t('superadmin.emailModal.variableInfo')}</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 font-semibold py-2 px-4 rounded-lg">{t('common.cancel')}</button>
                        <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                            <PaperAirplaneIcon className="w-5 h-5" />
                            {t('superadmin.emailModal.send')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkEmailModal;
