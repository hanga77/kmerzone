import React from 'react';
import { useComparison } from '../contexts/ComparisonContext';
import { StarIcon, ArrowLeftIcon } from './Icons';
import type { Product } from '../types';

interface ComparisonPageProps {
    onBack: () => void;
}

const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23E5E7EB'/%3E%3Cpath d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' stroke='%239CA3AF' stroke-width='1.5'/%3E%3C/svg%3E";

const ComparisonPage: React.FC<ComparisonPageProps> = ({ onBack }) => {
  const { comparisonList, products: allProducts } = useComparison();
  
  const productsToCompare = allProducts.filter(p => comparisonList.includes(p.id));

  const getRating = (product: Product) => {
    if (product.reviews.length === 0) return 0;
    return product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
  }

  const features = [
    { name: 'Prix', render: (p: Product) => (
        <p className="font-bold text-kmer-green text-lg">
            {(p.promotionPrice ?? p.price).toLocaleString('fr-CM')} FCFA
        </p>
    )},
    { name: 'Note', render: (p: Product) => (
      <div className="flex items-center justify-center gap-1">
        <StarIcon className="w-5 h-5 text-kmer-yellow" />
        <span>{getRating(p).toFixed(1)} ({p.reviews.length} avis)</span>
      </div>
    )},
    { name: 'Stock', render: (p: Product) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stock > 5 ? 'bg-green-100 text-green-800' : (p.stock > 0 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800')}`}>
            {p.stock > 0 ? `${p.stock} unités` : 'Épuisé'}
        </span>
    )},
    { name: 'Vendeur', render: (p: Product) => p.vendor },
    { name: 'Catégorie', render: (p: Product) => p.category },
  ];

  return (
    <div className="container mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour
      </button>
      <h1 className="text-3xl font-bold text-center mb-10">Comparer les produits</h1>

      {productsToCompare.length < 2 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Pas assez de produits à comparer.</h2>
            <p className="text-gray-600">Veuillez sélectionner au moins 2 produits en cliquant sur l'icône de balance.</p>
          </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full min-w-[800px] text-left">
            <thead className="border-b">
              <tr className="bg-gray-50">
                <th className="p-4 w-1/5 font-semibold text-gray-700">Caractéristique</th>
                {productsToCompare.map(product => (
                  <th key={product.id} className="p-4 w-1/5">
                    <div className="flex flex-col items-center text-center">
                      <img src={product.imageUrls[0] || PLACEHOLDER_IMAGE_URL} alt={product.name} className="h-24 w-24 object-cover rounded-md mb-2"/>
                      <h3 className="font-semibold">{product.name}</h3>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map(feature => (
                <tr key={feature.name} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-700">{feature.name}</td>
                  {productsToCompare.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      {feature.render(product)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;
