import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SearchIcon, ShoppingCartIcon, UserCircleIcon, MenuIcon, XIcon, BuildingStorefrontIcon, Cog8ToothIcon, SunIcon, MoonIcon, ClipboardDocumentListIcon, AcademicCapIcon, ChevronDownIcon, TagIcon, BoltIcon, ArrowRightOnRectangleIcon, HeartIcon, TruckIcon, ChatBubbleBottomCenterTextIcon, LogoIcon, StarIcon, StarPlatinumIcon, BellIcon, PhotoIcon, SparklesIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useChatContext } from '../contexts/ChatContext';
import type { Category, User, Notification, Page } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

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
  onNavigateToAccount: (tab?: string) => void;
  onNavigateToVisualSearch: () => void;
  onNavigateToServices: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  isChatEnabled: boolean;
  isPremiumProgramEnabled: boolean;
  logoUrl: string;
  notifications: Notification[];
  onMarkNotificationAsRead: (notificationId: string) => void;
  onNavigateFromNotification: (link: Notification['link']) => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  const { categories, onNavigateHome, onNavigateCart, onNavigateToStores, onNavigateToPromotions, onNavigateToCategory, onNavigateToBecomeSeller, onNavigateToSellerDashboard, onNavigateToSellerProfile, onOpenLogin, onLogout, onNavigateToOrderHistory, onNavigateToSuperAdminDashboard, onNavigateToFlashSales, onNavigateToWishlist, onNavigateToDeliveryAgentDashboard, onNavigateToDepotAgentDashboard, onNavigateToBecomePremium, onNavigateToAccount, onNavigateToVisualSearch, onNavigateToServices, onSearch, isChatEnabled, isPremiumProgramEnabled, logoUrl, notifications, onMarkNotificationAsRead, onNavigateFromNotification } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setIsWidgetOpen, totalUnreadCount } = useChatContext();
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const wishlistItemCount = wishlist.length;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);

  const categoryTree = useMemo(() => {
    const mainCategories = categories.filter(c => !c.parentId);
    return mainCategories.map(mainCat => ({
        ...mainCat,
        subCategories: categories.filter(c => c.parentId === mainCat.id)
    }));
  }, [categories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isCategoryMenuOpen || isUserMenuOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryMenuOpen, isUserMenuOpen, isNotificationsOpen]);


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
    ...(user?.role === 'superadmin' ? [{ label: t('header.superadminDashboard'), action: onNavigateToSuperAdminDashboard, icon: <AcademicCapIcon className="h-5 w-5" /> }] : []),
    ...(user?.role === 'seller' || user?.role === 'enterprise' ? [
        { label: t('header.sellerDashboard'), action: onNavigateToSellerDashboard, icon: <BuildingStorefrontIcon className="h-5 w-5" /> },
        { label: t('header.sellerProfile'), action: onNavigateToSellerProfile, icon: <Cog8ToothIcon className="h-5 w-5" /> }
    ] : []),
    ...(user?.role === 'customer' ? [
        { label: t('header.myAccount'), action: () => onNavigateToAccount('profile'), icon: <UserCircleIcon className="h-5 w-5" /> },
        { label: t('header.followedStores'), action: () => onNavigateToAccount('followed-stores'), icon: <BuildingStorefrontIcon className="h-5 w-5" /> }
    ] : []),
    ...(user?.role === 'delivery_agent' ? [{ label: t('header.deliveryDashboard'), action: onNavigateToDeliveryAgentDashboard, icon: <TruckIcon className="h-5 w-5" /> }] : []),
    ...(user?.role === 'depot_agent' || user?.role === 'depot_manager' ? [{ label: t('header.depotDashboard'), action: onNavigateToDepotAgentDashboard, icon: <BuildingStorefrontIcon className="h-5 w-5" /> }] : []),
    ...(user && (user.role === 'customer' || user.role === 'seller' || user.role === 'enterprise') ? [
        { label: t('header.myOrders'), action: onNavigateToOrderHistory, icon: <ClipboardDocumentListIcon className="h-5 w-5" /> },
    ] : []),
    ...(user ? [
        { label: t('header.support'), action: () => onNavigateToAccount('support'), icon: <ChatBubbleBottomCenterTextIcon className="h-5 w-5" /> }
    ] : [])
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
             <button onClick={onNavigateHome} aria-label={t('header.backToHome')}>
              <LogoIcon className="h-10" logoUrl={logoUrl} />
            </button>
          </div>
          <div className="hidden lg:flex flex-1 mx-8 justify-center">
            <form 
              onSubmit={(e) => handleSearchSubmit(e, searchQuery)} 
              className={`relative w-full ${isSearchFocused ? 'max-w-2xl' : 'max-w-md'} transition-all duration-300 ease-in-out`}
            >
               <button type="button" onClick={onNavigateToVisualSearch} className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 hover:text-kmer-green" title={t('header.visualSearch')}>
                <PhotoIcon className="h-5 w-5" />
              </button>
              <input 
                type="text" 
                placeholder={t('header.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-12 pr-10 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-kmer-green focus:border-transparent transition-all duration-300"
              />
               <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-kmer-green">
                <SearchIcon className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="hidden lg:flex items-center space-x-2">
            {(!user || user.role === 'customer') && (
                <button onClick={onNavigateToBecomeSeller} className="text-sm font-semibold text-kmer-green border-2 border-kmer-green rounded-full px-4 py-1.5 hover:bg-kmer-green/10 transition-colors">
                    {t('header.becomeSeller')}
                </button>
            )}
            {user ? (
              <>
              <div className="relative" ref={userMenuRef}>
                 <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex flex-col items-center text-center text-gray-600 dark:text-gray-300 hover:text-kmer-green px-2 py-1">
                  <div className="relative">
                    <UserCircleIcon className="h-6 w-6" />
                    {user.loyalty?.status === 'premium' && (
                        <StarIcon filled className="absolute -bottom-1 -right-1 w-4 h-4 text-kmer-yellow bg-white dark:bg-gray-800 rounded-full p-0.5" />
                    )}
                     {user.loyalty?.status === 'premium_plus' && (
                        <StarPlatinumIcon className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full p-0.5 text-kmer-red" />
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
                       <ArrowRightOnRectangleIcon className="h-5 w-5" /> {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
              
               <div className="relative" ref={notificationsMenuRef}>
                    <ActionButton onClick={() => setIsNotificationsOpen(o => !o)} icon={<BellIcon className="h-6 w-6" />} label={t('header.notifications')} count={unreadNotificationsCount} />
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto">
                           <div className="p-3 border-b dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white">{t('header.notifications')}</h3>
                           </div>
                           {notifications.length === 0 ? (
                               <p className="p-4 text-sm text-gray-500">{t('header.noNotifications')}</p>
                           ) : (
                               notifications.map(notif => (
                                <button
                                    key={notif.id}
                                    onClick={() => {
                                        onMarkNotificationAsRead(notif.id);
                                        if (notif.link) onNavigateFromNotification(notif.link);
                                        setIsNotificationsOpen(false);
                                    }}
                                    className={`w-full text-left p-3 border-b dark:border-gray-700/50 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <p className="text-sm text-gray-700 dark:text-gray-200">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(notif.timestamp).toLocaleString('fr-FR')}</p>
                                </button>
                               ))
                           )}
                        </div>
                    )}
                </div>
              </>
            ) : (
              <ActionButton onClick={onOpenLogin} icon={<UserCircleIcon className="h-6 w-6" />} label={t('header.login')} />
            )}
            
            {user?.role === 'customer' && <ActionButton onClick={onNavigateToOrderHistory} icon={<ClipboardDocumentListIcon className="h-6 w-6" />} label={t('header.myOrders')} />}

            {user && (user.role === 'customer' || user.role === 'seller' || user.role === 'enterprise') && (
              <>
                <ActionButton onClick={onNavigateToWishlist} icon={<HeartIcon className="h-6 w-6" />} label={t('header.wishlist')} count={wishlistItemCount} />
                {isChatEnabled && <ActionButton onClick={() => setIsWidgetOpen(true)} icon={<ChatBubbleBottomCenterTextIcon className="h-6 w-6" />} label={t('header.messages')} count={totalUnreadCount} />}
              </>
            )}

            {user && user.role === 'customer' && (
               <ActionButton onClick={onNavigateCart} icon={<ShoppingCartIcon className="h-6 w-6" />} label={t('header.cart')} count={cartItemCount} />
            )}
            
            {user?.role === 'superadmin' && isChatEnabled && (
               <ActionButton onClick={() => setIsWidgetOpen(true)} icon={<ChatBubbleBottomCenterTextIcon className="h-6 w-6" />} label={t('header.messages')} count={totalUnreadCount} />
            )}
            
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
             <button onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} className="p-2 rounded-full text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                {language.toUpperCase()}
            </button>
          </div>
          
          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {(!user || (user.role !== 'superadmin' && user.role !== 'delivery_agent' && user.role !== 'depot_agent')) && (
          <nav className="hidden lg:flex items-center justify-center space-x-6 border-t border-gray-200 dark:border-gray-700 mt-3 pt-2">
            <div className="relative" ref={categoryMenuRef}>
              <button
                onClick={() => setIsCategoryMenuOpen(o => !o)}
                className="flex items-center text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold"
              >
                {t('header.categories')}
                <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryMenuOpen && (
                <div className="absolute left-0 mt-2 w-[840px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-md shadow-xl z-50 p-6">
                    <div className="flex flex-row flex-wrap gap-x-6 gap-y-4">
                        {categoryTree.map((mainCat) => (
                            <div key={mainCat.id} className="w-44">
                                <button 
                                    onClick={() => { onNavigateToCategory(mainCat.id); setIsCategoryMenuOpen(false); }}
                                    className="font-bold text-md text-gray-800 dark:text-gray-100 hover:text-kmer-green mb-2 w-full text-left"
                                >
                                    {t(mainCat.name)}
                                </button>
                                <div className="space-y-1">
                                    {mainCat.subCategories.map(subCat => (
                                    <button
                                        key={subCat.id}
                                        onClick={() => { onNavigateToCategory(subCat.id); setIsCategoryMenuOpen(false); }}
                                        className="w-full text-left block text-sm text-gray-600 dark:text-gray-300 hover:text-kmer-green"
                                    >
                                        {t(subCat.name)}
                                    </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
            <button onClick={onNavigateToPromotions} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold flex items-center gap-1"><TagIcon className="w-5 h-5 text-kmer-red"/>{t('header.promotions')}</button>
            <button onClick={onNavigateToFlashSales} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold flex items-center gap-1"><BoltIcon className="w-5 h-5 text-blue-500"/>{t('header.flashSales')}</button>
            <button onClick={onNavigateToStores} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold">{t('header.stores')}</button>
            <button onClick={onNavigateToServices} className="text-gray-700 dark:text-gray-200 hover:text-kmer-green font-semibold flex items-center gap-1"><SparklesIcon className="w-5 h-5 text-purple-500"/>{t('header.services')}</button>
            {isPremiumProgramEnabled && (!user || user.role === 'customer') && (
                <button onClick={user ? onNavigateToBecomePremium : onOpenLogin} className="text-kmer-yellow hover:text-yellow-400 font-bold flex items-center gap-1">
                    <StarIcon className="w-5 h-5"/>{t('header.becomePremium')}
                </button>
            )}
          </nav>
        )}
      </div>

      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 max-h-[calc(100vh-68px)] flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <form onSubmit={(e) => handleSearchSubmit(e, mobileSearchQuery)}>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('header.searchPlaceholder')}
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
              {user?.role !== 'delivery_agent' && user?.role !== 'depot_agent' && (
                <>
                  <button onClick={() => {onNavigateToPromotions(); setIsMenuOpen(false);}} className="text-left font-semibold py-2">{t('header.promotions')}</button>
                  <button onClick={() => {onNavigateToFlashSales(); setIsMenuOpen(false);}} className="text-left font-semibold py-2">{t('header.flashSales')}</button>
                  <button onClick={() => {onNavigateToStores(); setIsMenuOpen(false);}} className="text-left font-semibold py-2">{t('header.stores')}</button>
                  <button onClick={() => {onNavigateToServices(); setIsMenuOpen(false);}} className="text-left font-semibold py-2">{t('header.services')}</button>
                  {(!user || user.role === 'customer') && <button onClick={() => {onNavigateToBecomeSeller(); setIsMenuOpen(false);}} className="text-left text-kmer-green font-bold py-2">{t('header.becomeSeller')}</button>}
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                     <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm py-2">{t('header.categories')}</h3>
                     <div className="flex flex-col items-start">
                        {categoryTree.map(mainCat => (
                          <div key={mainCat.id} className="w-full">
                            <button onClick={() => {onNavigateToCategory(mainCat.id); setIsMenuOpen(false);}} className="text-left block py-1.5 font-semibold">{t(mainCat.name)}</button>
                            <div className="pl-4">
                              {mainCat.subCategories.map(subCat => (
                                <button key={subCat.id} onClick={() => {onNavigateToCategory(subCat.id); setIsMenuOpen(false);}} className="text-left block py-1">{t(subCat.name)}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                 <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm py-2">{t('header.myAccount')}</h3>
                 <div className="flex flex-col items-start">
                    {user ? userMenuItems.map(item => (
                      <button key={item.label} onClick={() => {item.action(); setIsMenuOpen(false);}} className="text-left flex items-center gap-3 py-1.5">{item.icon} {item.label}</button>
                    )) : (
                      <button onClick={() => {onOpenLogin(); setIsMenuOpen(false);}} className="text-left font-semibold py-2">{t('header.login')}</button>
                    )}
                    {isPremiumProgramEnabled && (!user || user.role === 'customer') && (
                      <button onClick={() => { (user ? onNavigateToBecomePremium : onOpenLogin)(); setIsMenuOpen(false); }} className="text-left font-bold text-kmer-yellow py-2">{t('header.becomePremium')}</button>
                    )}
                 </div>
              </div>
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-center items-center gap-4">
              <button onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-kmer-green p-2 rounded-lg">
                  <span>Langue: {language.toUpperCase()}</span>
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
              </button>
          </div>

          {user && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <button onClick={() => {onLogout(); setIsMenuOpen(false);}} className="w-full bg-gray-100 dark:bg-gray-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                   <ArrowRightOnRectangleIcon className="h-5 w-5" /> {t('header.logout')}
                </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};