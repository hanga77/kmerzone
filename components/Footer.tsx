import React from 'react';
import { LogoIcon, OrangeMoneyLogo, MtnMomoLogo, VisaIcon, MastercardIcon, PaypalIcon } from './Icons';
import type { PaymentMethod, SiteSettings } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onNavigate: (slug: string) => void;
  logoUrl: string;
  paymentMethods: PaymentMethod[];
  socialLinks?: SiteSettings['socialLinks'];
  companyName: string;
}

const paymentIconMap: { [key: string]: React.FC<any> } = {
    pm1: OrangeMoneyLogo,
    pm2: MtnMomoLogo,
    pm3: VisaIcon,
    pm4: MastercardIcon,
    pm5: PaypalIcon,
};

const Footer: React.FC<FooterProps> = ({ onNavigate, logoUrl, paymentMethods, socialLinks, companyName }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-800 text-white dark:bg-gray-950">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About KMER ZONE */}
          <div className="flex flex-col items-start">
            <LogoIcon className="h-10 mb-4" logoUrl={logoUrl} />
            <p className="text-gray-400">{t('footer.aboutKmerZone')}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('about')} className="text-gray-400 hover:text-white">{t('footer.aboutUs')}</button></li>
              <li><button onClick={() => onNavigate('contact')} className="text-gray-400 hover:text-white">{t('footer.contact')}</button></li>
              <li><button onClick={() => onNavigate('faq')} className="text-gray-400 hover:text-white">{t('footer.faq')}</button></li>
              <li><button onClick={() => onNavigate('careers')} className="text-gray-400 hover:text-white">{t('footer.careers')}</button></li>
              <li><button onClick={() => onNavigate('terms-of-service')} className="text-gray-400 hover:text-white">{t('footer.terms')}</button></li>
              <li><button onClick={() => onNavigate('privacy-policy')} className="text-gray-400 hover:text-white">{t('footer.privacy')}</button></li>
              <li><button onClick={() => onNavigate('sitemap')} className="text-gray-400 hover:text-white">Plan du site</button></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.forSellers')}</h3>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('sell')} className="text-gray-400 hover:text-white">{t('footer.sellOnKmerZone')}</button></li>
              <li><button onClick={() => onNavigate('training-center')} className="text-gray-400 hover:text-white">{t('footer.trainingCenter')}</button></li>
              <li><button onClick={() => onNavigate('logistics')} className="text-gray-400 hover:text-white">{t('footer.logistics')}</button></li>
            </ul>
          </div>

          {/* Social & Payments */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.followUs')}</h3>
            <div className="flex space-x-4 mb-6">
              {socialLinks?.facebook?.iconUrl && <a href={socialLinks.facebook.linkUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><img src={socialLinks.facebook.iconUrl} alt="Facebook" className="h-6 w-6" /></a>}
              {socialLinks?.twitter?.iconUrl && <a href={socialLinks.twitter.linkUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><img src={socialLinks.twitter.iconUrl} alt="Twitter" className="h-6 w-6" /></a>}
              {socialLinks?.instagram?.iconUrl && <a href={socialLinks.instagram.linkUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><img src={socialLinks.instagram.iconUrl} alt="Instagram" className="h-6 w-6" /></a>}
            </div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.paymentMethods')}</h3>
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {paymentMethods.map(method => {
                  const IconComponent = paymentIconMap[method.id];
                  if (method.imageUrl) {
                    return <img key={method.id} src={method.imageUrl} alt={method.name} title={method.name} className="h-8 bg-white rounded-md p-1" />;
                  }
                  if (IconComponent) {
                    return <IconComponent key={method.id} className="h-8 w-auto" title={method.name} />;
                  }
                  return null;
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 dark:border-gray-800 pt-6 text-center text-gray-500">
          <p>{t('footer.copyright', new Date().getFullYear(), companyName)}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;