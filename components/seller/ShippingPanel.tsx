import React, { useState } from 'react';
import type { Store, ShippingPartner, ShippingSettings } from '../../types';
import { TruckIcon, CheckCircleIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ShippingPanelProps {
  store: Store;
  allShippingPartners: ShippingPartner[];
  onUpdate: (storeId: string, settings: ShippingSettings) => void;
}

const ShippingPanel: React.FC<ShippingPanelProps> = ({ store, allShippingPartners, onUpdate }) => {
    const { t } = useLanguage();
    const [settings, setSettings] = useState<ShippingSettings>(
        store.shippingSettings || {
            enabledPartners: [],
            customRates: { local: null, national: null },
            freeShippingThreshold: null,
        }
    );
    const [saved, setSaved] = useState(false);

    const handlePartnerToggle = (partnerId: string) => {
        setSettings(prev => ({
            ...prev,
            enabledPartners: prev.enabledPartners.includes(partnerId)
                ? prev.enabledPartners.filter(id => id !== partnerId)
                : [...prev.enabledPartners, partnerId],
        }));
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = value === '' ? null : Number(value);
        setSettings(prev => ({
            ...prev,
            customRates: {
                ...prev.customRates,
                [name]: numValue,
            },
        }));
    };

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setSettings(prev => ({
            ...prev,
            freeShippingThreshold: value === '' ? null : Number(value),
        }));
    };

    const handleSave = () => {
        onUpdate(store.id, settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><TruckIcon className="w-6 h-6"/> {t('sellerDashboard.shipping.title')}</h2>
            
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2">{t('sellerDashboard.shipping.partnersTitle')}</h3>
                    <p className="text-sm text-gray-500 mb-4">{t('sellerDashboard.shipping.partnersDescription')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {allShippingPartners.map(partner => (
                            <label key={partner.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <input
                                    type="checkbox"
                                    checked={settings.enabledPartners.includes(partner.id)}
                                    onChange={() => handlePartnerToggle(partner.id)}
                                    className="h-5 w-5 rounded border-gray-300 text-kmer-green focus:ring-kmer-green"
                                />
                                <span className="font-medium">{partner.name}</span>
                                {partner.isPremium && <span className="text-xs font-bold bg-kmer-yellow/20 text-kmer-yellow px-2 py-0.5 rounded-full">{t('sellerDashboard.shipping.premium')}</span>}
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-2">{t('sellerDashboard.shipping.customRatesTitle')}</h3>
                    <p className="text-sm text-gray-500 mb-4">{t('sellerDashboard.shipping.customRatesDescription')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('sellerDashboard.shipping.localRate')}</label>
                            <input
                                type="number"
                                name="local"
                                value={settings.customRates.local ?? ''}
                                onChange={handleRateChange}
                                placeholder="Ex: 500"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('sellerDashboard.shipping.nationalRate')}</label>
                            <input
                                type="number"
                                name="national"
                                value={settings.customRates.national ?? ''}
                                onChange={handleRateChange}
                                placeholder="Ex: 1500"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-2">{t('sellerDashboard.shipping.freeShippingTitle')}</h3>
                    <p className="text-sm text-gray-500 mb-4">{t('sellerDashboard.shipping.freeShippingDescription')}</p>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('sellerDashboard.shipping.freeShippingThreshold')}</label>
                        <input
                            type="number"
                            value={settings.freeShippingThreshold ?? ''}
                            onChange={handleThresholdChange}
                            placeholder="Ex: 25000 (laisser vide pour désactiver)"
                            className="w-full sm:w-1/2 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t dark:border-gray-700 flex justify-end items-center gap-4">
                {saved && <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircleIcon className="w-5 h-5"/> {t('sellerDashboard.shipping.saved')}</span>}
                <button
                    onClick={handleSave}
                    className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
                >
                    {t('sellerDashboard.shipping.saveChanges')}
                </button>
            </div>
        </div>
    );
};
export default ShippingPanel;