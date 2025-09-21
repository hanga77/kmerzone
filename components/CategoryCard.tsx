import React from 'react';
import type { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onClick: (categoryId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  return (
    <button 
      onClick={() => onClick(category.id)}
      className="group relative block w-full aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      <img 
        src={category.imageUrl} 
        alt={category.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-colors duration-300 flex items-center justify-center p-2">
        <h3 className="text-white text-lg font-bold text-center" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>{category.name}</h3>
      </div>
    </button>
  );
};

export default CategoryCard;
