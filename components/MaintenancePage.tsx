import React, { useState, useEffect } from 'react';
import { Cog8ToothIcon } from './Icons';

interface MaintenancePageProps {
  message: string;
  reopenDate: string;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ message, reopenDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(reopenDate) - +new Date();
    let timeLeft: Record<string, number> = {};

    if (difference > 0) {
      timeLeft = {
        jours: Math.floor(difference / (1000 * 60 * 60 * 24)),
        heures: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        secondes: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const hasTimeLeft = Object.keys(timeLeft).length > 0;

  const handleExitMaintenance = () => {
    try {
      const settingsJSON = localStorage.getItem('siteSettings');
      if (settingsJSON) {
        const settings = JSON.parse(settingsJSON);
        if (settings.maintenanceMode) {
          settings.maintenanceMode.isEnabled = false;
          localStorage.setItem('siteSettings', JSON.stringify(settings));
        }
      }
      window.location.reload();
    } catch (e) {
      console.error("Could not exit maintenance mode:", e);
      alert("Impossible de quitter le mode maintenance automatiquement. Veuillez essayer de vider le cache de votre navigateur.");
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
      <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-lg shadow-xl max-w-2xl w-full">
        <Cog8ToothIcon className="h-16 w-16 text-kmer-green mx-auto mb-6 animate-spin-slow" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Site en Maintenance</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">{message}</p>
        
        {hasTimeLeft && (
          <div>
            <p className="text-gray-500 dark:text-gray-300 mb-4">Nous serons de retour dans :</p>
            <div className="flex justify-center items-center gap-4 text-center">
              {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="bg-gray-100 dark:bg-gray-700/50 shadow-inner rounded-lg p-3 min-w-[70px]">
                  <div className="text-3xl font-bold text-kmer-green">{String(value).padStart(2, '0')}</div>
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">{unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={handleExitMaintenance} className="mt-8 text-sm text-gray-500 dark:text-gray-400 hover:underline">
            Cliquer ici pour tenter de forcer la sortie du mode maintenance.
        </button>
      </div>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MaintenancePage;
