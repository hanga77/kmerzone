import React from 'react';
import { FacebookIcon, TwitterIcon, InstagramIcon, OrangeMoneyLogo, MtnMomoLogo, LogoIcon } from './Icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white dark:bg-gray-950">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About KMER ZONE */}
          <div className="flex flex-col items-start">
            <LogoIcon className="h-10 mb-4" />
            <p className="text-gray-400">Le meilleur du Cameroun, à portée de main. Notre mission est de connecter les commerçants locaux aux consommateurs.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Liens Rapides</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">À propos de nous</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Carrières</a></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Pour les Vendeurs</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Vendre sur KMER ZONE</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Centre de formation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Logistique & Livraison</a></li>
            </ul>
          </div>

          {/* Social & Payments */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Suivez-nous</h3>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-gray-400 hover:text-white"><FacebookIcon className="h-6 w-6" /></a>
              <a href="#" className="text-gray-400 hover:text-white"><TwitterIcon className="h-6 w-6" /></a>
              <a href="#" className="text-gray-400 hover:text-white"><InstagramIcon className="h-6 w-6" /></a>
            </div>
            <h3 className="text-lg font-bold mb-4 text-white">Paiements Mobiles</h3>
            <div className="flex items-center space-x-4">
              <OrangeMoneyLogo className="h-8" />
              <MtnMomoLogo className="h-8" />
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 dark:border-gray-800 pt-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} KMER ZONE. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;