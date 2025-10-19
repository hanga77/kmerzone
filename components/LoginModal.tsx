import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onForgotPassword: () => void;
  onSelectSellerType: (type: 'physical' | 'service') => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess, onForgotPassword, onSelectSellerType }) => {
  const { t } = useLanguage();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<'type' | 'form'>('type');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For seller
  const [firstName, setFirstName] = useState(''); // For customer
  const [lastName, setLastName] = useState(''); // For customer
  const [phone, setPhone] = useState(''); // For customer
  const [birthDate, setBirthDate] = useState(''); // For customer
  const [address, setAddress] = useState(''); // For customer
  const [city, setCity] = useState('Douala'); // For customer
  const [accountType, setAccountType] = useState<'customer' | 'seller'>('customer');
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  useEffect(() => {
    setError(null);
  }, [email, password, name, view, registerStep]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez entrer une adresse e-mail et un mot de passe.");
      return;
    }
    const loggedInUser = await login(email, password);
    if (loggedInUser) {
      onLoginSuccess(loggedInUser);
    } else {
      setError("Email ou mot de passe incorrect.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez remplir les champs e-mail et mot de passe.");
      return;
    }

    let registeredUser: User | null = null;
    
    // For both seller types, we just create a generic 'seller' user first.
    // The specific flow (physical vs service) is handled by the parent component after login success.
    if (accountType === 'customer') {
      if (!firstName || !lastName) {
        setError("Veuillez renseigner votre prénom et nom.");
        return;
      }
      const fullName = `${firstName} ${lastName}`;
      const newAddress = address ? { fullName, phone: phone || '', address, city, label: 'Maison' } : undefined;
      registeredUser = await register(fullName, email, password, accountType, phone, birthDate, newAddress);
    } else { // seller
      if (!name) {
        setError("Veuillez renseigner votre nom complet.");
        return;
      }
      registeredUser = await register(name, email, password, accountType);
    }

    if (registeredUser) {
       onLoginSuccess(registeredUser);
    } else {
        setError("Un compte avec cet email existe déjà.");
    }
  };
  
  const handleSellerTypeSelection = (type: 'physical' | 'service') => {
      onSelectSellerType(type);
      setAccountType('seller');
      setRegisterStep('form');
  }

  const renderRegisterContent = () => {
      if (registerStep === 'type') {
          return (
               <>
                  <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">Créer un compte</h2>
                   <div className="space-y-4">
                        <button type="button" onClick={() => { setAccountType('customer'); setRegisterStep('form'); }} className="w-full text-left p-4 border rounded-lg hover:border-kmer-green">
                            <h3 className="font-bold">{t('login.customer')}</h3>
                            <p className="text-sm text-gray-500">Achetez des produits et services.</p>
                        </button>
                         <div className="p-4 border rounded-lg">
                            <h3 className="font-bold">{t('login.seller')}</h3>
                            <p className="text-sm text-gray-500 mb-3">Vendez des produits ou proposez vos services.</p>
                             <div className="flex gap-2">
                                <button type="button" onClick={() => handleSellerTypeSelection('physical')} className="w-full bg-kmer-green/10 text-kmer-green font-semibold p-2 rounded-md hover:bg-kmer-green/20">{t('login.physicalGoods')}</button>
                                <button type="button" onClick={() => handleSellerTypeSelection('service')} className="w-full bg-kmer-green/10 text-kmer-green font-semibold p-2 rounded-md hover:bg-kmer-green/20">{t('login.services')}</button>
                            </div>
                        </div>
                   </div>
                   <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                        Déjà un compte? <button type="button" onClick={() => setView('login')} className="font-bold text-kmer-green hover:underline">Se connecter</button>
                    </p>
               </>
          )
      }
      
      return (
           <form onSubmit={handleRegister}>
              {accountType === 'customer' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-firstName">Prénom</label>
                          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green" id="register-firstName" type="text" placeholder="Jean" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                      </div>
                      <div>
                          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-lastName">Nom</label>
                          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green" id="register-lastName" type="text" placeholder="Dupont" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                      </div>
                  </div>
                   <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-phone">Téléphone</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600" id="register-phone" type="tel" placeholder="690123456" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                   <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-birthDate">Date de naissance</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600" id="register-birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-name">{t('login.fullNameManager')}</label>
                  <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600" id="register-name" type="text" placeholder="Jean Dupont" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-email">Adresse e-mail</label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600" id="register-email" type="email" placeholder="votre.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-password">Mot de passe</label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600" id="register-password" type="password" placeholder="******************" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
              <div className="flex flex-col items-center justify-between mt-6">
                <button className="bg-kmer-green hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline w-full" type="submit">S'inscrire</button>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                    Déjà un compte? <button type="button" onClick={() => setView('login')} className="font-bold text-kmer-green hover:underline">Se connecter</button>
                </p>
              </div>
            </form>
      )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full relative overflow-y-auto max-h-[90vh] ${view === 'register' && registerStep === 'form' ? 'max-w-xl' : 'max-w-sm'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <XIcon className="h-6 w-6" />
        </button>

        {view === 'login' ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">Connexion</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="login-email">
                  Adresse e-mail
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                  id="login-email"
                  type="email"
                  placeholder="votre.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-baseline">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="login-password">
                    Mot de passe
                  </label>
                  <button type="button" onClick={onForgotPassword} className="inline-block align-baseline font-bold text-sm text-kmer-green hover:text-green-700">
                    Mot de passe oublié ?
                  </button>
                </div>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                  id="login-password"
                  type="password"
                  placeholder="******************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
               {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
              <div className="flex flex-col items-center justify-between">
                <button
                  className="bg-kmer-green hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline w-full"
                  type="submit"
                >
                  Se connecter
                </button>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                    Nouveau sur KMER ZONE? <button type="button" onClick={() => { setView('register'); setRegisterStep('type'); }} className="font-bold text-kmer-green hover:underline">Créer un compte</button>
                </p>
                 <div className="text-center text-gray-500 dark:text-gray-400 text-xs mt-4 space-y-1 bg-gray-100 dark:bg-gray-700 p-3 rounded-md w-full max-h-40 overflow-y-auto">
                    <p className="font-bold">Comptes de test (mot de passe : "password")</p>
                    <p className="text-left"><strong className="text-blue-500">Client:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded break-all">customer@example.com</code></p>
                    <p className="text-left"><strong className="text-purple-500">Admin:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded break-all">superadmin@example.com</code></p>
                    <p className="text-left"><strong className="text-green-500">Vendeurs:</strong></p>
                    <ul className="list-none text-left pl-2">
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded break-all">seller@example.com</code></li>
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded break-all">mamaafrica@example.com</code></li>
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded break-all">electro@example.com</code></li>
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded break-all">soaps@example.com</code></li>
                    </ul>
                    <p className="text-left"><strong className="text-cyan-500">Livreurs:</strong></p>
                    <ul className="list-none text-left pl-2">
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded break-all">agent1@example.com</code></li>
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded break-all">agent2@example.com</code></li>
                    </ul>
                    <p className="text-left"><strong className="text-indigo-500">Agent Dépôt:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded break-all">depot@example.com</code></p>
                </div>
              </div>
            </form>
          </>
        ) : (
          renderRegisterContent()
        )}
      </div>
    </div>
  );
};

export default LoginModal;