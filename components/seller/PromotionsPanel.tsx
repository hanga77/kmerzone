import React from 'react';
import type { PromoCode } from '../../types';

interface PromotionsPanelProps {
    promoCodes: PromoCode[];
    onCreatePromoCode: (codeData: Omit<PromoCode, 'uses'>) => void;
    onDeletePromoCode: (code: string) => void;
}

const PromotionsPanel: React.FC<PromotionsPanelProps> = ({ promoCodes, onCreatePromoCode, onDeletePromoCode }) => {
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
            <h2 className="text-2xl font-bold mb-4">Codes Promo</h2>
            <form onSubmit={handleCreate} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg grid grid-cols-3 gap-4">
                <input name="code" placeholder="CODEPROMO" className="p-2 border rounded" required />
                <input name="discountValue" type="number" placeholder="Valeur (10 ou 1000)" className="p-2 border rounded" required />
                <select name="discountType" className="p-2 border rounded">
                    <option value="percentage">%</option>
                    <option value="fixed">FCFA</option>
                </select>
                <button type="submit" className="col-span-3 bg-blue-500 text-white p-2 rounded">Créer le code</button>
            </form>
        </div>
    );
};

export default PromotionsPanel;
