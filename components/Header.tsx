import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SearchIcon, ShoppingCartIcon, UserCircleIcon, MenuIcon, XIcon, BuildingStorefrontIcon, Cog8ToothIcon, SunIcon, MoonIcon, ClipboardDocumentListIcon, AcademicCapIcon, ChevronDownIcon, TagIcon, BoltIcon, ArrowRightOnRectangleIcon, HeartIcon, TruckIcon, ChatBubbleBottomCenterTextIcon, LogoIcon, StarIcon, StarPlatinumIcon, BarChartIcon, ShieldCheckIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useChatContext } from '../contexts/ChatContext';
import type { Category } from '../types';

interface HeaderProps {
  categories: Category[];
  onNavigateHome: () => void;
  onNavigateCart: () => void;
  onNavigateToStores: () => void;
  onNavigateToPromotions: () => void;
  onNavigateToCategory: (categoryId: string) => void;
  onNavigateToBecomeSeller: () => void;
  onNavigateToSellerDashboard: () => void;
  onNavigateToSellerProfile: () => void;
  onNavigateToOrderHistory: () => void;
  onNavigateToSuperAdminDashboard: () => void;
  onNavigateToFlashSales: () => void;
  onNavigateToWishlist: () => void;
  onNavigateToDeliveryAgentDashboard: () => void;
  onNavigateToDepotAgentDashboard: () => void;
  onNavigateToBecomePremium: () => void;
  onNavigateToAnalyticsDashboard: () => void;
  onNavigateToReviewModeration: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  isChatEnabled: boolean;
  isPremiumProgramEnabled: boolean;
  logoUrl: string;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { categories, onNavigateHome, onNavigateCart, onNavigateToStores, onNavigateToPromotions, onNavigateToCategory, onNavigateToBecomeSeller, onNavigateToSellerDashboard, onNavigateToSellerProfile, onOpenLogin, onLogout, onNavigateToOrderHistory, onNavigateToSuperAdminDashboard, onNavigateToFlashSales, onNavigateToWishlist, onNavigateToDeliveryAgentDashboard, onNavigateToDepotAgentDashboard, onNavigateToBecomePremium, onNavigateToAnalyticsDashboard, onNavigateToReviewModeration, onSearch, isChatEnabled, isPremiumProgramEnabled, logoUrl } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setIsWidgetOpen, totalUnreadCount } = useChatContext();
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const wishlistItemCount = wishlist.length;

  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const categoryTree = useMemo(() => {
    const mainCategories = categories.filter(c => !c.parentId);
    return mainCategories.map(mainCat => ({
        ...mainCat,
        subCategories: categories.filter(c => c.parentId === mainCat.id)
    }));
  }, [categories]);

  const translations = {
    searchPlaceholder: { fr: 'Rechercher un produit...', en: 'Search for a product...' },
    login: { fr: 'Connexion', en: 'Login' },
    wishlist: { fr: 'Favoris', en: 'Wishlist' },
    messages: { fr: 'Messages', en: 'Messages' },
    cart: { fr: 'Panier', en: 'Cart' },
    categories: { fr: 'Catégories', en: 'Categories' },
    promotions: { fr: 'Promotions', en: 'Promotions' },
    flashSales: { fr: 'Ventes Flash', en: 'Flash Sales' },
    stores: { fr: 'Boutiques', en: 'Stores' },
    becomeSeller: { fr: 'Devenir vendeur', en: 'Become a seller' },
    becomePremium: { fr: 'Devenir Premium', en: 'Become Premium' },
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isCategoryMenuOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryMenuOpen, isUserMenuOpen]);


  const handleSearchSubmit = (e: React.FormEvent, query: string) => {
    e.preventDefault();
    if (query.trim()) {
        onSearch(query);
        setSearchQuery('');
        setMobileSearchQuery('');
        setIsMenuOpen(false);
    }
  };

  const userMenuItems = [
    ...(user?.role === 'superadmin' ? [{ label: 'Superadmin Dashboard', action: onNavigateToSuperAdminDashboard, icon: <AcademicCapIcon className="h-5 w-5" /> }] : []),
    ...(user?.role === 'seller' ? [
        { label: `Tableau de bord (${user.shopName})`, action: onNavigateToSellerDashboard, icon: <BuildingStorefrontIcon className="h-5 w-5" /> },
        { label: 'Mon Profil', action: onNavigateToSellerProfile, icon: <Cog8ToothIcon className="h-5 w-5" /> }
    ] : []),
    ...(user?.role === 'delivery_agent' ? [{ label: 'Tableau de bord Livreur', action: onNavigateToDeliveryAgentDashboard, icon: <TruckIcon className="h-5 w-5" /> }] : []),
    ...(user?.role === 'depot_agent' ? [{ label: 'Tableau de bord Dépôt', action: onNavigateToDepotAgentDashboard, icon: <BuildingStorefrontIcon className="h-5 w-5" /> }] : []),
    ...(user && !['superadmin', 'delivery_agent', 'depot_agent'].includes(user.role) ? [{ label: 'Mes Commandes', action: onNavigateToOrderHistory, icon: <ClipboardDocumentListIcon className="h-5 w-5" /> }] : [])
  ];

  const ActionButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string, count?: number}> = ({onClick, icon, label, count}) => (
    <button onClick={onClick} className="relative flex flex-col items-center text-center text-gray-600 dark:text-gray-300 hover:text-kmer-green px-2 py-1">
      {icon}
      <span className="text-xs font-medium mt-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 right-0 block h-5 w-5 rounded-full bg-kmer-red text-white text-xs flex items-center justify-center ring-2 ring-white dark:ring-gray-800">{count}</span>
      )}
    </button>
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
             <button onClick={onNavigateHome} aria-label="Retour à l'accueil">
              <LogoIcon className="h-10" logoUrl={logoUrl} />
            </button>
          </div>
          <div className="hidden lg:flex flex-1 mx-8 justify-center">
            <form 
              onSubmit={(e) => handleSearchSubmit(e, searchQuery)} 
              className={`relative w-full ${isSearchFocused ? 'max-w-2xl' : 'max-w-md'} transition-all duration-300 ease-in-out`}
            >
              <input 
                type="text" 
                placeholder={translations.searchPlaceholder[language]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-kmer-green focus:border-transparent transition-all duration-300"
              />
               <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-kmer-green">
                <SearchIcon className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="hidden lg:flex items-center space-x-2">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                 <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex flex-col items-center text-center text-gray-600 dark:text-gray-300 hover:text-kmer-green px-2 py-1">
                  <div className="relative">
                    <UserCircleIcon className="h-6 w-6" />
                    {user.loyalty?.status === 'premium' && (
                        <StarIcon filled className="absolute -bottom-1 -right-1 w-4 h-4 text-kmer-yellow bg-white dark:bg-gray-800 rounded-full p-0.5" />
                    )}
                     {user.loyalty?.status === 'premium_plus' && (
                        <StarPlatinumIcon className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full p-0.5" />
                    )}
                  </div>
                  <span className="text-xs font-medium mt-1 truncate max-w-[80px]">{user.name}</span>
                </button>
                 {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                    {userMenuItems.map(item => (
                       <button key={item.label} onClick={() => { item.action(); setIsUserMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                         {item.icon} {item.label}
                       </button>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button onClick={() => { onLogout(); setIsUserMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                       <ArrowRightOnRectangleIcon className="h-5 w-5" /> Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ActionButton onClick={onOpenLogin} icon={<UserCircleIcon className="h-6 w-6" />} label={translations.login[language]} />
            )}
            
            {user && !['superadmin', 'delivery_agent', 'depot_agent'].includes(user.role) && (
              <>
                <ActionButton onClick={onNavigateToWishlist} icon={<HeartIcon className="h-6 w-6" />} label={translations.wishlist[language]} count={wishlistItemCount} />
                {isChatEnabled && <ActionButton onClick={() => setIsWidgetOpen(true)} icon={<ChatBubbleBottomCenterTextIcon className="h-6 w-6" />} label={translations.messages[language]} count={totalUnreadCount} />}
                <ActionButton onClick={onNavigateCart} icon={<ShoppingCartIcon className="h-6 w-6" />} label={translations.cart[language]} count={cartItemCount} />
              </>
            )}
            
            {user?.role === 'superadmin' && isChatEnabled && (
               <ActionButton onClick={() => setIsWidgetOpen(true)} icon={<ChatBubbleBottomCenterTextIcon className="h-6 w-6" />} label={translations.messages[language]} count={totalUnreadCount} />
            )}

            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
             <button onClick={() => setLanguage(lang => lang === 'fr' ? 'en' : 'fr')} className="p-2 rounded-full text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                {language.toUpperCase()}
            </button>
          </div>
          
          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {user?.role === 'superadmin' ? (
           <nav className="hidden lg:flex items-center justify-center space-x-6 border-t border-gray-200 dark:border-gray-700 mt-3 pt-2">
              <button onClick={onNavigateToAnalyticsDashboard} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold flex items-center gap-2"><BarChartIcon className="w-5 h-5"/>Tableau de Bord Analytique</button>
              <button onClick={onNavigateToReviewModeration} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5"/>Modération des Avis</button>
           </nav>
        ) : user?.role !== 'delivery_agent' && user?.role !== 'depot_agent' ? (
          <nav className="hidden lg:flex items-center justify-center space-x-6 border-t border-gray-200 dark:border-gray-700 mt-3 pt-2">
            <div className="relative group" onMouseEnter={() => setIsCategoryMenuOpen(true)} onMouseLeave={() => setIsCategoryMenuOpen(false)}>
              <button
                className="flex items-center text-gray-700 dark:text-gray-200 group-hover:text-kmer-green font-semibold"
              >
                {translations.categories[language]}
                <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform group-hover:rotate-180`} />
              </button>
              {isCategoryMenuOpen && (
                <div ref={categoryMenuRef} className="absolute left-0 mt-2 w-max bg-white dark:bg-gray-800 rounded-md shadow-xl z-50 flex gap-4 p-4">
                  {categoryTree.map((mainCat) => (
                    <div key={mainCat.id} className="min-w-[180px]">
                      <button 
                        onClick={() => { onNavigateToCategory(mainCat.id); setIsCategoryMenuOpen(false); }}
                        className="font-bold text-md text-gray-800 dark:text-gray-100 hover:text-kmer-green mb-2 w-full text-left"
                      >
                          {mainCat.name}
                      </button>
                      <div className="space-y-1">
                        {mainCat.subCategories.map(subCat => (
                          <button
                            key={subCat.id}
                            onClick={() => { onNavigateToCategory(subCat.id); setIsCategoryMenuOpen(false); }}
                            className="w-full text-left block text-sm text-gray-600 dark:text-gray-300 hover:text-kmer-green"
                          >
                            {subCat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onNavigateToPromotions} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold flex items-center gap-1"><TagIcon className="w-5 h-5 text-kmer-red"/>{translations.promotions[language]}</button>
            <button onClick={onNavigateToFlashSales} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold flex items-center gap-1"><BoltIcon className="w-5 h-5 text-blue-500"/>{translations.flashSales[language]}</button>
            <button onClick={onNavigateToStores} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold">{translations.stores[language]}</button>
            {(!user || user.role === 'customer') && <button onClick={onNavigateToBecomeSeller} className="text-kmer-green hover:underline font-bold">{translations.becomeSeller[language]}</button>}
            {(!user || (user.role === 'customer' && user.loyalty.status === 'standard')) && isPremiumProgramEnabled && (
                <button onClick={onNavigateToBecomePremium} className="text-kmer-yellow hover:text-yellow-400 font-bold flex items-center gap-1">
                    <StarIcon className="w-5 h-5"/>{translations.becomePremium[language]}
                </button>
            )}
          </nav>
        ) : null}
      </div>

      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 max-h-[calc(100vh-68px)] flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <form onSubmit={(e) => handleSearchSubmit(e, mobileSearchQuery)}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-kmer-green"
                />
                <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
                  <SearchIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4">
            <nav className="flex flex-col space-y-4">
              {user?.role === 'superadmin' ? (
                <>
                  <button onClick={() => {onNavigateToAnalyticsDashboard(); setIsMenuOpen(false);}} className="text-left font-semibold py-2 flex items-center gap-2"><BarChartIcon className="w-5 h-5"/>Tableau de Bord Analytique</button>
                  <button onClick={() => {onNavigateToReviewModeration(); setIsMenuOpen(false);}} className="text-left font-semibold py-2 flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5"/>Modération des Avis</button>
                </>
              ) : user?.role !== 'delivery_agent' && user?.role !== 'depot_agent' ? (
                <>
                  <button onClick={() => {onNavigateToPromotions(); setIsMenuOpen(false);}} className="text-left font-semibold py-2">Promotions</button>
                  <button onClick={() => {onNavigateToFlashSales(); setIsMenuOpen(false);}} className="text-left font-semibold py-2">Ventes Flash</button>
                  <button onClick={() => {onNavigateToStores(); setIsMenuOpen(false);}} className="text-left font-semibold py-2">Boutiques</button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                     <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm py-2">Catégories</h3>
                     <div className="flex flex-col items-start">
                        {categoryTree.map(mainCat => (
                          <div key={mainCat.id} className="w-full">
                            <button onClick={() => {onNavigateToCategory(mainCat.id); setIsMenuOpen(false);}} className="text-left block py-1.5 font-semibold">{mainCat.name}</button>
                            <div className="pl-4">
                              {mainCat.subCategories.map(subCat => (
                                <button key={subCat.id} onClick={() => {onNavigateToCategory(subCat.id); setIsMenuOpen(false);}} className="text-left block py-1">{subCat.name}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </>
              ) : null}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                 <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm py-2">Mon Compte</h3>
                 <div className="flex flex-col items-start">
                    {user ? userMenuItems.map(item => (
                      <button key={item.label} onClick={() => {item.action(); setIsMenuOpen(false);}} className="text-left flex items-center gap-3 py-1.5">{item.icon} {item.label}</button>
                    )) : (
                      <button onClick={() => {onOpenLogin(); setIsMenuOpen(false);}} className="text-left font-semibold py-2">Connexion / Inscription</button>
                    )}
                    {(!user || (user.role === 'customer' && user.loyalty.status === 'standard')) && isPremiumProgramEnabled && (
                      <button onClick={() => {onNavigateToBecomePremium(); setIsMenuOpen(false);}} className="text-left font-bold text-kmer-yellow py-2">Devenir Premium</button>
                    )}
                    {(!user || user.role === 'customer') && <button onClick={() => {onNavigateToBecomeSeller(); setIsMenuOpen(false);}} className="text-left text-kmer-green font-bold py-2">Devenir vendeur</button>}
                 </div>
              </div>
            </nav>
          </div>
          
          {user && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <button onClick={() => {onLogout(); setIsMenuOpen(false);}} className="w-full bg-gray-100 dark:bg-gray-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                   <ArrowRightOnRectangleIcon className="h-5 w-5" /> Se déconnecter
                </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;