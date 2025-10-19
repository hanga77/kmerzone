import React from 'react';
import type { Order } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import OrderHistoryPage from '../OrderHistoryPage';
import { Section } from './common';

export const OrdersTab: React.FC<{ userOrders: Order[]; onSelectOrder: (order: Order) => void; onRepeatOrder: (order: Order) => void }> = ({ userOrders, onSelectOrder, onRepeatOrder }) => {
    const { t } = useLanguage();
    return (
        <Section title={t('accountPage.orders')}>
          <OrderHistoryPage userOrders={userOrders} onBack={() => {}} onSelectOrder={onSelectOrder} onRepeatOrder={onRepeatOrder} />
        </Section>
    );
};
