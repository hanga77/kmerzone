import React from 'react';
import type { Category } from '../types';

interface SellerCategoriesProps {
    categories: Category[];
}

const SellerCategories: React.FC<SellerCategoriesProps> = ({ categories }) => {
    if (categories.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Mes Catégories</h2>
            <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                    <span key={category.id} className="bg-kmer-green/10 text-kmer-green text-sm font-medium px-3 py-1 rounded-full">
                        {category.name}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default SellerCategories;
