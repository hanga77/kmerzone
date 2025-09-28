import React, { useState } from 'react';
import type { FlashSale, Product } from '../../types';

interface FlashSalesPanelProps {
    flashSales: FlashSale[];
    products: Product[];
    onProposeForFlashSale: (flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => void;
    store?: { name: string };
}

const FlashSalesPanel: React.FC<FlashSalesPanelProps> = ({ flashSales, products, onProposeForFlashSale, store }) => {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [flashPrice, setFlashPrice] = useState('');

    const handleSubmit = (saleId: string) => {
        if (selectedProduct && flashPrice && store) {
            onProposeForFlashSale(saleId, selectedProduct, Number(flashPrice), store.name);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Ventes Flash</h2>
            <div className="space-y-4">
                {flashSales.map(sale => (
                    <div key={sale.id} className="p-4 border rounded-lg dark:border-gray-700">
                        <h3 className="font-semibold">{sale.name}</h3>
                        <p className="text-sm">Se termine le: {new Date(sale.endDate).toLocaleDateString()}</p>
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                            <h4 className="font-semibold text-sm">Soumettre un produit</h4>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                <select onChange={e => setSelectedProduct(e.target.value)} className="p-1 border rounded text-xs col-span-2">
                                    <option value="">Choisir un produit</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <input type="number" value={flashPrice} onChange={e => setFlashPrice(e.target.value)} placeholder="Prix Flash" className="p-1 border rounded text-xs"/>
                                <button onClick={() => handleSubmit(sale.id)} className="col-span-3 bg-blue-500 text-white p-1 rounded text-sm">Soumettre</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FlashSalesPanel;
