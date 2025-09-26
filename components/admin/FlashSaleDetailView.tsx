import React from 'react';
import type { FlashSale, Product } from '../../types';
import { CheckIcon, XIcon } from '../Icons';

interface FlashSaleDetailViewProps {
  sale: FlashSale;
  allProducts: Product[];
  onUpdateStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => void;
  onBatchUpdateStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => void;
}

const FlashSaleDetailView: React.FC<FlashSaleDetailViewProps> = ({ sale, allProducts, onUpdateStatus, onBatchUpdateStatus }) => {
  const pendingProductIds = sale.products.filter(p => p.status === 'pending').map(p => p.productId);

  const getProductInfo = (productId: string) => {
    return allProducts.find(p => p.id === productId);
  };

  const handleBatchApprove = () => {
    if (pendingProductIds.length > 0) {
      onBatchUpdateStatus(sale.id, pendingProductIds, 'approved');
    }
  };

  const handleBatchReject = () => {
    if (pendingProductIds.length > 0) {
      onBatchUpdateStatus(sale.id, pendingProductIds, 'rejected');
    }
  };

  if (sale.products.length === 0) {
    return <div className="p-4 text-center text-gray-500">Aucun produit n'a été soumis pour cette vente.</div>;
  }

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900/50">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold">Soumissions de produits</h4>
        {pendingProductIds.length > 0 && (
          <div className="flex gap-2">
            <button onClick={handleBatchApprove} className="bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-green-600">Tout Approuver</button>
            <button onClick={handleBatchReject} className="bg-red-500 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-red-600">Tout Rejeter</button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Produit</th>
              <th className="px-4 py-2 text-left">Vendeur</th>
              <th className="px-4 py-2 text-right">Prix Original</th>
              <th className="px-4 py-2 text-right">Prix Flash</th>
              <th className="px-4 py-2 text-center">Statut</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {sale.products.map(sp => {
              const product = getProductInfo(sp.productId);
              if (!product) return null;
              return (
                <tr key={sp.productId}>
                  <td className="px-4 py-2 flex items-center gap-3">
                    <img src={product.imageUrls[0]} alt={product.name} className="w-10 h-10 object-cover rounded-md"/>
                    <span>{product.name}</span>
                  </td>
                  <td className="px-4 py-2">{sp.sellerShopName}</td>
                  <td className="px-4 py-2 text-right">{product.price.toLocaleString('fr-CM')} FCFA</td>
                  <td className="px-4 py-2 text-right font-bold text-kmer-green">{sp.flashPrice.toLocaleString('fr-CM')} FCFA</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      sp.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      sp.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>{sp.status}</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {sp.status === 'pending' ? (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => onUpdateStatus(sale.id, sp.productId, 'approved')} className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full" aria-label="Approuver"><CheckIcon className="w-5 h-5"/></button>
                        <button onClick={() => onUpdateStatus(sale.id, sp.productId, 'rejected')} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full" aria-label="Rejeter"><XIcon className="w-5 h-5"/></button>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FlashSaleDetailView;
