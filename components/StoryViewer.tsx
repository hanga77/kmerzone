import React, { useState, useEffect, useMemo } from 'react';
import type { Store, Story, Product } from '../types';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface StoryViewerProps {
    store: Store;
    onClose: () => void;
    onProductClick: (product: Product) => void;
    allProducts: Product[];
}

const StoryViewer: React.FC<StoryViewerProps> = ({ store, onClose, onProductClick, allProducts }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const activeStories = useMemo(() => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return (store.stories || []).filter(story => new Date(story.createdAt) > twentyFourHoursAgo);
    }, [store.stories]);
    
    useEffect(() => {
        if(activeStories.length === 0) return;
        
        const timer = setTimeout(() => {
            if (currentIndex < activeStories.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                onClose();
            }
        }, 5000); // 5 seconds per story

        return () => clearTimeout(timer);
    }, [currentIndex, activeStories, onClose]);

    if (activeStories.length === 0) {
        onClose();
        return null;
    }

    const currentStory = activeStories[currentIndex];
    const product = currentStory.productId ? allProducts.find(p => p.id === currentStory.productId) : null;
    
    const goToNext = () => setCurrentIndex(i => (i + 1) % activeStories.length);
    const goToPrev = () => setCurrentIndex(i => (i - 1 + activeStories.length) % activeStories.length);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="relative w-full max-w-sm h-[80vh] rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Progress Bars */}
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {activeStories.map((_, index) => (
                        <div key={index} className="flex-1 h-1 bg-white/30 rounded-full">
                            <div
                                className={`h-full bg-white rounded-full ${index === currentIndex ? 'animate-progress' : (index < currentIndex ? 'w-full' : 'w-0')}`}
                                style={{ animationDuration: '5s' }}
                            ></div>
                        </div>
                    ))}
                </div>

                <img src={currentStory.imageUrl} alt={`Story de ${store.name}`} className="w-full h-full object-cover" />
                
                <div className="absolute top-0 left-0 right-0 p-4 pt-6 bg-gradient-to-b from-black/50 to-transparent z-10">
                    <div className="flex items-center gap-2">
                        <img src={store.logoUrl} alt={store.name} className="w-10 h-10 rounded-full object-contain bg-white" />
                        <span className="text-white font-bold">{store.name}</span>
                    </div>
                </div>

                {product && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                        <button 
                            onClick={() => {
                                onProductClick(product);
                                onClose();
                            }}
                            className="bg-white/80 backdrop-blur-sm text-black font-bold py-3 px-6 rounded-full hover:bg-white animate-in"
                        >
                            Voir le produit
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <button onClick={goToPrev} className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/30 rounded-full p-2 z-20"><ChevronLeftIcon className="w-6 h-6"/></button>
                <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/30 rounded-full p-2 z-20"><ChevronRightIcon className="w-6 h-6"/></button>
                <button onClick={onClose} className="absolute top-2 right-2 text-white bg-black/30 rounded-full p-2 z-20"><XIcon className="w-6 h-6"/></button>
            </div>
             <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .animate-progress {
                    animation: progress linear;
                }
            `}</style>
        </div>
    );
};

export default StoryViewer;
