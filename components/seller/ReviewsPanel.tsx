import React, { useState } from 'react';
import type { Review, Product } from '../../types';
import { StarIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ReviewsPanelProps {
    products: Product[];
    onReplyToReview: (productId: string, reviewIdentifier: { author: string; date: string }, replyText: string) => void;
}

const ReviewsPanel: React.FC<ReviewsPanelProps> = ({ products, onReplyToReview }) => {
    const { t } = useLanguage();
    const allReviews = products.flatMap(p => p.reviews.map(r => ({ ...r, productId: p.id, productName: p.name })));
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const handleReply = (productId: string, review: Review) => {
        onReplyToReview(productId, { author: review.author, date: review.date }, replyText);
        setReplyingTo(null);
        setReplyText('');
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{t('sellerDashboard.reviews.title')}</h2>
            <div className="space-y-4">
                {allReviews.map(review => (
                    <div key={`${review.productId}-${review.date}`} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="font-semibold text-kmer-green">{review.productName}</p>
                        <div className="flex items-center gap-2"><StarIcon className="w-4 h-4 text-yellow-400"/><span>{t('sellerDashboard.reviews.rating', review.rating, review.author)}</span></div>
                        <p className="italic">"{review.comment}"</p>
                        {review.sellerReply ? (
                            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/50 rounded-md text-sm"><strong>{t('sellerDashboard.reviews.yourReply')}</strong> {review.sellerReply.text}</div>
                        ) : (
                            replyingTo === `${review.productId}-${review.date}` ? (
                                <div className="mt-2">
                                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} className="w-full p-1 border rounded" />
                                    <button onClick={() => handleReply(review.productId, review)} className="bg-blue-500 text-white text-xs px-2 py-1 rounded">{t('sellerDashboard.reviews.send')}</button>
                                </div>
                            ) : (
                                <button onClick={() => setReplyingTo(`${review.productId}-${review.date}`)} className="text-sm text-blue-500 mt-2">{t('sellerDashboard.reviews.reply')}</button>
                            )
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewsPanel;