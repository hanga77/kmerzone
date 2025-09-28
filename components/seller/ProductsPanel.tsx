import React, { useState } from 'react';
import type { Product } from '../../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, TagIcon, BoltIcon } from '../Icons';

interface ProductsPanelProps {
    products: Product[];
    onAddProduct: () => void;
    onEditProduct: (product: Product) => void;
    onDeleteProduct: (productId: string) => void;
    onUpdateProductStatus: (productId: string, status: Product['status']) => void;
    onSetPromotion: (product: Product) => void;
}

const ProductsPanel: React.FC<ProductsPanelProps> = ({ products, onAddProduct, onEditProduct, onDeleteProduct, onUpdateProductStatus, onSetPromotion }) => {
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Mes Produits ({products.length})</h2>
                <button onClick={onAddProduct} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Ajouter un produit
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">Produit</th>
                            <th className="p-2 text-right">Prix</th>
                            <th className="p-2 text-center">Stock</th>
                            <th className="p-2 text-center">Statut</th>
                            <th className="p-2 text-center">Actions</th>
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
                                        <option value="published">Publié</option>
                                        <option value="draft">Brouillon</option>
                                        <option value="archived">Archivé</option>
                                    </select>
                                </td>
                                <td className="p-2">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => onSetPromotion(p)} className="text-yellow-500" title="Mettre en promotion"><TagIcon className="w-5 h-5"/></button>
                                        <button onClick={() => onEditProduct(p)} className="text-blue-500" title="Modifier"><PencilSquareIcon className="w-5 h-5"/></button>
                                        <button onClick={() => onDeleteProduct(p.id)} className="text-red-500" title="Supprimer"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {products.length === 0 && <p className="text-center text-gray-500 py-8">Vous n'avez aucun produit. Cliquez sur "Ajouter un produit" pour commencer.</p>}
            </div>
        </div>
    );
};

export default ProductsPanel;
