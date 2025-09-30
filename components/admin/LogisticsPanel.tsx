import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { PickupPoint, User } from '../../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, XIcon, UsersIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

declare const L: any;

interface LogisticsPanelProps {
    allPickupPoints: PickupPoint[];
    allUsers: User[];
    onAddPickupPoint: (point: Omit<PickupPoint, 'id'>) => void;
    onUpdatePickupPoint: (point: PickupPoint) => void;
    onDeletePickupPoint: (pointId: string) => void;
}

const StaffModal: React.FC<{ point: PickupPoint, manager: User | undefined, staff: User[], onClose: () => void }> = ({ point, manager, staff, onClose }) => {
    const { t } = useLanguage();
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{t('superadmin.logistics.staffModal.title', point.name)}</h3>
                    <button onClick={onClose}><XIcon className="w-6 h-6"/></button>
                </div>
                
                <div>
                    <h4 className="font-bold text-md mb-2">{t('superadmin.logistics.staffModal.manager')}</h4>
                    {manager ? (
                         <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-md border-l-4 border-yellow-500">
                            <p className="font-semibold">{manager.name}</p>
                            <p className="text-sm text-gray-500">{manager.email}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">{t('superadmin.logistics.staffModal.noManager')}</p>
                    )}
                </div>

                <div className="mt-4">
                     <h4 className="font-bold text-md mb-2">{t('superadmin.logistics.staffModal.staff')}</h4>
                    {staff.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {staff.map(agent => (
                                <li key={agent.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                    <p className="font-semibold">{agent.name}</p>
                                    <p className="text-sm text-gray-500">{agent.email}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 text-sm py-4">{t('superadmin.logistics.staffModal.noStaff')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};


const PointForm: React.FC<{ point?: PickupPoint | null, onSave: (data: any) => void, onCancel: () => void }> = ({ point, onSave, onCancel }) => {
    const { t } = useLanguage();
    const [data, setData] = useState({
        id: point?.id,
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
             <input name="name" value={data.name} onChange={handleChange} placeholder={t('superadmin.logistics.form.name')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
             <div className="grid grid-cols-2 gap-4">
                <input name="city" value={data.city} onChange={handleChange} placeholder={t('superadmin.logistics.form.city')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                <input name="neighborhood" value={data.neighborhood} onChange={handleChange} placeholder={t('superadmin.logistics.form.neighborhood')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
             </div>
             <input name="street" value={data.street} onChange={handleChange} placeholder={t('superadmin.logistics.form.street')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
             <div ref={mapContainerRef} className="h-48 w-full rounded-md z-0"></div>
             <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">{t('common.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">{t('common.save')}</button>
             </div>
        </form>
    );
};

export const LogisticsPanel: React.FC<LogisticsPanelProps> = ({ allPickupPoints, allUsers, onAddPickupPoint, onUpdatePickupPoint, onDeletePickupPoint }) => {
    const { t } = useLanguage();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null);
    const [viewingStaffFor, setViewingStaffFor] = useState<PickupPoint | null>(null);

    const staffAndManagerForPoint = useMemo(() => {
        if (!viewingStaffFor) return { manager: undefined, staff: [] };
        const manager = allUsers.find(user => user.id === viewingStaffFor.managerId);
        const staff = allUsers.filter(user => (user.role === 'depot_agent' || user.role === 'depot_manager') && user.depotId === viewingStaffFor.id && user.id !== viewingStaffFor.managerId);
        return { manager, staff };
    }, [viewingStaffFor, allUsers]);

    const handleSave = (data: any) => {
        if (editingPoint) {
            onUpdatePickupPoint(data as PickupPoint);
        } else {
            onAddPickupPoint(data);
        }
        setIsFormOpen(false);
        setEditingPoint(null);
    };
    
    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingPoint(null);
    };

    return (
        <div className="p-4 sm:p-6">
            {viewingStaffFor && <StaffModal point={viewingStaffFor} manager={staffAndManagerForPoint.manager} staff={staffAndManagerForPoint.staff} onClose={() => setViewingStaffFor(null)} />}
            <h2 className="text-xl font-bold mb-4">{t('superadmin.logistics.title')}</h2>
            <div className="mb-4">
                {!isFormOpen && (
                    <button onClick={() => setIsFormOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><PlusIcon className="w-5 h-5"/> {t('superadmin.logistics.addPickupPoint')}</button>
                )}
                {isFormOpen && <div className="mt-4"><PointForm point={editingPoint} onSave={handleSave} onCancel={handleCancel} /></div>}
            </div>
            <div className="space-y-2">
                {allPickupPoints.map(point => (
                    <div key={point.id} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{point.name}</p>
                            <p className="text-sm">{point.street}, {point.neighborhood}, {point.city}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setViewingStaffFor(point)} className="text-blue-500 flex items-center gap-1 text-sm"><UsersIcon className="w-4 h-4"/> {t('superadmin.logistics.viewStaff')}</button>
                            <button onClick={() => { setEditingPoint(point); setIsFormOpen(true); }} className="text-gray-500"><PencilSquareIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDeletePickupPoint(point.id)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
