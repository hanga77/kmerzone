import React, { useState, useRef, useEffect } from 'react';
import type { PickupPoint } from '../../types';
import { PlusIcon } from '../Icons';

declare const L: any;

interface LogisticsPanelProps {
    allPickupPoints: PickupPoint[];
    onAddPickupPoint: (point: Omit<PickupPoint, 'id'>) => void;
    onUpdatePickupPoint: (point: PickupPoint) => void;
    onDeletePickupPoint: (pointId: string) => void;
}

const PointForm: React.FC<{ point?: PickupPoint | null, onSave: (data: any) => void, onCancel: () => void }> = ({ point, onSave, onCancel }) => {
    const [data, setData] = useState({
        name: point?.name || '',
        city: point?.city || 'Douala',
        neighborhood: point?.neighborhood || '',
        street: point?.street || '',
        latitude: point?.latitude || 4.05,
        longitude: point?.longitude || 9.75,
    });
    
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const initialLatLng: [number, number] = [data.latitude, data.longitude];
            mapRef.current = L.map(mapContainerRef.current).setView(initialLatLng, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
            
            const updateMarker = (latlng: { lat: number, lng: number }) => {
                setData(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
                if (!markerRef.current) {
                    markerRef.current = L.marker(latlng, { draggable: true }).addTo(mapRef.current);
                    markerRef.current.on('dragend', (e: any) => updateMarker(e.target.getLatLng()));
                } else {
                    markerRef.current.setLatLng(latlng);
                }
            };

            updateMarker({ lat: data.latitude, lng: data.longitude });
            mapRef.current.on('click', (e: any) => updateMarker(e.latlng));
            setTimeout(() => mapRef.current?.invalidateSize(), 100);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setData(d => ({ ...d, [e.target.name]: e.target.value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
             <input name="name" value={data.name} onChange={handleChange} placeholder="Nom du point relais" className="w-full p-2 border rounded" required />
             <div className="grid grid-cols-2 gap-4">
                <input name="city" value={data.city} onChange={handleChange} placeholder="Ville" className="w-full p-2 border rounded" required />
                <input name="neighborhood" value={data.neighborhood} onChange={handleChange} placeholder="Quartier" className="w-full p-2 border rounded" required />
             </div>
             <input name="street" value={data.street} onChange={handleChange} placeholder="Rue / Repère" className="w-full p-2 border rounded" />
             <div ref={mapContainerRef} className="h-48 w-full rounded-md z-0"></div>
             <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Sauvegarder</button>
             </div>
        </form>
    );
};

export const LogisticsPanel: React.FC<LogisticsPanelProps> = ({ allPickupPoints, onAddPickupPoint }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">Gestion Logistique</h2>
            <div className="mb-4">
                <button onClick={() => setIsFormOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Ajouter un Point Relais</button>
                {isFormOpen && <div className="mt-4"><PointForm onSave={(data) => { onAddPickupPoint(data); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} /></div>}
            </div>
            <div className="space-y-2">
                {allPickupPoints.map(point => (
                    <div key={point.id} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        <p className="font-semibold">{point.name}</p>
                        <p className="text-sm">{point.street}, {point.neighborhood}, {point.city}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
