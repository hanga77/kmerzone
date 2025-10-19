import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Address } from '../../types';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '../Icons';
import { AddressForm } from './AddressForm';
import { Section } from './common';


export const AddressesTab: React.FC = () => {
    const { t } = useLanguage();
    const { user, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingAddress(null);
        setIsFormOpen(true);
    };

    const handleSave = (address: Address) => {
        if (!user) return;
        if (editingAddress) {
            updateAddress(user.id, address);
        } else {
            addAddress(user.id, address);
        }
        setIsFormOpen(false);
        setEditingAddress(null);
    };
    
    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingAddress(null);
    };

    if (!user) return null;

    return (
        <Section title={t('accountPage.addresses')}>
            {isFormOpen ? (
                <AddressForm
                    address={editingAddress}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            ) : (
                <div className="space-y-4">
                    <button onClick={handleAddNew} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-5 h-5"/> {t('accountPage.addNewAddress')}
                    </button>
                    {user.addresses && user.addresses.map(addr => (
                        <div key={addr.id} className={`p-4 border rounded-lg ${addr.isDefault ? 'border-kmer-green bg-green-50 dark:bg-green-900/20' : 'dark:border-gray-700'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{addr.label}</p>
                                    <address className="not-italic text-gray-600 dark:text-gray-300">
                                        {addr.fullName}<br/>
                                        {addr.address}, {addr.city}<br/>
                                        {addr.phone}
                                    </address>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(addr)}><PencilSquareIcon className="w-5 h-5 text-gray-500 hover:text-blue-500"/></button>
                                    <button onClick={() => deleteAddress(user.id, addr.id!)}><TrashIcon className="w-5 h-5 text-gray-500 hover:text-red-500"/></button>
                                </div>
                            </div>
                             {!addr.isDefault && (
                                <button onClick={() => setDefaultAddress(user.id, addr.id!)} className="text-sm font-semibold text-kmer-green mt-2">{t('accountPage.default')}</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Section>
    );
};