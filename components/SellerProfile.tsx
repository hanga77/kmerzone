import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, PencilSquareIcon } from './Icons';
import type { Store } from '../types';

interface SellerProfileProps {
  store: Store;
  onBack: () => void;
  onUpdateProfile: (storeId: string, updatedData: { shopName: string; location: string; logoUrl: string; }) => void;
}

const SellerProfile: React.FC<SellerProfileProps> = ({ store, onBack, onUpdateProfile }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    shopName: store.name || '',
    email: user?.email || '',
    location: store.location || 'Douala',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(store.id, {
      shopName: formData.shopName,
      location: formData.location,
      logoUrl: logoPreview || store.logoUrl,
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative group mb-4">
                <img 
                    src={logoPreview || store.logoUrl} 
                    alt="Logo de la boutique" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Changer le logo"
                >
                    <PencilSquareIcon className="w-8 h-8"/>
                </button>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                className="hidden"
                accept="image/*"
            />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Modifier le profil</h1>
          </div>
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