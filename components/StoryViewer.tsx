import React, { useState, useEffect, useCallback } from 'react';
import type { Store } from '../types';
import { XIcon } from './Icons';

interface StoryViewerProps {
  store: Store;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds

const StoryViewer: React.FC<StoryViewerProps> = ({ store, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const stories = store.stories || [];

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
  };

  useEffect(() => {
    if (stories.length === 0) {
      onClose();
      return;
    }
    
    setProgress(0); // Reset progress on new story
    
    const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 100 / (STORY_DURATION / 100), 100));
    }, 100);

    const storyTimer = setTimeout(goToNext, STORY_DURATION);

    return () => {
      clearTimeout(storyTimer);
      clearInterval(progressInterval);
    };
  }, [currentIndex, stories.length, goToNext, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  if (stories.length === 0) return null;

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-in fade-in-0" onClick={onClose}>
      <div className="relative w-full max-w-sm aspect-[9/16] max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        
        <div className="absolute top-0 left-0 right-0 p-3 z-20 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-1">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 linear" 
                  style={{ width: `${index === currentIndex ? progress : (index < currentIndex ? 100 : 0)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <img src={store.logoUrl} alt={store.name} className="w-9 h-9 rounded-full object-contain bg-white p-0.5"/>
              <span className="text-white font-semibold text-sm">{store.name}</span>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <XIcon className="w-6 h-6"/>
            </button>
          </div>
        </div>
        
        <div className="flex-grow relative flex items-center justify-center">
            <img src={currentStory.imageUrl} alt={`Story ${currentIndex + 1}`} className="max-w-full max-h-full object-contain"/>
        </div>
        
        {/* Navigation Overlays */}
        <div className="absolute top-0 left-0 bottom-0 w-1/3 z-10" onClick={goToPrev} aria-label="Previous Story" />
        <div className="absolute top-0 right-0 bottom-0 w-1/3 z-10" onClick={goToNext} aria-label="Next Story" />
      </div>
    </div>
  );
};

export default StoryViewer;
