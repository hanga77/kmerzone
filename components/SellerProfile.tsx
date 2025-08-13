import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon } from './Icons';

interface SellerProfileProps {
  onBack: () => void;
}

const SellerProfile: React.FC<SellerProfileProps> = ({ onBack }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    shopName: user?.shopName || '',
    email: user?.email || '',
    location: user?.location || 'Douala',
  });

  if (!user || user.role !== 'seller') {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <p>Utilisateur non trouvé ou non vendeur.</p>
        <button onClick={onBack} className="mt-4 bg-kmer-green text-white font-bold py-2 px-6 rounded-full">
          Retour
        </button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: formData.shopName,
      shopName: formData.shopName,
      location: formData.location,
    });
    alert('Profil mis à jour avec succès !');
    onBack();
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour au tableau de bord
      </button>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Modifier mon profil vendeur</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de la boutique</label>
            <input type="text" id="shopName" name="shopName" value={formData.shopName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email de contact (non modifiable)</label>
            <input type="email" id="email" name="email" value={formData.email} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" required readOnly />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Votre ville</label>
            <select id="location" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option>Douala</option>
              <option>Yaoundé</option>
            </select>
          </div>
          <div>
            <button type="submit" className="w-full bg-kmer-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerProfile;
