import React, { useState } from 'react';
import type { FlashSale } from '../types';

interface FlashSaleFormProps {
  onSave: (flashSale: Omit<FlashSale, 'id' | 'products'>) => void;
  onCancel: () => void;
}

const FlashSaleForm: React.FC<FlashSaleFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSave = () => {
    if (!name || !startDate || !endDate) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
     if (new Date(startDate) >= new Date(endDate)) {
      alert("La date de fin doit être postérieure à la date de début.");
      return;
    }
    onSave({ name, startDate, endDate });
  };


  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 dark:text-white">Créer un événement Vente Flash</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="fsName" className="block text-sm font-medium dark:text-gray-300">Nom de l'événement (ex: Black Friday)</label>
          <input type="text" id="fsName" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fsStartDate" className="block text-sm font-medium dark:text-gray-300">Date de début</label>
            <input type="date" id="fsStartDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label htmlFor="fsEndDate" className="block text-sm font-medium dark:text-gray-300">Date de fin</label>
            <input type="date" id="fsEndDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
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