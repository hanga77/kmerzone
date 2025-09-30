import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SiteSettings } from '../types';
import { ArrowLeftIcon, PhotoIcon, MapPinIcon, DocumentTextIcon, BecomeSellerIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

declare const L: any;

interface BecomeSellerProps {
  onBack: () => void;
  onBecomeSeller: (
    shopName: string,
    location: string,
    neighborhood: string,
    sellerFirstName: string,
    sellerLastName: string,
    sellerPhone: string,
    physicalAddress: string,
    logoUrl: string,
    latitude?: number,
    longitude?: number
  ) => void;
  siteSettings: SiteSettings;
}

const BecomeSeller: React.FC<BecomeSellerProps> = ({ onBack, onBecomeSeller, siteSettings }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        shopName: '',
        location: 'Douala',
        neighborhood: '',
        sellerFirstName: '',
        sellerLastName: '',
        sellerPhone: '',
        physicalAddress: '',
        logoUrl: '',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<typeof formData>>({});

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    
    const updateMarkerAndForm = useCallback((latlng: { lat: number, lng: number }) => {
        setFormData(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
        if (mapRef.current) {
            if (!markerRef.current) {
                markerRef.current = L.marker(latlng, { draggable: true }).addTo(mapRef.current);
                markerRef.current.on('dragend', (e: any) => updateMarkerAndForm(e.target.getLatLng()));
            } else {
                markerRef.current.setLatLng(latlng);
            }
            mapRef.current.panTo(latlng);
        }
    }, []);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current && typeof L !== 'undefined') {
            const initialLatLng: [number, number] = [4.0511, 9.7679]; // Douala
            mapRef.current = L.map(mapContainerRef.current).setView(initialLatLng, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
            
            mapRef.current.on('click', (e: any) => updateMarkerAndForm(e.latlng));

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const userLatLng = { lat: latitude, lng: longitude };
                        mapRef.current.setView(userLatLng, 15);
                        updateMarkerAndForm(userLatLng);
                    },
                    (error) => {
                        console.warn(`Geolocation error: ${error.message}`);
                        updateMarkerAndForm({ lat: initialLatLng[0], lng: initialLatLng[1] });
                    },
                    { timeout: 10000 }
                );
            } else {
                updateMarkerAndForm({ lat: initialLatLng[0], lng: initialLatLng[1] });
            }

            setTimeout(() => mapRef.current?.invalidateSize(), 400);
        }
    }, [updateMarkerAndForm]);
    
    const handleGeolocate = () => {
        if (navigator.geolocation && mapRef.current) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const userLatLng = { lat: latitude, lng: longitude };
                    mapRef.current.setView(userLatLng, 15);
                    updateMarkerAndForm(userLatLng);
                },
                (error) => {
                    alert(`Erreur de géolocalisation: ${error.message}`);
                },
                { enableHighAccuracy: true }
            );
        } else {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
        }
    };

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
        if (!formData.physicalAddress.trim()) newErrors.physicalAddress = t('becomeSeller.errors.address');
        if (!formData.logoUrl) newErrors.logoUrl = t('becomeSeller.errors.logo');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onBecomeSeller(
                formData.shopName,
                formData.location,
                formData.neighborhood,
                formData.sellerFirstName,
                formData.sellerLastName,
                formData.sellerPhone,
                formData.physicalAddress,
                formData.logoUrl,
                formData.latitude,
                formData.longitude
            );
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
                        <BecomeSellerIcon className="w-12 h-12 mx-auto text-kmer-green" />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">{t('becomeSeller.title')}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('becomeSeller.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1 */}
                        <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                            <legend className="px-2 font-semibold text-lg dark:text-gray-200">{t('becomeSeller.step1Title')}</legend>
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
                            </div>
                        </fieldset>

                        {/* Section 2 */}
                        <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                            <legend className="px-2 font-semibold text-lg dark:text-gray-200">{t('becomeSeller.step2Title')}</legend>
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

                        {/* Section 3 */}
                        <fieldset className="p-4 border dark:border-gray-700 rounded-md">
                            <legend className="px-2 font-semibold text-lg dark:text-gray-200">{t('becomeSeller.step3Title')}</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.cityLabel')}</label>
                                    <select id="location" name="location" value={formData.location} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                        <option>Douala</option><option>Yaoundé</option><option>Bafoussam</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="neighborhood" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.neighborhoodLabel')}</label>
                                    <input type="text" id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="physicalAddress" className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.addressLabel')}</label>
                                    <textarea id="physicalAddress" name="physicalAddress" value={formData.physicalAddress} onChange={handleChange} rows={2} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    {errors.physicalAddress && <p className="text-red-500 text-xs mt-1">{errors.physicalAddress}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium dark:text-gray-300">{t('becomeSeller.gpsLabel')}</label>
                                        <button type="button" onClick={handleGeolocate} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                            <MapPinIcon className="w-4 h-4" />
                                            {t('becomeSeller.findMyPosition')}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('becomeSeller.gpsDescription')}</p>
                                    <div ref={mapContainerRef} className="h-64 w-full mt-2 rounded-md z-0"></div>
                                </div>
                            </div>
                        </fieldset>
                        
                        {/* Section 4 */}
                        <div className="p-4 border-l-4 border-kmer-green bg-green-50 dark:bg-green-900/20 rounded-r-lg">
                             <h2 className="text-lg font-semibold flex items-center gap-2"><DocumentTextIcon className="w-5 h-5"/> {t('becomeSeller.requiredDocsTitle')}</h2>
                             <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{t('becomeSeller.requiredDocsDescription')}</p>
                             <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {requiredDocuments.map(doc => <li key={doc}>{doc}</li>)}
                             </ul>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" className="bg-kmer-green text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors text-lg">
                                {t('becomeSeller.submitCandidacy')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BecomeSeller;
