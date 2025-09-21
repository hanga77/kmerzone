import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onForgotPassword: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess, onForgotPassword }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  useEffect(() => {
    setError(null);
  }, [email, password, name, view]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez entrer une adresse e-mail et un mot de passe.");
      return;
    }
    const loggedInUser = login(email, password);
    if (loggedInUser) {
      onLoginSuccess(loggedInUser);
    } else {
      setError("Email ou mot de passe incorrect.");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    const registeredUser = register(name, email, password);
    if (registeredUser) {
       onLoginSuccess(registeredUser);
    } else {
        setError("Un compte avec cet email existe déjà.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-sm w-full relative">
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
                    Nouveau sur KMER ZONE? <button type="button" onClick={() => setView('register')} className="font-bold text-kmer-green hover:underline">Créer un compte</button>
                </p>
                 <div className="text-center text-gray-500 dark:text-gray-400 text-xs mt-4 space-y-1 bg-gray-100 dark:bg-gray-700 p-3 rounded-md w-full">
                    <p className="font-bold">Comptes de test (mot de passe : "password")</p>
                    <p className="text-left"><strong className="text-blue-500">Client:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">customer@example.com</code></p>
                    <p className="text-left"><strong className="text-purple-500">Admin:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">superadmin@example.com</code></p>
                    <p className="text-left"><strong className="text-green-500">Vendeurs:</strong></p>
                    <ul className="list-none text-left pl-2">
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">seller@example.com</code></li>
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">mamaafrica@example.com</code></li>
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">electro@example.com</code></li>
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">soaps@example.com</code></li>
                    </ul>
                    <p className="text-left"><strong className="text-cyan-500">Livreurs:</strong></p>
                    <ul className="list-none text-left pl-2">
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">agent1@example.com</code></li>
                        <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">agent2@example.com</code></li>
                    </ul>
                    <p className="text-left"><strong className="text-indigo-500">Agent Dépôt:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">depot@example.com</code></p>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">Créer un compte</h2>
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-name">
                  Nom complet
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                  id="register-name"
                  type="text"
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-email">
                  Adresse e-mail
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                  id="register-email"
                  type="email"
                  placeholder="votre.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-password">
                  Mot de passe
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                  id="register-password"
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
                  S'inscrire
                </button>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                    Déjà un compte? <button type="button" onClick={() => setView('login')} className="font-bold text-kmer-green hover:underline">Se connecter</button>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
