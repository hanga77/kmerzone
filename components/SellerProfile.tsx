import React, { useState, useEffect, useRef } from 'react';
import type { Store } from '../types';
import { ArrowLeftIcon, BuildingStorefrontIcon, PhotoIcon, MapPinIcon, DocumentTextIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

// Leaflet is loaded from a script tag in index.html
declare const L: any;

interface SellerProfileProps {
    store: Store;
    onBack: () => void;
    onUpdateProfile: (storeId: string, updatedData: Partial<Store>) => void;
}

const SellerProfile: React.FC<SellerProfileProps> = ({ store, onBack, onUpdateProfile }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<Partial<Store>>(store);
    const [logoPreview, setLogoPreview] = useState(store.logoUrl);
    const [bannerPreview, setBannerPreview] = useState(store.bannerUrl);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || typeof L === 'undefined') return;

        const initialLatLng: [number, number] = [
            formData.latitude || 4.0511, // Default to Douala
            formData.longitude || 9.7679,
        ];

        mapRef.current = L.map(mapContainerRef.current).setView(initialLatLng, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);
        
        const updateMarker = (latlng: { lat: number, lng: number }) => {
            setFormData(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
            if (!markerRef.current) {
                markerRef.current = L.marker(latlng, { draggable: true }).addTo(mapRef.current);
                markerRef.current.on('dragend', (e: any) => {
                    updateMarker(e.target.getLatLng());
                });
            } else {
                markerRef.current.setLatLng(latlng);
            }
            mapRef.current.panTo(latlng);
        };
        
        if (formData.latitude && formData.longitude) {
            updateMarker({ lat: formData.latitude, lng: formData.longitude });
        }
        
        mapRef.current.on('click', (e: any) => {
            updateMarker(e.latlng);
        });
        
        // Invalidate map size after a short delay to ensure it renders correctly
        setTimeout(() => mapRef.current?.invalidateSize(), 100);

    }, []);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'bannerUrl') => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setFormData(prev => ({ ...prev, [field]: result }));
                if (field === 'logoUrl') setLogoPreview(result);
                if (field === 'bannerUrl') setBannerPreview(result);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile(store.id, formData);
        alert('Profil mis à jour !');
        onBack();
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 py-12">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
                <ArrowLeftIcon className="w-5 h-5" />
                {t('sellerDashboard.analytics.backToDashboard')}
            </button>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-3">
                    <BuildingStorefrontIcon className="w-8 h-8 text-kmer-green" />
                    <h1 className="text-3xl font-bold dark:text-white">{t('sellerDashboard.tabs.profile')}</h1>
                </div>

                {/* Store Info */}
                <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                    <legend className="px-2 font-semibold dark:text-gray-200">{t('becomeSeller.step1Title')}</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.shopNameLabel')}</label>
                            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium dark:text-gray-300">{t('header.categories')}</label>
                            <input type="text" id="category" name="category" value={formData.category || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.shopLogoLabel')}</label>
                            <div className="mt-1 flex items-center gap-4">
                                <img src={logoPreview} alt="Logo" className="h-20 w-20 object-contain rounded-md bg-gray-100 dark:bg-gray-700 p-1"/>
                                <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
                                    <PhotoIcon className="w-5 h-5" /> {t('sellerDashboard.profile.change')}
                                    <input id="logo-upload" type="file" className="sr-only" onChange={(e) => handleImageChange(e, 'logoUrl')} accept="image/*" />
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">{t('Bannière')}</label>
                             <div className="mt-1 flex items-center gap-4">
                                <div className="h-20 w-40 rounded-md bg-gray-100 dark:bg-gray-700 p-1 flex items-center justify-center">
                                    {bannerPreview ? <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover rounded-md"/> : <PhotoIcon className="w-10 h-10 text-gray-400"/> }
                                </div>
                                <label htmlFor="banner-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
                                     <PhotoIcon className="w-5 h-5" /> {t('sellerDashboard.profile.change')}
                                    <input id="banner-upload" type="file" className="sr-only" onChange={(e) => handleImageChange(e, 'bannerUrl')} accept="image/*" />
                                </label>
                            </div>
                        </div>
                    </div>
                </fieldset>

                {/* Contact Info */}
                 <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                    <legend className="px-2 font-semibold dark:text-gray-200">{t('becomeSeller.step2Title')}</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                         <div>
                            <label htmlFor="sellerFirstName" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.firstNameLabel')}</label>
                            <input type="text" id="sellerFirstName" name="sellerFirstName" value={formData.sellerFirstName || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label htmlFor="sellerLastName" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.lastNameLabel')}</label>
                            <input type="text" id="sellerLastName" name="sellerLastName" value={formData.sellerLastName || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="sellerPhone" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.phoneLabel')}</label>
                            <input type="tel" id="sellerPhone" name="sellerPhone" value={formData.sellerPhone || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>
                </fieldset>

                {/* Location Info */}
                 <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                    <legend className="px-2 font-semibold dark:text-gray-200">{t('becomeSeller.step3Title')}</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div>
                            <label htmlFor="physicalAddress" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.addressLabel')}</label>
                            <textarea id="physicalAddress" name="physicalAddress" value={formData.physicalAddress || ''} onChange={handleChange} rows={2} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                             <label htmlFor="location" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.cityLabel')}</label>
                            <select id="location" name="location" value={formData.location || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option>Douala</option>
                                <option>Yaoundé</option>
                                <option>Bafoussam</option>
                                <option>Limbe</option>
                                <option>Kribi</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="neighborhood" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.neighborhoodLabel')}</label>
                            <input type="text" id="neighborhood" name="neighborhood" value={formData.neighborhood || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.gpsLabel')}</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('becomeSeller.gpsDescription')}</p>
                            <div ref={mapContainerRef} className="h-64 w-full mt-2 rounded-md z-0" aria-label="Carte pour sélectionner l'emplacement"></div>
                            <div className="flex gap-4 mt-2">
                                <input type="number" readOnly value={formData.latitude || ''} placeholder="Latitude" className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                                <input type="number" readOnly value={formData.longitude || ''} placeholder="Longitude" className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        </div>
                    </div>
                </fieldset>
                
                <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onBack} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">{t('common.cancel')}</button>
                    <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">{t('common.save')}</button>
                </div>
            </form>
        </div>
    );
};

export default SellerProfile;
