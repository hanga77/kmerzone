import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Order, Store, Ticket, User, UserRole } from '../types';
import {
    ChartPieIcon, UserCircleIcon, MapPinIcon, ClipboardDocumentListIcon, HeartIcon,
    ChatBubbleBottomCenterTextIcon, BellSnoozeIcon, LockClosedIcon, ArrowLeftIcon
} from './Icons';
import OrderHistoryPage from './OrderHistoryPage';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardTab } from './account/DashboardTab';
import { ProfileTab } from './account/ProfileTab';
import { AddressesTab } from './account/AddressesTab';
import { OrdersTab } from './account/OrdersTab';
import { FollowedStoresTab } from './account/FollowedStoresTab';
import { SupportTab } from './account/SupportTab';
import { NotificationsTab } from './account/NotificationsTab';
import { SecurityTab } from './account/SecurityTab';


const TabButton: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void; children: React.ReactNode }> = ({ icon, active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left w-full rounded-md transition-colors ${
            active
                ? 'bg-kmer-green/10 text-kmer-green dark:bg-kmer-green/20'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
        }`}
    >
        {icon}
        <span className="flex-grow">{children}</span>
    </button>
);


interface AccountPageProps {
  onBack: () => void;
  initialTab?: string;
  allStores: Store[];
  userOrders: Order[];
  allTickets: Ticket[];
  onCreateTicket: (subject: string, message: string, relatedOrderId?: string, type?: 'support' | 'service_request', attachmentUrls?: string[]) => void;
  onUserReplyToTicket: (ticketId: string, message: string, attachmentUrls?: string[]) => void;
  onSelectOrder: (order: Order) => void;
  onRepeatOrder: (order: Order) => void;
  onVendorClick: (vendorName: string) => void;
}

const AccountPage: React.FC<AccountPageProps> = (props) => {
  const { onBack, initialTab = 'dashboard', allStores, userOrders, allTickets, onVendorClick, onCreateTicket, onUserReplyToTicket, onSelectOrder, onRepeatOrder } = props;
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, updateUserInfo } = useAuth();
  const { t } = useLanguage();
  
  if (!user) {
    return <div>{t('accountPage.loginRequired')}</div>;
  }
  
  const userTickets = allTickets.filter(t => t.userId === user.id);
  
  const handleUpdateProfile = (updates: Partial<User>) => {
      updateUserInfo(user.id, updates);
  };
  
  const TABS = useMemo(() => {
    const allTabs: { id: string; label: string; icon: React.ReactNode; roles: UserRole[] | 'all' }[] = [
        { id: 'dashboard', label: t('accountPage.dashboard'), icon: <ChartPieIcon className="w-5 h-5"/>, roles: ['customer'] },
        { id: 'profile', label: t('accountPage.profile'), icon: <UserCircleIcon className="w-5 h-5"/>, roles: 'all' },
        { id: 'addresses', label: t('accountPage.addresses'), icon: <MapPinIcon className="w-5 h-5"/>, roles: ['customer'] },
        { id: 'orders', label: t('accountPage.orders'), icon: <ClipboardDocumentListIcon className="w-5 h-5"/>, roles: ['customer', 'seller', 'enterprise'] },
        { id: 'followed-stores', label: t('accountPage.followedStores'), icon: <HeartIcon className="w-5 h-5"/>, roles: ['customer'] },
        { id: 'support', label: t('accountPage.support'), icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>, roles: 'all' },
        { id: 'notifications', label: t('accountPage.notifications'), icon: <BellSnoozeIcon className="w-5 h-5"/>, roles: 'all' },
        { id: 'security', label: t('accountPage.security'), icon: <LockClosedIcon className="w-5 h-5"/>, roles: 'all' },
    ];
    return allTabs.filter(tab => tab.roles === 'all' || tab.roles.includes(user.role));
  }, [user.role, t]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab user={user} userOrders={userOrders} allStores={allStores} onTabChange={setActiveTab} onSelectOrder={onSelectOrder} />;
      case 'profile': return <ProfileTab user={user} onUpdate={handleUpdateProfile} />;
      case 'addresses': return <AddressesTab />; 
      case 'orders': return <OrdersTab userOrders={userOrders} onSelectOrder={onSelectOrder} onRepeatOrder={onRepeatOrder} />;
      case 'followed-stores': return <FollowedStoresTab allStores={allStores} onVendorClick={onVendorClick}/>;
      case 'support': return <SupportTab userTickets={userTickets} userOrders={userOrders} onCreateTicket={onCreateTicket} onUserReplyToTicket={onUserReplyToTicket} />;
      case 'notifications': return <NotificationsTab />;
      case 'security': return <SecurityTab />;
      default: return <ProfileTab user={user} onUpdate={handleUpdateProfile} />; // Default to profile for non-customers
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        {t('common.back')}
      </button>
      <div className="md:flex md:gap-8">
        <aside className="md:w-1/4 lg:w-1/5 flex-shrink-0 mb-8 md:mb-0">
          <div className="p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg space-y-1">
            {TABS.map(tab => (
              <TabButton key={tab.id} icon={tab.icon} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </TabButton>
            ))}
          </div>
        </aside>
        <main className="flex-grow p-4 sm:p-6 lg:p-8 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AccountPage;