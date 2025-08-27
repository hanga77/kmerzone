import React, { useState } from 'react';
import { XIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onEmailSubmit: (email: string) => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, onEmailSubmit }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEmailSubmit(email);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-sm w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <XIcon className="h-6 w-6" />
        </button>

        {submitted ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Vérifiez vos e-mails</h2>
            <p className="text-gray-600 dark:text-gray-400">Si un compte existe pour <strong>{email}</strong>, vous y trouverez un lien pour réinitialiser votre mot de passe.</p>
            <button
              onClick={onClose}
              className="mt-6 bg-kmer-green hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline w-full"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-4 dark:text-white">Mot de passe oublié</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Ne vous inquiétez pas. Entrez votre email et nous vous enverrons un lien de réinitialisation.</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="forgot-email">
                  Adresse e-mail
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-kmer-green"
                  id="forgot-email"
                  type="email"
                  placeholder="votre.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col items-center justify-between">
                <button
                  className="bg-kmer-green hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline w-full"
                  type="submit"
                >
                  Envoyer le lien
                </button>
                 <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 text-gray-500 dark:text-gray-400 text-sm hover:underline"
                >
                  Annuler
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;