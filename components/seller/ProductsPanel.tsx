import React, { useState } from 'react';
import type { Product } from '../../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, TagIcon, BoltIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProductsPanelProps {
    products: Product[];
    onAddProduct: () => void;
    onEditProduct: (product: Product) => void;
    onDeleteProduct: (productId: string) => void;
    onUpdateProductStatus: (productId: string, status: Product['status']) => void;
    onSetPromotion: (product: Product) => void;
}

const ProductsPanel: React.FC<ProductsPanelProps> = ({ products, onAddProduct, onEditProduct, onDeleteProduct, onUpdateProductStatus, onSetPromotion }) => {
    const { t } = useLanguage();
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t('sellerDashboard.products.title', products.length)}</h2>
                <button onClick={onAddProduct} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> {t('sellerDashboard.products.addProduct')}
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">{t('sellerDashboard.products.table.product')}</th>
                            <th className="p-2 text-right">{t('sellerDashboard.products.table.price')}</th>
                            <th className="p-2 text-center">{t('sellerDashboard.products.table.stock')}</th>
                            <th className="p-2 text-center">{t('sellerDashboard.products.table.status')}</th>
                            <th className="p-2 text-center">{t('sellerDashboard.products.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="border-b dark:border-gray-700">
                                <td className="p-2 flex items-center gap-3">
                                    <img src={p.imageUrls[0]} alt={p.name} className="w-12 h-12 object-cover rounded-md"/>
                                    <span className="font-semibold">{p.name}</span>
                                </td>
                                <td className="p-2 text-right">{p.price.toLocaleString('fr-CM')} FCFA</td>
                                <td className="p-2 text-center">{p.stock}</td>
                                <td className="p-2 text-center">
                                    <select value={p.status} onChange={(e) => onUpdateProductStatus(p.id, e.target.value as Product['status'])} className="p-1 border rounded-md text-xs dark:bg-gray-600 dark:border-gray-500">
                                        <option value="published">{t('sellerDashboard.products.statusOptions.published')}</option>
                                        <option value="draft">{t('sellerDashboard.products.statusOptions.draft')}</option>
                                        <option value="archived">{t('sellerDashboard.products.statusOptions.archived')}</option>
                                    </select>
                                </td>
                                <td className="p-2">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => onSetPromotion(p)} className="text-yellow-500" title={t('sellerDashboard.products.actions.promote')}><TagIcon className="w-5 h-5"/></button>
                                        <button onClick={() => onEditProduct(p)} className="text-blue-500" title={t('sellerDashboard.products.actions.edit')}><PencilSquareIcon className="w-5 h-5"/></button>
                                        <button onClick={() => onDeleteProduct(p.id)} className="text-red-500" title={t('sellerDashboard.products.actions.delete')}><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {products.length === 0 && <p className="text-center text-gray-500 py-8">{t('sellerDashboard.products.noProducts')}</p>}
            </div>
        </div>
    );
};

export default ProductsPanel;