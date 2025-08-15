import React from 'react';
import { FacebookIcon, TwitterIcon, InstagramIcon, OrangeMoneyLogo, MtnMomoLogo, LogoIcon, VisaIcon, MastercardIcon, PaypalIcon } from './Icons';

interface FooterProps {
  onNavigate: (title: string, content: string) => void;
}

const infoContent = {
  about: {
    title: "À propos de KMER ZONE",
    content: "KMER ZONE est la première plateforme e-commerce camerounaise dédiée à la mise en relation directe des commerçants locaux et des consommateurs. Notre mission est de démocratiser l'accès au commerce en ligne, de valoriser les produits locaux et de simplifier l'expérience d'achat pour tous les Camerounais."
  },
  contact: {
    title: "Contactez-nous",
    content: "Pour toute question, partenariat ou assistance, veuillez nous contacter à l'adresse suivante : support@kmerzone.com. Notre équipe est disponible 24/7 pour vous aider."
  },
  faq: {
    title: "Foire Aux Questions (FAQ)",
    content: "Q: Quels sont les délais de livraison ?\nR: Les délais varient entre 24h et 72h en fonction de votre localisation et de celle du vendeur.\n\nQ: Les paiements sont-ils sécurisés ?\nR: Oui, nous utilisons les plateformes de paiement mobile les plus fiables du pays pour garantir la sécurité de vos transactions."
  },
  careers: {
    title: "Carrières",
    content: "Rejoignez une équipe dynamique et passionnée qui révolutionne le e-commerce au Cameroun ! Consultez nos offres d'emploi sur notre page LinkedIn ou envoyez votre candidature spontanée à careers@kmerzone.com."
  },
  sell: {
    title: "Vendre sur KMER ZONE",
    content: "Augmentez votre visibilité et vos ventes en rejoignant notre marketplace. L'inscription est simple et rapide. Cliquez sur 'Devenir vendeur' en haut de la page pour commencer votre aventure avec nous !"
  }
};

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
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
              <li><button onClick={() => onNavigate(infoContent.about.title, infoContent.about.content)} className="text-gray-400 hover:text-white">À propos de nous</button></li>
              <li><button onClick={() => onNavigate(infoContent.contact.title, infoContent.contact.content)} className="text-gray-400 hover:text-white">Contact</button></li>
              <li><button onClick={() => onNavigate(infoContent.faq.title, infoContent.faq.content)} className="text-gray-400 hover:text-white">FAQ</button></li>
              <li><button onClick={() => onNavigate(infoContent.careers.title, infoContent.careers.content)} className="text-gray-400 hover:text-white">Carrières</button></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Pour les Vendeurs</h3>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate(infoContent.sell.title, infoContent.sell.content)} className="text-gray-400 hover:text-white">Vendre sur KMER ZONE</button></li>
              <li><button onClick={() => onNavigate("Centre de formation", "Bientôt disponible : des tutoriels et des guides pour vous aider à maximiser vos ventes.")} className="text-gray-400 hover:text-white">Centre de formation</button></li>
              <li><button onClick={() => onNavigate("Logistique & Livraison", "Notre réseau de livreurs est à votre disposition pour garantir des livraisons rapides et fiables à vos clients.")} className="text-gray-400 hover:text-white">Logistique & Livraison</button></li>
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
              <OrangeMoneyLogo className="h-5" />
              <MtnMomoLogo className="h-6" />
              <VisaIcon className="h-4" />
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