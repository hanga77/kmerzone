import React from 'react';
import { SellerAnalyticsDashboard } from '../SellerAnalyticsDashboard';
import type { Order, Product, FlashSale } from '../../types';

interface AnalyticsPanelProps {
    sellerOrders: Order[];
    sellerProducts: Product[];
    flashSales: FlashSale[];
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ sellerOrders, sellerProducts, flashSales }) => {
    // Re-using the detailed analytics component, but without the "onBack" prop as it's a panel now.
    return (
        <SellerAnalyticsDashboard 
            sellerOrders={sellerOrders} 
            sellerProducts={sellerProducts} 
            flashSales={flashSales} 
            onBack={() => {}} // Dummy function, as it won't be shown
        />
    );
};

export default AnalyticsPanel;