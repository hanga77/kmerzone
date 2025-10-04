import React, { useState, useEffect } from 'react';
import type { PaymentRequest, PaymentMethod } from '../types';
import { XIcon, CheckCircleIcon, OrangeMoneyLogo, MtnMomoLogo, VisaIcon, MastercardIcon, PaypalIcon } from './Icons';

interface PaymentModalProps {
  paymentRequest: PaymentRequest;
  paymentMethods: PaymentMethod[];
  onClose: () => void;
}

const getPaymentIcon = (id: string) => {
    switch(id) {
        case 'pm1': return <OrangeMoneyLogo className="h-10 w-16"/>;
        case 'pm2': return <MtnMomoLogo className="h-10 w-16"/>;
        case 'pm3': return <VisaIcon className="h-10 w-16"/>;
        case 'pm4': return <MastercardIcon className="h-10 w-16"/>;
        case 'pm5': return <PaypalIcon className="h-10 w-16"/>;
        default: return null;
    }
}

const PaymentModal: React.FC<PaymentModalProps> = ({ paymentRequest, paymentMethods, onClose }) => {
  const [step, setStep] = useState<'selection' | 'processing' | 'success'>('selection');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(paymentMethods[0]?.id || null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const handlePay = () => {
    if (!selectedMethodId) {
      setError("Veuillez sélectionner un moyen de paiement.");
      return;
    }
    // Simple phone number validation for mobile money
    if (['pm1', 'pm2'].includes(selectedMethodId) && !/^[6-9]\d{8}$/.test(phoneNumber)) {
        setError("Veuillez entrer un numéro de téléphone camerounais valide (ex: 699887766).");
        return;
    }

    setError('');
    setStep('processing');

    // Simulate API call
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        paymentRequest.onSuccess({
          methodId: selectedMethodId,
          transactionId: `TXN_${Date.now()}`,
          phoneNumber: phoneNumber,
        });
        // onClose will be called by the parent component after onSuccess logic
      }, 1500);
    }, 2500);
  };

  const renderContent = () => {
    switch (step) {
      case 'selection':
        return (
          <>
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">{paymentRequest.reason}</p>
              <p className="text-4xl font-bold text-gray-800 dark:text-white mt-2">
                {paymentRequest.amount.toLocaleString('fr-CM')} FCFA
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Choisissez un moyen de paiement
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map(method => {
                    const IconComponent = getPaymentIcon(method.id);
                    return (
                        <button
                            key={method.id}
                            onClick={() => setSelectedMethodId(method.id)}
                            className={`p-3 border-2 rounded-lg flex items-center justify-center transition-colors h-16 ${
                            selectedMethodId === method.id ? 'border-kmer-green' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                            }`}
                        >
                            {method.imageUrl ? 
                                <img src={method.imageUrl} alt={method.name} className="h-10 object-contain"/> : 
                                IconComponent
                            }
                        </button>
                    )
                })}
              </div>
            </div>

            {selectedMethodId && ['pm1', 'pm2'].includes(selectedMethodId) && (
              <div className="mt-4">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="699887766"
                  className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            )}
            
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

            <button
              onClick={handlePay}
              className="w-full mt-6 bg-kmer-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Payer
            </button>
          </>
        );
      case 'processing':
        return (
          <div className="text-center py-12">
            <svg className="animate-spin h-12 w-12 text-kmer-green mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 font-semibold text-gray-700 dark:text-gray-300">Traitement en cours...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Veuillez confirmer sur votre téléphone si nécessaire.</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-kmer-green mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Paiement réussi !</h3>
            <p className="text-gray-500 dark:text-gray-400">Votre transaction a été validée.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-sm w-full relative animate-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <XIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-white">Finaliser le Paiement</h2>
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentModal;