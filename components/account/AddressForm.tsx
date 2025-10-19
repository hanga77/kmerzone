import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Address } from '../../types';

declare const L: any;

export const AddressForm: React.FC<{ address: Address | null, onSave: (address: Address) => void, onCancel: () => void }> = ({ address, onSave, onCancel }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [formData, setFormData] = useState<Address>({
        id: address?.id || undefined,
        isDefault: address?.isDefault || false,
        label: address?.label || 'Maison',
        fullName: address?.fullName || user?.name || '',
        phone: address?.phone || user?.phone || '',
        address: address?.address || '',
        city: address?.city || 'Douala',
        latitude: address?.latitude,
        longitude: address?.longitude,
    });
    
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        const initialLatLng: [number, number] = [formData.latitude || 4.05, formData.longitude || 9.75];
        if (mapContainerRef.current && !mapRef.current && typeof L !== 'undefined') {
            mapRef.current = L.map(mapContainerRef.current).setView(initialLatLng, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
            
             const updateMarker = (latlng: { lat: number, lng: number }) => {
                setFormData(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
                if (!markerRef.current) {
                    markerRef.current = L.marker(latlng, { draggable: true }).addTo(mapRef.current);
                    markerRef.current.on('dragend', (e: any) => updateMarker(e.target.getLatLng()));
                } else {
                    markerRef.current.setLatLng(latlng);
                }
            };
            
            if (formData.latitude && formData.longitude) {
                updateMarker({ lat: formData.latitude, lng: formData.longitude });
            }
            
            mapRef.current.on('click', (e: any) => updateMarker(e.latlng));
        }
        setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder={t('accountPage.fullName')} className="w-full p-2 border rounded-md" required />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder={t('accountPage.phone')} className="w-full p-2 border rounded-md" required />
                <input name="label" value={formData.label} onChange={handleChange} placeholder={t('accountPage.addressLabelPlaceholder')} className="w-full p-2 border rounded-md" />
                <select name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded-md">
                    <option>Douala</option><option>Yaoundé</option><option>Bafoussam</option>
                </select>
                
                <textarea name="address" value={formData.address} onChange={handleChange} placeholder={t('accountPage.addressPlaceholder')} rows={2} className="w-full p-2 border rounded-md md:col-span-2" required />
            </div>
             <div>
                <label className="text-sm font-medium">{t('becomeSeller.gpsLabel')}</label>
                <div ref={mapContainerRef} className="h-64 w-full mt-2 rounded-md z-0"></div>
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 font-bold py-2 px-4 rounded-lg">{t('common.cancel')}</button>
                <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">{t('common.save')}</button>
            </div>
        </form>
    );
};
