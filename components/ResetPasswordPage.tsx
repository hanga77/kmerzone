import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, CheckCircleIcon } from './Icons';

interface ResetPasswordPageProps {
  onPasswordReset: (newPassword: string) => void;
  onNavigateLogin: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onPasswordReset, onNavigateLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError('');
    onPasswordReset(password);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="container mx-auto px-6 py-12 flex justify-center">
        <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-lg shadow-xl max-w-md w-full">
          <CheckCircleIcon className="w-16 h-16 text-kmer-green mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Mot de passe réinitialisé !</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <button
            onClick={onNavigateLogin}
            className="w-full bg-kmer-green text-white font-bold py-3 px-6 rounded-full hover:bg-green-700 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-12 flex justify-center">
      <div className="max-w-md w-full">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Réinitialiser votre mot de passe</h1>
            
            {error && <p className="text-red-500 text-sm text-center mb-4 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="new-password">
                Nouveau mot de passe
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                id="new-password"
                type="password"
                placeholder="******************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirm-password">
                Confirmer le mot de passe
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                id="confirm-password"
                type="password"
                placeholder="******************"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <button
              className="w-full bg-kmer-green text-white font-bold py-2 px-4 rounded-full hover:bg-green-700 transition-colors"
              type="submit"
            >
              Définir le nouveau mot de passe
            </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;