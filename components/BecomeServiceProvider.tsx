


import React, { useState } from 'react';
import type { SiteSettings, Category, Product } from '../types';
import { ArrowLeftIcon, PhotoIcon, DocumentTextIcon, SparklesIcon, CurrencyDollarIcon, ClockIcon, MapPinIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

declare const L: any;

interface BecomeServiceProviderProps {
  onBack: () => void;
  onBecomeSeller: (data: {
    shopName: string;
    location: string;
    sellerFirstName: string;
    sellerLastName: string;
    sellerPhone: string;
    logoUrl: string;
    serviceCategory: string; // ID of category
    // New service fields for the initial product
    serviceDescription: string;
    price: number;
    duration: string;
    locationType: Product['locationType'];
    serviceArea: string;
    availability: string;
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
        logoUrl: '',
        serviceCategory: '',
        serviceDescription: '',
        price: '',
        duration: '',
        locationType: 'flexible' as Product['locationType'],
        serviceArea: '',
        availability: ''
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const serviceCategories = categories.filter(c => c.parentId === 'cat-services');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: ''}));
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
        const newErrors: Record<string, string> = {};
        if (!formData.shopName.trim()) newErrors.shopName = "Le nom de l'activité est requis.";
        if (!formData.serviceCategory) newErrors.serviceCategory = "La catégorie de service est requise.";
        if (!formData.serviceDescription.trim()) newErrors.serviceDescription = "La description des services est requise.";
        if (!formData.price || Number(formData.price) <= 0) newErrors.price = "Un prix valide est requis.";
        if (!formData.duration.trim()) newErrors.duration = "La durée ou base de facturation est requise.";
        if (!formData.sellerFirstName.trim()) newErrors.sellerFirstName = t('becomeSeller.errors.firstName');
        if (!formData.sellerLastName.trim()) newErrors.sellerLastName = t('becomeSeller.errors.lastName');
        if (!formData.sellerPhone.trim()) newErrors.sellerPhone = t('becomeSeller.errors.phone');
        if (!formData.logoUrl) newErrors.logoUrl = t('becomeSeller.errors.logo');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onBecomeSeller({
                ...formData,
                price: Number(formData.price)
            });
        }
    };
    
    const requiredDocuments = Object.entries(siteSettings.requiredSellerDocuments)
        .filter(([, isRequired]) => isRequired)
        .map(([name]) => name);

    // FIX: Added `className` to props to allow passing CSS classes to the wrapper div.
    const Field: React.FC<{label: string, name: string, error?: string, children: React.ReactNode, className?: string}> = ({label, name, error, children, className}) => (
        <div className={className}>
            <label htmlFor={name} className="block text-sm font-medium dark:text-gray-300">{label}</label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );

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
                                <Field label="Nom de votre activité/service*" name="shopName" error={errors.shopName}>
                                    <input type="text" id="shopName" name="shopName" value={formData.shopName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                </Field>
                                <Field label="Logo ou photo de profil*" name="logoUrl" error={errors.logoUrl}>
                                    <div className="mt-1 flex items-center gap-4">
                                        <div className="h-20 w-20 rounded-md bg-gray-100 dark:bg-gray-700 p-1 flex items-center justify-center">
                                            {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain rounded-md"/> : <PhotoIcon className="w-10 h-10 text-gray-400"/> }
                                        </div>
                                        <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
                                            <PhotoIcon className="w-5 h-5" /> {t('becomeSeller.upload')}
                                            <input id="logo-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/*" />
                                        </label>
                                    </div>
                                </Field>
                                 <Field label={t('becomeServiceProvider.serviceCategory')} name="serviceCategory" error={errors.serviceCategory} className="md:col-span-2">
                                    <select id="serviceCategory" name="serviceCategory" value={formData.serviceCategory} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                        <option value="">-- Sélectionnez une catégorie --</option>
                                        {serviceCategories.map(c => <option key={c.id} value={c.id}>{t(c.name)}</option>)}
                                    </select>
                                </Field>
                                <Field label={t('becomeServiceProvider.serviceDescription')} name="serviceDescription" error={errors.serviceDescription} className="md:col-span-2">
                                    <textarea id="serviceDescription" name="serviceDescription" value={formData.serviceDescription} onChange={handleChange} rows={4} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={t('becomeServiceProvider.serviceDescriptionPlaceholder')} />
                                </Field>
                            </div>
                        </fieldset>
                        
                         <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                            <legend className="px-2 font-semibold text-lg dark:text-gray-200">Détails du Service</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <Field label="Prix (FCFA)*" name="price" error={errors.price}><div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-500 sm:text-sm">FCFA</span></div><input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 pl-14" /></div></Field>
                                <Field label="Base de facturation*" name="duration" error={errors.duration}><input type="text" id="duration" name="duration" value={formData.duration} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="ex: par heure, par session, par projet" /></Field>
                                <Field label="Disponibilité" name="availability"><input type="text" id="availability" name="availability" value={formData.availability} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="ex: Lun-Ven, 9h-17h" /></Field>
                                <Field label="Type de lieu" name="locationType"><select id="locationType" name="locationType" value={formData.locationType} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="remote">À distance</option><option value="on-site">Sur site</option><option value="flexible">Flexible</option></select></Field>
                                <Field label="Zone de service*" name="serviceArea" error={errors.serviceArea} className="md:col-span-2"><input type="text" id="serviceArea" name="serviceArea" value={formData.serviceArea} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="ex: Douala uniquement, à distance (en ligne), tout le Cameroun" /></Field>
                            </div>
                        </fieldset>

                        <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                            <legend className="px-2 font-semibold text-lg dark:text-gray-200">{t('becomeServiceProvider.step2Title')}</legend>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                 <Field label={t('becomeSeller.firstNameLabel')} name="sellerFirstName" error={errors.sellerFirstName}><input type="text" id="sellerFirstName" name="sellerFirstName" value={formData.sellerFirstName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                                <Field label={t('becomeSeller.lastNameLabel')} name="sellerLastName" error={errors.sellerLastName}><input type="text" id="sellerLastName" name="sellerLastName" value={formData.sellerLastName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                                <Field label={t('becomeSeller.phoneLabel')} name="sellerPhone" error={errors.sellerPhone} className="md:col-span-2"><input type="tel" id="sellerPhone" name="sellerPhone" value={formData.sellerPhone} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                                 <Field label={t('becomeSeller.cityLabel')} name="location"><select id="location" name="location" value={formData.location} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option>Douala</option><option>Yaoundé</option><option>Bafoussam</option></select></Field>
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
                            <button type="submit" className="bg-kmer-green text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors text-lg">
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