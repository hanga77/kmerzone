import React, { useState } from 'react';
import { XIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, register } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Veuillez entrer une adresse e-mail.");
      return;
    }
    const success = login(email, password);
    if (success) {
      onClose();
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    const success = register(name, email);
    if (success) {
      onClose();
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
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="login-password">
                  Mot de passe
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                  id="login-password"
                  type="password"
                  placeholder="******************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
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
                    <p className="font-bold">Comptes de test (tout mot de passe fonctionne)</p>
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
                    <p className="text-left"><strong className="text-blue-500">Agent Dépôt:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">depot@example.com</code></p>
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
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="register-password">
                  Mot de passe
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                  id="register-password"
                  type="password"
                  placeholder="******************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
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