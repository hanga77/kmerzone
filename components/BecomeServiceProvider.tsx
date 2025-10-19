import React, { useState } from 'react';
import type { SiteSettings, Category } from '../types';
import { ArrowLeftIcon, PhotoIcon, DocumentTextIcon, SparklesIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface BecomeServiceProviderProps {
  onBack: () => void;
  onBecomeSeller: (data: {
    shopName: string,
    location: string,
    neighborhood: string,
    sellerFirstName: string,
    sellerLastName: string,
    sellerPhone: string,
    physicalAddress: string,
    logoUrl: string,
    latitude?: number,
    longitude?: number,
    category?: string,
  }) => void;
  siteSettings: SiteSettings;
  categories: Category[];
}

const BecomeServiceProvider: React.FC<BecomeServiceProviderProps> = ({ onBack, onBecomeSeller, siteSettings, categories }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        shopName: '',
        location: 'Douala',
        sellerFirstName: '',
        sellerLastName: '',
        sellerPhone: '',
        serviceDescription: '',
        logoUrl: '',
        serviceCategory: '',
        serviceArea: ''
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<typeof formData>>({});

    const serviceCategories = categories.filter(c => c.parentId === 'cat-services');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({...prev, [name]: undefined}));
        }
    };
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                setFormData(prev => ({ ...prev, logoUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validate = () => {
        const newErrors: Partial<typeof formData> = {};
        if (!formData.shopName.trim()) newErrors.shopName = t('becomeSeller.errors.shopName');
        if (!formData.sellerFirstName.trim()) newErrors.sellerFirstName = t('becomeSeller.errors.firstName');
        if (!formData.sellerLastName.trim()) newErrors.sellerLastName = t('becomeSeller.errors.lastName');
        if (!formData.sellerPhone.trim()) newErrors.sellerPhone = t('becomeSeller.errors.phone');
        if (!formData.serviceDescription.trim()) newErrors.serviceDescription = "La description des services est requise.";
        if (!formData.logoUrl) newErrors.logoUrl = t('becomeSeller.errors.logo');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onBecomeSeller({
                shopName: formData.shopName,
                location: formData.location,
                category: formData.serviceCategory,
                sellerFirstName: formData.sellerFirstName,
                sellerLastName: formData.sellerLastName,
                sellerPhone: formData.sellerPhone,
                physicalAddress: formData.serviceDescription,
                logoUrl: formData.logoUrl,
                neighborhood: '', // Not applicable for service provider form
            });
        }
    };
    
    const requiredDocuments = Object.entries(siteSettings.requiredSellerDocuments)
        .filter(([, isRequired]) => isRequired)
        .map(([name]) => name);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 py-12">
            <div className="container mx-auto px-4 sm:px-6">
                 <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
                    <ArrowLeftIcon className="w-5 h-5" />
                    {t('common.backToHome')}
                </button>
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                     <div className="text-center mb-8">
                        <SparklesIcon className="w-12 h-12 mx-auto text-purple-500" />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">{t('becomeServiceProvider.title')}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('becomeServiceProvider.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                            <legend className="px-2 font-semibold text-lg dark:text-gray-200">{t('becomeServiceProvider.step1Title')}</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label htmlFor="shopName" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.shopNameLabel')}</label>
                                    <input type="text" id="shopName" name="shopName" value={formData.shopName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName}</p>}
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.shopLogoLabel')}</label>
                                    <div className="mt-1 flex items-center gap-4">
                                        <div className="h-20 w-20 rounded-md bg-gray-100 dark:bg-gray-700 p-1 flex items-center justify-center">
                                            {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain rounded-md"/> : <PhotoIcon className="w-10 h-10 text-gray-400"/> }
                                        </div>
                                        <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
                                            <PhotoIcon className="w-5 h-5" /> {t('becomeSeller.upload')}
                                            <input id="logo-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/*" />
                                        </label>
                                    </div>
                                    {errors.logoUrl && <p className="text-red-500 text-xs mt-1">{errors.logoUrl}</p>}
                                </div>
                                 <div className="md:col-span-2">
                                    <label htmlFor="serviceCategory" className="block text-sm font-medium dark:text-gray-300">{t('becomeServiceProvider.serviceCategory')}</label>
                                    <select id="serviceCategory" name="serviceCategory" value={formData.serviceCategory} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                        <option value="">-- Sélectionnez une catégorie --</option>
                                        {serviceCategories.map(c => <option key={c.id} value={t(c.name)}>{t(c.name)}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="serviceDescription" className="block text-sm font-medium dark:text-gray-300">{t('becomeServiceProvider.serviceDescription')}</label>
                                    <textarea id="serviceDescription" name="serviceDescription" value={formData.serviceDescription} onChange={handleChange} rows={4} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={t('becomeServiceProvider.serviceDescriptionPlaceholder')} />
                                    {errors.serviceDescription && <p className="text-red-500 text-xs mt-1">{errors.serviceDescription}</p>}
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                            <legend className="px-2 font-semibold text-lg dark:text-gray-200">{t('becomeServiceProvider.step2Title')}</legend>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                 <div>
                                    <label htmlFor="sellerFirstName" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.firstNameLabel')}</label>
                                    <input type="text" id="sellerFirstName" name="sellerFirstName" value={formData.sellerFirstName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    {errors.sellerFirstName && <p className="text-red-500 text-xs mt-1">{errors.sellerFirstName}</p>}
                                </div>
                                <div>
                                    <label htmlFor="sellerLastName" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.lastNameLabel')}</label>
                                    <input type="text" id="sellerLastName" name="sellerLastName" value={formData.sellerLastName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                     {errors.sellerLastName && <p className="text-red-500 text-xs mt-1">{errors.sellerLastName}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="sellerPhone" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.phoneLabel')}</label>
                                    <input type="tel" id="sellerPhone" name="sellerPhone" value={formData.sellerPhone} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    {errors.sellerPhone && <p className="text-red-500 text-xs mt-1">{errors.sellerPhone}</p>}
                                </div>
                            </div>
                        </fieldset>

                         <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                            <legend className="px-2 font-semibold text-lg dark:text-gray-200">{t('becomeServiceProvider.step3Title')}</legend>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="md:col-span-2">
                                    <label htmlFor="serviceArea" className="block text-sm font-medium dark:text-gray-300">{t('becomeServiceProvider.serviceArea')}</label>
                                    <input type="text" id="serviceArea" name="serviceArea" value={formData.serviceArea} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={t('becomeServiceProvider.serviceAreaPlaceholder')} />
                                </div>
                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.cityLabel')}</label>
                                    <select id="location" name="location" value={formData.location} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                        <option>Douala</option><option>Yaoundé</option><option>Bafoussam</option>
                                    </select>
                                </div>
                            </div>
                        </fieldset>
                        
                        <div className="p-4 border-l-4 border-kmer-green bg-green-50 dark:bg-green-900/20 rounded-r-lg">
                             <h2 className="text-lg font-semibold flex items-center gap-2"><DocumentTextIcon className="w-5 h-5"/> {t('becomeSeller.requiredDocsTitle')}</h2>
                             <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{t('becomeSeller.requiredDocsDescription')}</p>
                             <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {requiredDocuments.map(doc => <li key={doc}>{doc}</li>)}
                             </ul>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors text-lg">
                                {t('becomeServiceProvider.submit')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BecomeServiceProvider;