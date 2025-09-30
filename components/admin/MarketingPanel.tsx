import React, { useState } from 'react';
import type { FlashSale, Product, Advertisement, Announcement } from '../../types';
import FlashSaleForm from './FlashSaleForm';
import FlashSaleDetailView from './FlashSaleDetailView';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface MarketingPanelProps {
    flashSales: FlashSale[];
    onSaveFlashSale: (flashSale: Omit<FlashSale, 'id' | 'products'>) => void;
    allProducts: Product[];
    onUpdateFlashSaleSubmissionStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => void;
    onBatchUpdateFlashSaleStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => void;
    advertisements: Advertisement[];
    onAddAdvertisement: (data: Omit<Advertisement, 'id'>) => void;
    onUpdateAdvertisement: (id: string, data: Partial<Omit<Advertisement, 'id'>>) => void;
    onDeleteAdvertisement: (id: string) => void;
    allAnnouncements: Announcement[];
    onCreateOrUpdateAnnouncement: (data: Omit<Announcement, 'id'> | Announcement) => void;
    onDeleteAnnouncement: (id: string) => void;
}

const PanelButton: React.FC<{tab:string, label:string, activeTab: string, setActiveTab: (tab: string) => void}> = ({tab, label, activeTab, setActiveTab}) => (
    <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-semibold ${activeTab === tab ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500 dark:text-gray-400'}`}>{label}</button>
);

const AnnouncementForm: React.FC<{ announcement?: Announcement | null; onSave: (data: any) => void; onCancel: () => void }> = ({ announcement, onSave, onCancel }) => {
    const { t } = useLanguage();
    const [data, setData] = useState({
        id: announcement?.id || undefined,
        title: announcement?.title || '',
        content: announcement?.content || '',
        target: announcement?.target || 'all',
        startDate: announcement?.startDate ? new Date(announcement.startDate).toISOString().substring(0, 10) : '',
        endDate: announcement?.endDate ? new Date(announcement.endDate).toISOString().substring(0, 10) : '',
        isActive: announcement?.isActive === undefined ? true : announcement.isActive,
    });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setData(d => ({ ...d, [name]: type === 'checkbox' ? checked : value }));
    };
    return (
        <form onSubmit={e => { e.preventDefault(); onSave(data); }} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <input name="title" value={data.title} onChange={handleChange} placeholder={t('superadmin.marketing.announcementForm.title')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
            <textarea name="content" value={data.content} onChange={handleChange} placeholder={t('superadmin.marketing.announcementForm.content')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
            <div className="grid grid-cols-2 gap-4">
                <input type="date" name="startDate" value={data.startDate} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                <input type="date" name="endDate" value={data.endDate} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <select name="target" value={data.target} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                <option value="all">{t('superadmin.marketing.announcementForm.target_all')}</option>
                <option value="customers">{t('superadmin.marketing.announcementForm.target_customers')}</option>
                <option value="sellers">{t('superadmin.marketing.announcementForm.target_sellers')}</option>
            </select>
            <label className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={data.isActive} onChange={handleChange} /> {t('superadmin.marketing.announcementForm.activate')}</label>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">{t('common.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">{t('common.save')}</button>
            </div>
        </form>
    );
};

const AdForm: React.FC<{ ad?: Advertisement | null, onSave: (data: Omit<Advertisement, 'id'>) => void, onCancel: () => void }> = ({ ad, onSave, onCancel }) => {
    const { t } = useLanguage();
    const [data, setData] = useState({
        imageUrl: ad?.imageUrl || '',
        linkUrl: ad?.linkUrl || '',
        location: ad?.location || 'homepage-banner' as const,
        isActive: ad?.isActive === undefined ? true : ad.isActive,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setData(d => ({ ...d, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <input name="imageUrl" value={data.imageUrl} onChange={handleChange} placeholder={t('superadmin.marketing.adForm.imageUrl')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
            <input name="linkUrl" value={data.linkUrl} onChange={handleChange} placeholder={t('superadmin.marketing.adForm.linkUrl')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
            <label className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={data.isActive} onChange={handleChange} /> {t('superadmin.marketing.adForm.activate')}</label>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">{t('common.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">{t('common.save')}</button>
            </div>
        </form>
    );
};


export const MarketingPanel: React.FC<MarketingPanelProps> = (props) => {
    const { flashSales, onSaveFlashSale, allProducts, onUpdateFlashSaleSubmissionStatus, onBatchUpdateFlashSaleStatus, advertisements, onAddAdvertisement, onUpdateAdvertisement, onDeleteAdvertisement, allAnnouncements, onCreateOrUpdateAnnouncement } = props;
    const { t } = useLanguage();
    const [subTab, setSubTab] = useState('flashSales');
    const [isCreatingFlashSale, setIsCreatingFlashSale] = useState(false);
    const [isAdFormOpen, setIsAdFormOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
    const [isAnnouncementFormOpen, setIsAnnouncementFormOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    
    return (
        <div className="p-4 sm:p-6">
            <div className="flex border-b dark:border-gray-700 mb-6">
                <PanelButton tab="flashSales" label={t('superadmin.marketing.tabs.flashSales')} activeTab={subTab} setActiveTab={setSubTab}/>
                <PanelButton tab="ads" label={t('superadmin.marketing.tabs.ads')} activeTab={subTab} setActiveTab={setSubTab}/>
                <PanelButton tab="announcements" label={t('superadmin.marketing.tabs.announcements')} activeTab={subTab} setActiveTab={setSubTab}/>
            </div>
            {subTab === 'flashSales' && (
                 <div>
                    <button onClick={() => setIsCreatingFlashSale(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg mb-4 flex items-center gap-2"><PlusIcon className="w-5 h-5"/> {t('superadmin.marketing.createFlashSale')}</button>
                    {isCreatingFlashSale && <FlashSaleForm onSave={(data) => { onSaveFlashSale(data); setIsCreatingFlashSale(false); }} onCancel={() => setIsCreatingFlashSale(false)} />}
                    <div className="space-y-4 mt-4">
                        {flashSales.map(sale => (
                            <details key={sale.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <summary className="font-semibold cursor-pointer">{sale.name}</summary>
                                <FlashSaleDetailView sale={sale} allProducts={allProducts} onUpdateStatus={onUpdateFlashSaleSubmissionStatus} onBatchUpdateStatus={onBatchUpdateFlashSaleStatus} />
                            </details>
                        ))}
                    </div>
                </div>
            )}
            {subTab === 'ads' && (
                <div>
                     {!isAdFormOpen && <button onClick={() => { setEditingAd(null); setIsAdFormOpen(true); }} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg mb-4 flex items-center gap-2"><PlusIcon className="w-5 h-5"/> {t('superadmin.marketing.addAd')}</button>}
                     {isAdFormOpen && <AdForm ad={editingAd} onSave={(data) => { if (editingAd) { onUpdateAdvertisement(editingAd.id, data); } else { onAddAdvertisement(data); } setIsAdFormOpen(false); }} onCancel={() => setIsAdFormOpen(false)} />}
                     <div className="space-y-2 mt-4">
                        {advertisements.map(ad => (
                            <div key={ad.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <img src={ad.imageUrl} alt="Ad preview" className="w-24 h-12 object-cover rounded"/>
                                    <div>
                                        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{ad.linkUrl}</a>
                                        <p className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${ad.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{ad.isActive ? 'Active' : 'Inactive'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingAd(ad); setIsAdFormOpen(true); }} className="text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button>
                                    <button onClick={() => onDeleteAdvertisement(ad.id)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            )}
            {subTab === 'announcements' && (
                <div>
                    {!isAnnouncementFormOpen && (
                        <button onClick={() => { setEditingAnnouncement(null); setIsAnnouncementFormOpen(true); }} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg mb-4 flex items-center gap-2">
                            <PlusIcon className="w-5 h-5"/> {t('superadmin.marketing.createAnnouncement')}
                        </button>
                    )}
                    {isAnnouncementFormOpen && <AnnouncementForm announcement={editingAnnouncement} onSave={(data) => { onCreateOrUpdateAnnouncement(data); setIsAnnouncementFormOpen(false); }} onCancel={() => setIsAnnouncementFormOpen(false)} />}
                    <div className="space-y-2 mt-4">
                        {allAnnouncements.map(ann => (
                            <div key={ann.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{ann.title} <span className={`text-xs px-2 py-0.5 rounded-full ${ann.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{ann.isActive ? 'Active' : 'Inactive'}</span></p>
                                    <p className="text-sm">{ann.content}</p>
                                </div>
                                <button onClick={() => { setEditingAnnouncement(ann); setIsAnnouncementFormOpen(true); }} className="text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
