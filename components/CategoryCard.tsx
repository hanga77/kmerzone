import React from 'react';
import type { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onClick: (categoryName: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  return (
    <button onClick={() => onClick(category.name)} className="group block text-center focus:outline-none focus:ring-2 focus:ring-kmer-green focus:ring-offset-2 rounded-lg">
      <div className="relative rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300">
        <img src={category.imageUrl} alt={category.name} className="w-full h-40 object-cover transform group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
             <h3 className="text-white text-xl font-bold" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>{category.name}</h3>
        </div>
      </div>
    </button>
  );
};

export default CategoryCard;
