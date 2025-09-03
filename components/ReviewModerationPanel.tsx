import React, { useMemo } from 'react';
import type { Product, Review } from '../types';
import { StarIcon, CheckCircleIcon, XCircleIcon } from './Icons';

interface ReviewModerationPanelProps {
  allProducts: Product[];
  onReviewModeration: (productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => void;
}

const Rating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <StarIcon 
            key={i} 
            className={`w-4 h-4 ${i < rating ? 'text-kmer-yellow' : 'text-gray-300'}`} 
            filled={i < rating}
        />
      ))}
    </div>
);


const ReviewModerationPanel: React.FC<ReviewModerationPanelProps> = ({ allProducts, onReviewModeration }) => {
  const pendingReviews = useMemo(() => {
    return allProducts.flatMap(product =>
      product.reviews
        .filter(review => review.status === 'pending')
        .map(review => ({ ...review, productId: product.id, productName: product.name }))
    );
  }, [allProducts]);

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Modération des Avis en Attente</h2>
      {pendingReviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-4"/>
          <p className="font-semibold">Aucun avis en attente.</p>
          <p>Tout est à jour !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingReviews.map((review, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400">Produit: <span className="text-kmer-green font-bold">{review.productName}</span></p>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="font-bold dark:text-white">{review.author}</p>
                    <Rating rating={review.rating} />
                  </div>
                  <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                   <button 
                     onClick={() => onReviewModeration(review.productId, { author: review.author, date: review.date }, 'approved')}
                     className="bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 text-sm flex items-center gap-1"
                   >
                     <CheckCircleIcon className="w-4 h-4"/> Approuver
                   </button>
                   <button 
                     onClick={() => onReviewModeration(review.productId, { author: review.author, date: review.date }, 'rejected')}
                     className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 text-sm flex items-center gap-1"
                    >
                     <XCircleIcon className="w-4 h-4"/> Rejeter
                   </button>
                </div>
              </div>
              <p className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md italic text-gray-700 dark:text-gray-300">"{review.comment}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewModerationPanel;
