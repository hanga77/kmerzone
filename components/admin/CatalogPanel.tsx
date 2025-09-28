import React, { useState, useMemo } from 'react';
import type { Category } from '../../types';
import { PlusIcon, TrashIcon, CheckCircleIcon } from '../Icons';

interface CatalogPanelProps {
    allCategories: Category[];
    onAdminAddCategory: (name: string, parentId?: string) => void;
    onAdminDeleteCategory: (categoryId: string) => void;
    onAdminUpdateCategory: (categoryId: string, updates: Partial<Omit<Category, 'id'>>) => void;
}

export const CatalogPanel: React.FC<CatalogPanelProps> = ({ allCategories, onAdminAddCategory, onAdminDeleteCategory, onAdminUpdateCategory }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedParent, setSelectedParent] = useState('');
    const [editingCategories, setEditingCategories] = useState<Record<string, Partial<Omit<Category, 'id'>>>>({});

    const categoryTree = useMemo(() => {
        const mainCategories = allCategories.filter(c => !c.parentId);
        return mainCategories.map(mainCat => ({
            ...mainCat,
            subCategories: allCategories.filter(c => c.parentId === mainCat.id)
        }));
    }, [allCategories]);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        onAdminAddCategory(newCategoryName, selectedParent || undefined);
        setNewCategoryName('');
        setSelectedParent('');
    };

    const handleCategoryChange = (id: string, field: 'name' | 'imageUrl', value: string) => {
        setEditingCategories(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };
    
    const handleSaveCategory = (id: string) => {
        if (editingCategories[id]) {
            onAdminUpdateCategory(id, editingCategories[id]);
            setEditingCategories(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }
    };

    return (
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <h2 className="text-xl font-bold mb-4">Gestion du Catalogue</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {categoryTree.map(mainCat => (
                        <div key={mainCat.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                            <div className="flex items-center gap-2">
                                <input 
                                    value={editingCategories[mainCat.id]?.name ?? mainCat.name} 
                                    onChange={(e) => handleCategoryChange(mainCat.id, 'name', e.target.value)} 
                                    className="font-bold p-1 border rounded w-full bg-transparent dark:border-gray-600"
                                />
                                {editingCategories[mainCat.id] && <button onClick={() => handleSaveCategory(mainCat.id)} className="text-green-500"><CheckCircleIcon className="w-5 h-5"/></button>}
                                <button onClick={() => onAdminDeleteCategory(mainCat.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                             <div className="flex items-center gap-2 mt-2">
                                <input 
                                    placeholder="URL de l'image"
                                    value={editingCategories[mainCat.id]?.imageUrl ?? mainCat.imageUrl} 
                                    onChange={(e) => handleCategoryChange(mainCat.id, 'imageUrl', e.target.value)} 
                                    className="text-xs p-1 border rounded w-full bg-transparent dark:border-gray-600"
                                />
                            </div>
                            <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
                                {mainCat.subCategories.map(subCat => (
                                    <li key={subCat.id} className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                value={editingCategories[subCat.id]?.name ?? subCat.name} 
                                                onChange={(e) => handleCategoryChange(subCat.id, 'name', e.target.value)}
                                                className="p-1 border rounded w-full bg-transparent text-sm dark:border-gray-600"
                                            />
                                            {editingCategories[subCat.id] && <button onClick={() => handleSaveCategory(subCat.id)} className="text-green-500"><CheckCircleIcon className="w-5 h-5"/></button>}
                                            <button onClick={() => onAdminDeleteCategory(subCat.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-4">Ajouter une Catégorie</h3>
                <form onSubmit={handleAddCategory} className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg space-y-4">
                    <div>
                        <label htmlFor="catName" className="block text-sm font-medium">Nom de la catégorie</label>
                        <input type="text" id="catName" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label htmlFor="catParent" className="block text-sm font-medium">Catégorie parente (optionnel)</label>
                        <select id="catParent" value={selectedParent} onChange={e => setSelectedParent(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value="">-- Catégorie principale --</option>
                            {allCategories.filter(c => !c.parentId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5"/> Ajouter</button>
                </form>
            </div>
        </div>
    );
};