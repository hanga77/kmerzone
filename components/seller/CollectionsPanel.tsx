import React, { useState } from 'react';
import type { ProductCollection, Store, Product } from '../../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, XIcon } from '../Icons';

interface CollectionsPanelProps {
    store: Store;
    products: Product[];
    onCreateOrUpdateCollection: (storeId: string, collection: Omit<ProductCollection, 'storeId'>) => void;
    onDeleteCollection: (storeId: string, collectionId: string) => void;
}

const CollectionForm: React.FC<{
    collection?: ProductCollection | null;
    allProducts: Product[];
    onSave: (collection: Omit<ProductCollection, 'storeId' | 'id'> & { id?: string }) => void;
    onCancel: () => void;
}> = ({ collection, allProducts, onSave, onCancel }) => {
    const [name, setName] = useState(collection?.name || '');
    const [description, setDescription] = useState(collection?.description || '');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>(collection?.productIds || []);

    const handleToggleProduct = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: collection?.id, name, description, productIds: selectedProductIds });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
                <h3 className="text-lg font-bold mb-4">{collection ? 'Modifier' : 'Créer'} une collection</h3>
                <div className="space-y-4">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la collection" className="w-full p-2 border rounded-md" required />
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnel)" rows={3} className="w-full p-2 border rounded-md" />
                    <div>
                        <h4 className="font-semibold mb-2">Sélectionner les produits</h4>
                        <div className="max-h-60 overflow-y-auto border p-2 rounded-md space-y-2">
                            {allProducts.map(p => (
                                <label key={p.id} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                    <input type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={() => handleToggleProduct(p.id)} />
                                    <img src={p.imageUrls[0]} alt={p.name} className="w-8 h-8 object-cover rounded-sm" />
                                    <span>{p.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded-lg">Annuler</button>
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">Sauvegarder</button>
                </div>
            </form>
        </div>
    );
};

const CollectionsPanel: React.FC<CollectionsPanelProps> = ({ store, products, onCreateOrUpdateCollection, onDeleteCollection }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<ProductCollection | null>(null);

    const handleSave = (collectionData: Omit<ProductCollection, 'storeId' | 'id'> & { id?: string }) => {
        // The prop expects an object with a required `id`. For new collections,
        // a temporary ID is generated here. The data handling logic will
        // replace it with a permanent one upon creation.
        const collectionToSave = {
            ...collectionData,
            id: collectionData.id || `new-${Date.now()}`,
        };
        onCreateOrUpdateCollection(store.id, collectionToSave);
        setIsFormOpen(false);
        setEditingCollection(null);
    };

    return (
        <div className="p-6">
            {isFormOpen && (
                <CollectionForm
                    collection={editingCollection}
                    allProducts={products}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditingCollection(null); }}
                />
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Mes Collections</h2>
                <button onClick={() => { setEditingCollection(null); setIsFormOpen(true); }} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Créer une collection
                </button>
            </div>
            <div className="space-y-4">
                {store.collections?.map(collection => (
                    <div key={collection.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{collection.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{collection.description}</p>
                                <p className="text-xs mt-1">{collection.productIds.length} produit(s)</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingCollection(collection); setIsFormOpen(true); }} className="text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button>
                                <button onClick={() => onDeleteCollection(store.id, collection.id)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    </div>
                ))}
                 {(!store.collections || store.collections.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                        <p>Vous n'avez aucune collection. Créez-en une pour regrouper vos produits !</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectionsPanel;