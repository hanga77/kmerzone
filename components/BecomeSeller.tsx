import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import type { SiteSettings } from '../types';

interface BecomeSellerProps {
    onBack: () => void;
    onBecomeSeller: (shopName: string, location: string, neighborhood: string, sellerFirstName: string, sellerLastName: string, sellerPhone: string, physicalAddress: string, latitude?: number, longitude?: number) => void;
    onRegistrationSuccess: () => void;
    siteSettings: SiteSettings;
}

const BecomeSeller: React.FC<BecomeSellerProps> = ({ onBack, onBecomeSeller, onRegistrationSuccess, siteSettings }) => {
  const { user } = useAuth();
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('Douala');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (user) {
      const nameParts = user.name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [user]);

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                setIsDetecting(false);
            },
            (error) => {
                alert("Erreur de géolocalisation: " + error.message);
                setIsDetecting(false);
            }
        );
    } else {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert("Vous devez être connecté pour devenir vendeur.");
        return;
    }
    if (!shopName || !location || !firstName || !lastName || !phone || !neighborhood || !physicalAddress) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    onBecomeSeller(shopName, location, neighborhood, firstName, lastName, phone, physicalAddress, latitude, longitude);

    alert("Félicitations ! Votre demande de création de boutique a été envoyée. Elle est en attente de validation par un administrateur. Vous serez notifié une fois qu'elle sera active.");
    onRegistrationSuccess();
  };

  if (user && user.role === 'seller') {
    return (
        <div className="container mx-auto px-6 py-12 text-center">
            <h1 className="text-2xl font-bold">Vous êtes déjà un vendeur !</h1>
            <button onClick={onRegistrationSuccess} className="mt-6 bg-kmer-green text-white font-bold py-2 px-6 rounded-full">
                Aller au tableau de bord
            </button>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
       <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour à l'accueil
      </button>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">Devenez Vendeur sur KMER ZONE</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Rejoignez notre place de marché et touchez des milliers de clients à travers le Cameroun. Remplissez le formulaire ci-dessous pour commencer.</p>
        
        {siteSettings.isRentEnabled && (
            <div className="my-4 p-4 bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 rounded-r-lg">
                <p className="font-bold">Information sur le Loyer</p>
                <p className="text-sm">Veuillez noter qu'un loyer mensuel de <strong>{siteSettings.rentAmount.toLocaleString('fr-CM')} FCFA</strong> est requis pour maintenir votre boutique active sur notre plateforme.</p>
            </div>
        )}
        
        {!user ? (
            <div className="text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-4 rounded-md">
              <p>Vous devez être connecté pour pouvoir vous inscrire en tant que vendeur.</p> 
              <p className='text-sm mt-2'>Veuillez vous connecter via le bouton en haut à droite.</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 dark:border-gray-600 dark:text-white">Informations sur la boutique</h3>
                  <div className="space-y-4">
                    <div>
                        <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de la boutique</label>
                        <input type="text" id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ville principale</label>
                        <select id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600" required>
                          <option value="Douala">Douala</option>
                          <option value="Yaoundé">Yaoundé</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quartier</label>
                        <input type="text" id="neighborhood" placeholder="Ex: Akwa, Bastos" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600" required />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="physicalAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse Complète / Point de Repère</label>
                      <input type="text" id="physicalAddress" placeholder="Ex: 45 Avenue de la Mode, En face de la pharmacie" value={physicalAddress} onChange={(e) => setPhysicalAddress(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                  </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 dark:border-gray-600 dark:text-white">Emplacement de la Boutique</h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                        <button type="button" onClick={handleDetectLocation} disabled={isDetecting} className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300">
                            {isDetecting ? 'Détection en cours...' : 'Détecter ma position automatiquement'}
                        </button>
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Ou entrez les coordonnées manuellement :</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="latitude" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                                <input type="number" step="any" id="latitude" value={latitude || ''} onChange={e => setLatitude(parseFloat(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label htmlFor="longitude" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                                <input type="number" step="any" id="longitude" value={longitude || ''} onChange={e => setLongitude(parseFloat(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 dark:border-gray-600 dark:text-white">Informations personnelles du vendeur</h3>
                  <div className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
                          <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600" required />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de famille</label>
                          <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600" required />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact du vendeur</label>
                        <input type="tel" id="phone" placeholder="+237 6XX XX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600" required />
                      </div>
                  </div>
                </div>
                
                <div>
                    <button type="submit" className="w-full bg-kmer-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">
                        Soumettre ma demande
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default BecomeSeller;