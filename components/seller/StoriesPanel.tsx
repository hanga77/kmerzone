import React, { useMemo } from 'react';
import type { Store } from '../../types';
import { PhotoIcon, ClockIcon } from '../Icons';

interface StoriesPanelProps {
    store: Store;
    onAddStory: (imageUrl: string) => void;
}

const StoriesPanel: React.FC<StoriesPanelProps> = ({ store, onAddStory }) => {

    const activeStories = useMemo(() => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return (store.stories || []).filter(story => new Date(story.createdAt) > twentyFourHoursAgo);
    }, [store.stories]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                onAddStory(result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Gérer les Stories</h2>

            <div className="mb-8">
                <label htmlFor="story-upload" className="cursor-pointer">
                    <div className="w-full min-h-[150px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <PhotoIcon className="w-12 h-12 text-gray-400" />
                        <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">Ajouter une nouvelle story</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cliquez pour téléverser une image (PNG, JPG)</p>
                    </div>
                    <input id="story-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleFileChange} />
                </label>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4">Stories Actives (24h)</h3>
                {activeStories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {activeStories.map(story => (
                            <div key={story.id} className="relative group aspect-[9/16] rounded-lg overflow-hidden shadow-md">
                                <img src={story.imageUrl} alt={`Story ${story.id}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-2 left-2 text-white text-xs flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3"/>
                                    <span>{new Date(story.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p>Vous n'avez aucune story active.</p>
                        <p className="text-sm">Ajoutez-en une pour engager vos clients !</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoriesPanel;
