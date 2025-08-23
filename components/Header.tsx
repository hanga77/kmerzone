import React, { useState, useEffect, useRef } from 'react';
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
  onNavigateToCategory: (categoryName: string) => void;
  onNavigateToBecomeSeller: () => void;
  onNavigateToSellerDashboard: () => void;
  onNavigateToSellerProfile: () => void;
  onNavigateToOrderHistory: () => void;
  onNavigateToSuperAdminDashboard: () => void;
  onNavigateToFlashSales: () => void;
  onNavigateToWishlist: () => void;
  onNavigateToDeliveryAgentDashboard: () => void;
  onNavigateToBecomePremium: () => void;
  onNavigateToAnalyticsDashboard: () => void;
  onNavigateToReviewModeration: () => void;
  onOpenLogin: () => void;
  onSearch: (query: string) => void;
  isChatEnabled: boolean;
  isPremiumProgramEnabled: boolean;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { categories, onNavigateHome, onNavigateCart, onNavigateToStores, onNavigateToPromotions, onNavigateToCategory, onNavigateToBecomeSeller, onNavigateToSellerDashboard, onNavigateToSellerProfile, onOpenLogin, onNavigateToOrderHistory, onNavigateToSuperAdminDashboard, onNavigateToFlashSales, onNavigateToWishlist, onNavigateToDeliveryAgentDashboard, onNavigateToBecomePremium, onNavigateToAnalyticsDashboard, onNavigateToReviewModeration, onSearch, isChatEnabled, isPremiumProgramEnabled } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setIsWidgetOpen, totalUnreadCount } = useChatContext();
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const wishlistItemCount = wishlist.length;

  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    ...(user && !['superadmin', 'delivery_agent'].includes(user.role) ? [{ label: 'Mes Commandes', action: onNavigateToOrderHistory, icon: <ClipboardDocumentListIcon className="h-5 w-5" /> }] : [])
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
              <LogoIcon className="h-10" />
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
                    <button onClick={logout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                       <ArrowRightOnRectangleIcon className="h-5 w-5" /> Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ActionButton onClick={onOpenLogin} icon={<UserCircleIcon className="h-6 w-6" />} label={translations.login[language]} />
            )}
            
            {user && !['superadmin', 'delivery_agent'].includes(user.role) && (
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
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white" aria-label="Ouvrir le menu">
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {user?.role === 'superadmin' ? (
           <nav className="hidden lg:flex items-center justify-center space-x-6 border-t border-gray-200 dark:border-gray-700 mt-3 pt-2">
              <button onClick={onNavigateToAnalyticsDashboard} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold flex items-center gap-2"><BarChartIcon className="w-5 h-5"/>Tableau de Bord Analytique</button>
              <button onClick={onNavigateToReviewModeration} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5"/>Modération des Avis</button>
           </nav>
        ) : user?.role !== 'delivery_agent' ? (
          <nav className="hidden lg:flex items-center justify-center space-x-6 border-t border-gray-200 dark:border-gray-700 mt-3 pt-2">
            <div className="relative" ref={categoryMenuRef}>
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="flex items-center text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold"
              >
                {translations.categories[language]}
                <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-xl py-1 z-50">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { onNavigateToCategory(cat.name); setIsCategoryMenuOpen(false); }}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {cat.name}
                    </button>
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

      {/* Mobile Menu Drawer */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isMenuOpen ? '' : 'pointer-events-none'}`} role="dialog" aria-modal="true">
          {/* Overlay */}
          <div className={`fixed inset-0 bg-black/60 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)} aria-hidden="true"></div>

          {/* Drawer */}
          <div className={`fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex flex-col h-full">
                  <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                      <button onClick={() => { onNavigateHome(); setIsMenuOpen(false); }} aria-label="Accueil Kmer Zone">
                          <LogoIcon className="h-8" />
                      </button>
                      <button onClick={() => setIsMenuOpen(false)} className="p-1 text-gray-500 dark:text-gray-400">
                          <XIcon className="h-6 w-6" />
                      </button>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto">
                      <form onSubmit={(e) => handleSearchSubmit(e, mobileSearchQuery)} className="p-4">
                          <div className="relative">
                              <input
                                  type="text"
                                  placeholder="Rechercher..."
                                  value={mobileSearchQuery}
                                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-kmer-green"
                              />
                              <button type="submit" className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 dark:text-gray-400">
                                  <SearchIcon className="h-5 w-5" />
                              </button>
                          </div>
                      </form>

                      <nav className="py-2 px-4 space-y-2 text-lg font-medium">
                           {user?.role === 'superadmin' ? (
                              <>
                                <button onClick={() => {onNavigateToAnalyticsDashboard(); setIsMenuOpen(false);}} className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"><BarChartIcon className="w-5 h-5"/>Tableau de Bord BI</button>
                                <button onClick={() => {onNavigateToReviewModeration(); setIsMenuOpen(false);}} className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"><ShieldCheckIcon className="w-5 h-5"/>Modération Avis</button>
                              </>
                            ) : user?.role !== 'delivery_agent' ? (
                              <>
                                <button onClick={() => {onNavigateToPromotions(); setIsMenuOpen(false);}} className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Promotions</button>
                                <button onClick={() => {onNavigateToFlashSales(); setIsMenuOpen(false);}} className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Ventes Flash</button>
                                <button onClick={() => {onNavigateToStores(); setIsMenuOpen(false);}} className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Boutiques</button>
                              </>
                            ) : null}
                      </nav>

                      <div className="border-t border-gray-200 dark:border-gray-700 mx-4"></div>

                      <div className="px-4 py-4">
                          <h3 className="font-bold text-gray-500 dark:text-gray-400 px-3 mb-1">Catégories</h3>
                          <nav className="space-y-1 text-gray-800 dark:text-gray-300">
                              {categories.slice(0, 8).map(cat => (
                                 <button key={cat.id} onClick={() => {onNavigateToCategory(cat.name); setIsMenuOpen(false);}} className="w-full text-left block p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{cat.name}</button>
                              ))}
                          </nav>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 mx-4"></div>

                      <div className="px-4 py-4">
                           <h3 className="font-bold text-gray-500 dark:text-gray-400 px-3 mb-1">Mon Compte</h3>
                           <nav className="space-y-1">
                               {user ? (
                                 <>
                                   {userMenuItems.map(item => (
                                     <button key={item.label} onClick={() => {item.action(); setIsMenuOpen(false);}} className="w-full text-left flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{item.icon} {item.label}</button>
                                   ))}
                                 </>
                               ) : (
                                  <button onClick={() => {onOpenLogin(); setIsMenuOpen(false);}} className="w-full text-left flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"><UserCircleIcon className="w-5 h-5"/> Connexion / Inscription</button>
                               )}
                               
                                <div className="px-3 pt-2 flex items-center gap-6">
                                  {(!user || (user.role === 'customer' && user.loyalty.status === 'standard')) && isPremiumProgramEnabled && (
                                    <button onClick={() => {onNavigateToBecomePremium(); setIsMenuOpen(false);}} className="font-bold text-kmer-yellow hover:underline">Devenir Premium</button>
                                   )}
                                   {(!user || user.role === 'customer') && <button onClick={() => {onNavigateToBecomeSeller(); setIsMenuOpen(false);}} className="font-bold text-kmer-green hover:underline">Devenir vendeur</button>}
                                </div>
                           </nav>
                      </div>
                  </div>
                  
                  {user && 
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                          <button onClick={() => {logout(); setIsMenuOpen(false);}} className="w-full text-left flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowRightOnRectangleIcon className="h-5 w-5" /> Se déconnecter</button>
                      </div>
                  }
              </div>
          </div>
      </div>
    </header>
  );
};

export default Header;