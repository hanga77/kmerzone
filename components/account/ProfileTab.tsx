import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { PencilSquareIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={className}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{title}</h2>
        {children}
    </div>
);

export const ProfileTab: React.FC<{ user: User; onUpdate: (updates: Partial<User>) => void }> = ({ user, onUpdate }) => {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>(user);
    const [avatarPreview, setAvatarPreview] = useState(user.profilePictureUrl);
    
    useEffect(() => {
        setFormData(user);
        setAvatarPreview(user.profilePictureUrl);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatarPreview(result);
                setFormData(prev => ({...prev, profilePictureUrl: result}));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSave = () => {
        onUpdate(formData);
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setFormData(user);
        setAvatarPreview(user.profilePictureUrl);
        setIsEditing(false);
    };
    
    return (
        <Section title={t('accountPage.profile')}>
            <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                    <img src={avatarPreview || `https://ui-avatars.com/api/?name=${user.name}&background=008000&color=fff`} alt="Avatar" className="w-24 h-24 rounded-full object-cover"/>
                    {isEditing && (
                        <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-600 p-1.5 rounded-full cursor-pointer shadow-md">
                            <PencilSquareIcon className="w-5 h-5"/>
                            <input id="avatar-upload" type="file" className="sr-only" onChange={handleAvatarChange} accept="image/*"/>
                        </label>
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <p className="text-gray-500">{user.email}</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-gray-500">{t('accountPage.fullName')}</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} disabled={!isEditing} className="w-full p-2 mt-1 border rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-600"/></div>
                    <div><label className="text-sm font-medium text-gray-500">{t('accountPage.phone')}</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} disabled={!isEditing} className="w-full p-2 mt-1 border rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-600"/></div>
                    <div><label className="text-sm font-medium text-gray-500">{t('accountPage.birthDate')}</label><input type="date" name="birthDate" value={formData.birthDate?.split('T')[0] || ''} onChange={handleChange} disabled={!isEditing} className="w-full p-2 mt-1 border rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-600"/></div>
                    <div><label className="text-sm font-medium text-gray-500">{t('accountPage.gender')}</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} disabled={!isEditing} className="w-full p-2 mt-1 border rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-600">
                            <option>{t('accountPage.preferNotToSay')}</option><option>{t('accountPage.male')}</option><option>{t('accountPage.female')}</option><option>{t('accountPage.other')}</option>
                        </select>
                    </div>
                </div>
            </div>
            
             <div className="mt-8 flex gap-4">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg">{t('common.save')}</button>
                        <button onClick={handleCancel} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-6 rounded-lg">{t('common.cancel')}</button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg">{t('accountPage.editProfile')}</button>
                )}
            </div>
        </Section>
    );
};
