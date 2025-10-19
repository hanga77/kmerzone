import React, { useState, useEffect } from 'react';
import type { User, Order, Store, Ticket } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardTab } from './account/DashboardTab';
import { ProfileTab } from './account/ProfileTab';
import { AddressesTab } from './account/AddressesTab';
import { OrdersTab } from './account/OrdersTab';
import { FollowedStoresTab } from './account/FollowedStoresTab';
import { SupportTab } from './account/SupportTab';
import { NotificationsTab } from './account/NotificationsTab';
import { SecurityTab } from './account/SecurityTab';
import { ArrowLeftIcon, BuildingStorefrontIcon, ClipboardDocumentListIcon, Cog8ToothIcon, ShieldCheckIcon, UserCircleIcon, BellIcon, ChatBubbleBottomCenterTextIcon, ChartPieIcon, MapPinIcon } from './Icons';

interface AccountPageProps {
  onBack: () => void;
  initialTab: string;
  allStores: Store[];
  userOrders: Order[];
  allTickets: Ticket[];
  onCreateTicket: (subject: string, message: string, orderId?: string, type?: 'support' | 'service_request', attachments?: string[]) => void;
  onUserReplyToTicket: (ticketId: string, message: string, attachments?: string[]) => void;
  onSelectOrder: (order: Order) => void;
  onRepeatOrder: (order: Order) => void;
  onVendorClick: (vendorName: string) => void;
}

type Tab = 'dashboard' | 'profile' | 'addresses' | 'orders' | 'followed-stores' | 'support' | 'notifications' | 'security';

const AccountPage: React.FC<AccountPageProps> = (props) => {
  const { onBack, initialTab, allStores, userOrders, allTickets, onCreateTicket, onUserReplyToTicket, onSelectOrder, onRepeatOrder, onVendorClick } = props;
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab as Tab || 'dashboard');

  useEffect(() => {
    setActiveTab(initialTab as Tab || 'dashboard');
  }, [initialTab]);

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <p>{t('accountPage.loginRequired')}</p>
      </div>
    );
  }

  const userTickets = allTickets.filter(t => t.userId === user.id);

  const TABS: { id: Tab, label: string, icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t('accountPage.dashboard'), icon: <ChartPieIcon className="w-5 h-5" /> },
    { id: 'profile', label: t('accountPage.profile'), icon: <UserCircleIcon className="w-5 h-5" /> },
    { id: 'addresses', label: t('accountPage.addresses'), icon: <MapPinIcon className="w-5 h-5" /> },
    { id: 'orders', label: t('accountPage.orders'), icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
    { id: 'followed-stores', label: t('accountPage.followedStores'), icon: <BuildingStorefrontIcon className="w-5 h-5" /> },
    { id: 'support', label: t('accountPage.support'), icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> },
    { id: 'notifications', label: t('accountPage.notifications'), icon: <BellIcon className="w-5 h-5" /> },
    { id: 'security', label: t('accountPage.security'), icon: <ShieldCheckIcon className="w-5 h-5" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      // FIX: The state setter from useState has a specific type that is not directly compatible with a simple string argument. Wrap it in a function and cast the argument to satisfy TypeScript.
      case 'dashboard': return <DashboardTab user={user} userOrders={userOrders} allStores={allStores} onTabChange={(tab: string) => setActiveTab(tab as Tab)} onSelectOrder={onSelectOrder} />;
      case 'profile': return <ProfileTab user={user} onUpdate={updateUser} />;
      case 'addresses': return <AddressesTab />;
      case 'orders': return <OrdersTab userOrders={userOrders} onSelectOrder={onSelectOrder} onRepeatOrder={onRepeatOrder} />;
      case 'followed-stores': return <FollowedStoresTab allStores={allStores} onVendorClick={onVendorClick} />;
      case 'support': return <SupportTab userTickets={userTickets} userOrders={userOrders} onCreateTicket={onCreateTicket} onUserReplyToTicket={onUserReplyToTicket} />;
      case 'notifications': return <NotificationsTab />;
      case 'security': return <SecurityTab />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        {t('common.backToHome')}
      </button>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <aside className="md:w-1/4 lg:w-1/5 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-kmer-green/10 text-kmer-green'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>
        <main className="flex-grow bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AccountPage;