import React from 'react';
import type { Product } from '../../types';
import { StarIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ReviewModerationPanelProps {
  allProducts: Product[];
  onReviewModeration: (productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => void;
}

const ReviewModerationPanel: React.FC<ReviewModerationPanelProps> = ({ allProducts, onReviewModeration }) => {
  const { t } = useLanguage();
  const pendingReviews = allProducts.flatMap(p => 
    p.reviews
      .filter(r => r.status === 'pending')
      .map(r => ({ ...r, productId: p.id, productName: p.name }))
  );

  if (pendingReviews.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <h2 className="text-xl font-semibold">{t('superadmin.reviews.noPending')}</h2>
        <p>{t('superadmin.reviews.goodJob')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4">{t('superadmin.reviews.title', pendingReviews.length)}</h2>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {pendingReviews.map(review => (
          <div key={`${review.productId}-${review.author}-${review.date}`} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div className="flex-grow">
                <p className="font-semibold">{t('superadmin.reviews.product')} <span className="text-kmer-green">{review.productName}</span></p>
                <p className="text-sm">{t('superadmin.reviews.by')} <span className="font-bold">{review.author}</span> {t('superadmin.reviews.on')} {new Date(review.date).toLocaleDateString('fr-FR')}</p>
                <div className="flex items-center my-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} filled={i < review.rating} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="italic text-gray-600 dark:text-gray-300">"{review.comment}"</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button 
                  onClick={() => onReviewModeration(review.productId, { author: review.author, date: review.date }, 'approved')}
                  className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-green-600"
                >
                  {t('common.approve')}
                </button>
                <button 
                  onClick={() => onReviewModeration(review.productId, { author: review.author, date: review.date }, 'rejected')}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600"
                >
                  {t('common.reject')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewModerationPanel;
