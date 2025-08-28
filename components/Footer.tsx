import React from 'react';
import { FacebookIcon, TwitterIcon, InstagramIcon, OrangeMoneyLogo, MtnMomoLogo, LogoIcon, VisaIcon, MastercardIcon, PaypalIcon } from './Icons';

interface FooterProps {
  onNavigate: (slug: string) => void;
  logoUrl: string;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, logoUrl }) => {
  return (
    <footer className="bg-gray-800 text-white dark:bg-gray-950">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About KMER ZONE */}
          <div className="flex flex-col items-start">
            <LogoIcon className="h-10 mb-4" logoUrl={logoUrl} />
            <p className="text-gray-400">Le meilleur du Cameroun, à portée de main. Notre mission est de connecter les commerçants locaux aux consommateurs.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Liens Rapides</h3>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('about')} className="text-gray-400 hover:text-white">À propos de nous</button></li>
              <li><button onClick={() => onNavigate('contact')} className="text-gray-400 hover:text-white">Contact</button></li>
              <li><button onClick={() => onNavigate('faq')} className="text-gray-400 hover:text-white">FAQ</button></li>
              <li><button onClick={() => onNavigate('careers')} className="text-gray-400 hover:text-white">Carrières</button></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Pour les Vendeurs</h3>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('sell')} className="text-gray-400 hover:text-white">Vendre sur KMER ZONE</button></li>
              <li><button onClick={() => onNavigate('training-center')} className="text-gray-400 hover:text-white">Centre de formation</button></li>
              <li><button onClick={() => onNavigate('logistics')} className="text-gray-400 hover:text-white">Logistique & Livraison</button></li>
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
            <h3 className="text-lg font-bold mb-4 text-white">Moyens de Paiement</h3>
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <OrangeMoneyLogo className="h-6" />
              <MtnMomoLogo className="h-6" />
              <VisaIcon className="h-6" />
              <MastercardIcon className="h-6"/>
              <PaypalIcon className="h-6"/>
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