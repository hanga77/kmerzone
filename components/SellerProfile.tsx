

import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, PhotoIcon } from './Icons';
import type { Store } from '../types';

interface SellerProfileProps {
  store: Store;
  onBack: () => void;
  onUpdateProfile: (updatedData: Partial<Store>) => void;
}

const SellerProfile: React.FC<SellerProfileProps> = ({ store, onBack, onUpdateProfile }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    shopName: store.name || '',
    email: user?.email || '',
    location: store.location || 'Douala',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logoUrl);
  const [bannerPreview, setBannerPreview] = useState<string | null>(store.bannerUrl || null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: formData.shopName,
      location: formData.location,
      logoUrl: logoPreview || store.logoUrl,
      bannerUrl: bannerPreview || store.bannerUrl,
    });
    alert('Profil mis à jour avec succès !');
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour au tableau de bord
      </button>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Modifier le profil de la boutique</h1>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
            <div className="mt-1 flex items-center gap-4">
              <img 
                  src={logoPreview || undefined} 
                  alt="Logo de la boutique" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg bg-gray-200"
              />
              <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className="bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                  Changer le logo
              </button>
              <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoChange}
                  className="hidden"
                  accept="image/*"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bannière (Ratio 16:6)</label>
            <div className="mt-1 aspect-[16/6] w-full rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative group">
                {bannerPreview ? (
                    <img src={bannerPreview} alt="Aperçu de la bannière" className="h-full w-full object-cover rounded-md"/>
                ) : (
                    <PhotoIcon className="h-12 w-12 text-gray-400"/>
                )}
                <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Changer la bannière"
                >
                    <PencilSquareIcon className="w-8 h-8"/>
                </button>
            </div>
             <input
                type="file"
                ref={bannerFileInputRef}
                onChange={handleBannerChange}
                className="hidden"
                accept="image/*"
            />
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