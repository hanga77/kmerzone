import React, { useState } from 'react';
import type { FlashSale } from '../types';
import { ExclamationTriangleIcon } from './Icons';

interface FlashSaleFormProps {
  onSave: (flashSale: Omit<FlashSale, 'id' | 'products'>) => void;
  onCancel: () => void;
}

const FlashSaleForm: React.FC<FlashSaleFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; startDate?: string; endDate?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Le nom de l'événement est requis.";
    }
    if (!startDate) {
      newErrors.startDate = "La date et l'heure de début sont requises.";
    }
    if (!endDate) {
      newErrors.endDate = "La date et l'heure de fin sont requises.";
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (start >= end) {
        newErrors.endDate = "La date de fin doit être postérieure à la date de début.";
      }
      
      if (end < now) {
        newErrors.endDate = "La date de fin ne peut pas être dans le passé.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({ name, startDate, endDate });
    }
  };


  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 dark:text-white">Créer un événement Vente Flash</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="fsName" className="block text-sm font-medium dark:text-gray-300">Nom de l'événement (ex: Black Friday)</label>
          <input 
            type="text" 
            id="fsName" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 ${errors.name ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "fsName-error" : undefined}
          />
          {errors.name && (
            <div id="fsName-error" className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>{errors.name}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fsStartDate" className="block text-sm font-medium dark:text-gray-300">Date et heure de début</label>
            <input 
                type="datetime-local" 
                id="fsStartDate" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 ${errors.startDate ? 'border-red-500' : ''}`}
                aria-invalid={!!errors.startDate}
                aria-describedby={errors.startDate ? "fsStartDate-error" : undefined}
            />
            {errors.startDate && (
                <div id="fsStartDate-error" className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span>{errors.startDate}</span>
                </div>
            )}
          </div>
          <div>
            <label htmlFor="fsEndDate" className="block text-sm font-medium dark:text-gray-300">Date et heure de fin</label>
            <input 
                type="datetime-local" 
                id="fsEndDate" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 ${errors.endDate ? 'border-red-500' : ''}`}
                aria-invalid={!!errors.endDate}
                aria-describedby={errors.endDate ? "fsEndDate-error" : undefined}
            />
            {errors.endDate && (
                <div id="fsEndDate-error" className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span>{errors.endDate}</span>
                </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <button onClick={onCancel} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-500">
            Annuler
          </button>
          <button onClick={handleSave} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
            Créer l'événement
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleForm;