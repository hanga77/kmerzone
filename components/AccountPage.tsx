import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, UserCircleIcon, MapPinIcon, ShieldCheckIcon, TrashIcon, PencilSquareIcon, StarIcon, CheckCircleIcon, PlusIcon, XIcon } from './Icons';
import type { Address } from '../types';

interface AddressFormProps {
    address?: Address | null;
    onSave: (address: Omit<Address, 'id' | 'isDefault'>) => void;
    onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ address, onSave, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        fullName: address?.fullName || user?.name || '',
        phone: address?.phone || '',
        address: address?.address || '',
        city: address?.city || 'Douala'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 my-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-4 animate-in">
            <h3 className="font-semibold text-lg dark:text-white">{address ? 'Modifier' : 'Ajouter'} une adresse</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Nom complet</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label className="text-sm font-medium">Téléphone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            </div>
            <div>
                <label className="text-sm font-medium">Adresse complète</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Ex: Rue 123, Quartier Bonapriso" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
                <label className="text-sm font-medium">Ville</label>
                <select name="city" value={formData.city} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="Douala">Douala</option>
                    <option value="Yaoundé">Yaoundé</option>
                </select>
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 py-2 rounded-md">Annuler</button>
                <button type="submit" className="bg-kmer-green text-white font-semibold px-4 py-2 rounded-md">Enregistrer</button>
            </div>
        </form>
    );
};

const AccountPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { user, updateUserInfo, changePassword, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');
    
    // Profile state
    const [name, setName] = useState(user?.name || '');
    const [isEditingName, setIsEditingName] = useState(false);
    
    // Security state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Addresses state
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const handleUpdateName = (e: React.FormEvent) => {
        e.preventDefault();
        if (user && name.trim()) {
            updateUserInfo(user.id, { name });
            setIsEditingName(false);
        }
    };
    
    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        if (newPassword.length < 6) {
            setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }
        if (user) {
            const success = changePassword(user.id, oldPassword, newPassword);
            if(success) {
                setPasswordSuccess("Mot de passe modifié avec succès !");
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordError("L'ancien mot de passe est incorrect.");
            }
        }
    };

    const handleSaveAddress = (addressData: Omit<Address, 'id' | 'isDefault'>) => {
        if (user) {
            if (editingAddress) {
                updateAddress(user.id, { ...editingAddress, ...addressData });
            } else {
                addAddress(user.id, addressData);
            }
        }
        setIsAddingAddress(false);
        setEditingAddress(null);
    };

    const handleDeleteAddress = (addressId: string) => {
        if(user && window.confirm("Êtes-vous sûr de vouloir supprimer cette adresse ?")) {
            deleteAddress(user.id, addressId);
        }
    }

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 sm:px-6 py-12">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
                <ArrowLeftIcon className="w-5 h-5" />
                Retour à l'accueil
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Mon Compte</h1>

            <div className="lg:flex lg:gap-8">
                <aside className="w-full lg:w-64 mb-8 lg:mb-0 flex-shrink-0">
                    <nav className="flex lg:flex-col p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 w-full text-left p-3 rounded-md font-semibold ${activeTab === 'profile' ? 'bg-white dark:bg-gray-700 text-kmer-green' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}><UserCircleIcon className="w-5 h-5"/> Profil</button>
                        <button onClick={() => setActiveTab('addresses')} className={`flex items-center gap-3 w-full text-left p-3 rounded-md font-semibold ${activeTab === 'addresses' ? 'bg-white dark:bg-gray-700 text-kmer-green' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}><MapPinIcon className="w-5 h-5"/> Adresses</button>
                        <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 w-full text-left p-3 rounded-md font-semibold ${activeTab === 'security' ? 'bg-white dark:bg-gray-700 text-kmer-green' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}><ShieldCheckIcon className="w-5 h-5"/> Sécurité</button>
                    </nav>
                </aside>
                
                <main className="flex-grow bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-sm">
                    {activeTab === 'profile' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Informations Personnelles</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-500">Nom</p>
                                        <p className="font-semibold">{user.name}</p>
                                    </div>
                                    <button onClick={() => setIsEditingName(true)} className="text-sm text-kmer-green font-semibold hover:underline">Modifier</button>
                                </div>
                                {isEditingName && (
                                    <form onSubmit={handleUpdateName} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md flex gap-2">
                                        <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md"/>
                                        <button type="submit" className="bg-kmer-green text-white px-4 rounded-md">Ok</button>
                                        <button type="button" onClick={() => { setIsEditingName(false); setName(user.name); }} className="bg-gray-200 px-4 rounded-md">X</button>
                                    </form>
                                )}
                                 <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-semibold">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'addresses' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Carnet d'adresses</h2>
                                <button onClick={() => { setIsAddingAddress(true); setEditingAddress(null); }} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Ajouter</button>
                            </div>
                            {(isAddingAddress || editingAddress) && <AddressForm address={editingAddress} onSave={handleSaveAddress} onCancel={() => { setIsAddingAddress(false); setEditingAddress(null); }}/>}
                            <div className="space-y-4">
                                {(user.addresses || []).length > 0 ? (
                                    (user.addresses || []).map(addr => (
                                        <div key={addr.id} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{addr.fullName}</p>
                                                    {addr.isDefault && <span className="text-xs bg-kmer-green/20 text-kmer-green font-semibold px-2 py-0.5 rounded-full">Par défaut</span>}
                                                </div>
                                                <address className="not-italic text-sm text-gray-600 dark:text-gray-400">
                                                    {addr.address}, {addr.city}<br/>{addr.phone}
                                                </address>
                                                {!addr.isDefault && <button onClick={() => setDefaultAddress(user.id, addr.id!)} className="text-sm text-gray-500 hover:underline mt-2">Définir par défaut</button>}
                                            </div>
                                            <div className="flex items-center flex-shrink-0">
                                                <button onClick={() => setEditingAddress(addr)} className="text-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><PencilSquareIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleDeleteAddress(addr.id!)} className="text-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Vous n'avez aucune adresse enregistrée.</p>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'security' && (
                        <div>
                             <h2 className="text-2xl font-bold mb-6">Changer le mot de passe</h2>
                             <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                 {passwordError && <p className="text-red-500 text-sm p-3 bg-red-100 dark:bg-red-900/50 rounded-md">{passwordError}</p>}
                                 {passwordSuccess && <p className="text-green-600 text-sm p-3 bg-green-100 dark:bg-green-900/50 rounded-md">{passwordSuccess}</p>}
                                 <div>
                                     <label className="block text-sm font-medium">Ancien mot de passe</label>
                                     <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium">Nouveau mot de passe</label>
                                     <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium">Confirmer le nouveau mot de passe</label>
                                     <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                                 </div>
                                 <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg">Mettre à jour</button>
                             </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AccountPage;