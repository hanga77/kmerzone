import React from 'react';
import type { PromoCode } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface PromotionsPanelProps {
    promoCodes: PromoCode[];
    onCreatePromoCode: (codeData: Omit<PromoCode, 'uses'>) => void;
    onDeletePromoCode: (code: string) => void;
}

const PromotionsPanel: React.FC<PromotionsPanelProps> = ({ promoCodes, onCreatePromoCode, onDeletePromoCode }) => {
    const { t } = useLanguage();
    // Simplified form for creating a promo code
    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newCode: Omit<PromoCode, 'uses' | 'sellerId'> = {
            code: formData.get('code') as string,
            discountType: formData.get('discountType') as 'percentage' | 'fixed',
            discountValue: Number(formData.get('discountValue')),
        };
        // In a real app, sellerId would come from context
        onCreatePromoCode({ ...newCode, sellerId: 'seller-1' });
        e.currentTarget.reset();
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{t('sellerDashboard.promotions.title')}</h2>
            <form onSubmit={handleCreate} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg grid grid-cols-3 gap-4">
                <input name="code" placeholder={t('sellerDashboard.promotions.createForm.code')} className="p-2 border rounded" required />
                <input name="discountValue" type="number" placeholder={t('sellerDashboard.promotions.createForm.value')} className="p-2 border rounded" required />
                <select name="discountType" className="p-2 border rounded">
                    <option value="percentage">{t('sellerDashboard.promotions.createForm.type_percentage')}</option>
                    <option value="fixed">{t('sellerDashboard.promotions.createForm.type_fixed')}</option>
                </select>
                <button type="submit" className="col-span-3 bg-blue-500 text-white p-2 rounded">{t('sellerDashboard.promotions.createForm.create')}</button>
            </form>
        </div>
    );
};

export default PromotionsPanel;