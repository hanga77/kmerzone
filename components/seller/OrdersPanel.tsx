
import React, { useState, useMemo } from 'react';
import type { Order, OrderStatus, Store } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { TruckIcon, XIcon, PrinterIcon } from '../Icons';

interface OrdersPanelProps {
    sellerOrders: Order[];
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    store: Store;
    onSellerCancelOrder: (orderId: string) => void;
}

const OrderDetailModal: React.FC<{ order: Order; onClose: () => void; store: Store }> = ({ order, onClose, store }) => {
    const { t } = useLanguage();
    const sellerItems = order.items.filter(item => item.vendor === store.name);

    const handlePrint = () => {
        const printContents = document.getElementById('printable-slip')?.innerHTML;
        const originalContents = document.body.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        
        if (printWindow && printContents) {
            printWindow.document.write('<html><head><title>Bon de Livraison</title>');
            printWindow.document.write('<style>body{font-family:sans-serif;} table{width:100%; border-collapse:collapse;} td,th{border:1px solid #ddd; padding:8px;} th{background-color:#f2f2f2;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full relative max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b dark:border-gray-700 pb-3 mb-4">
                    <h3 className="text-xl font-bold">{t('sellerDashboard.orders.details')} #{order.id}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="flex-grow overflow-y-auto" id="printable-slip">
                    <div className="mb-4">
                        <h4 className="font-semibold">{t('sellerDashboard.orders.customerInfo')}</h4>
                        <address className="not-italic text-sm text-gray-600 dark:text-gray-300">
                            {order.shippingAddress.fullName}<br/>
                            {order.shippingAddress.phone}<br/>
                            {order.shippingAddress.address}, {order.shippingAddress.city}
                        </address>
                    </div>

                    <div>
                        <h4 className="font-semibold">{t('sellerDashboard.orders.items')}</h4>
                        <div className="mt-2 border rounded-lg dark:border-gray-700 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="p-2 text-left">Produit</th>
                                        <th className="p-2 text-center">Qté</th>
                                        <th className="p-2 text-right">Prix</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sellerItems.map(item => (
                                        <tr key={item.id} className="border-t dark:border-gray-700">
                                            <td className="p-2 flex items-center gap-2">
                                                <img src={item.imageUrls[0]} alt={item.name} className="w-10 h-10 object-cover rounded"/>
                                                <span>
                                                    {item.name}
                                                    {item.type === 'service' && <span className="ml-2 text-xs bg-purple-100 text-purple-800 rounded-full px-2 py-0.5">Service</span>}
                                                </span>
                                            </td>
                                            <td className="p-2 text-center">{item.quantity}</td>
                                            <td className="p-2 text-right font-semibold">{( (item.promotionPrice ?? item.price) * item.quantity).toLocaleString('fr-CM')} FCFA</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-end">
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-600 font-semibold py-2 px-4 rounded-lg">
                        <PrinterIcon className="w-5 h-5"/>
                        {t('sellerDashboard.orders.printSlip')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const OrdersPanel: React.FC<OrdersPanelProps> = ({ sellerOrders, onUpdateOrderStatus, store, onSellerCancelOrder }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'pending' | 'ready' | 'shipped' | 'completed' | 'all'>('pending');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const ordersByStatus = useMemo(() => ({
        pending: sellerOrders.filter(o => o.status === 'confirmed'),
        ready: sellerOrders.filter(o => o.status === 'ready-for-pickup'),
        shipped: sellerOrders.filter(o => ['picked-up', 'at-depot', 'out-for-delivery'].includes(o.status)),
        completed: sellerOrders.filter(o => ['delivered', 'cancelled', 'refund-requested', 'refunded', 'returned', 'delivery-failed'].includes(o.status)),
        all: sellerOrders
    }), [sellerOrders]);

    const currentOrders = useMemo(() => ordersByStatus[activeTab], [activeTab, ordersByStatus]);

    const TabButton: React.FC<{tab: typeof activeTab, label: string}> = ({tab, label}) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold flex-shrink-0 whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
            {label} ({ordersByStatus[tab].length})
        </button>
    );

    const getStatusClass = (status: OrderStatus) => {
        switch(status) {
            case 'confirmed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'ready-for-pickup': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
            case 'picked-up': case 'at-depot': case 'out-for-delivery': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'cancelled': case 'delivery-failed': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case 'refund-requested': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="p-6">
            {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} store={store} />}
            <h2 className="text-2xl font-bold mb-4">{t('sellerDashboard.orders.title', sellerOrders.length)}</h2>
            
            <div className="flex border-b dark:border-gray-700 mb-4 overflow-x-auto">
                <TabButton tab="pending" label={t('sellerDashboard.orders.tabs.pending')}/>
                <TabButton tab="ready" label={t('sellerDashboard.orders.tabs.ready')}/>
                <TabButton tab="shipped" label={t('sellerDashboard.orders.tabs.shipped')}/>
                <TabButton tab="completed" label={t('sellerDashboard.orders.tabs.completed')}/>
                <TabButton tab="all" label={t('sellerDashboard.orders.tabs.all')}/>
            </div>

            <div className="space-y-4">
                {currentOrders.length > 0 ? currentOrders.map(order => {
                    const sellerItems = order.items.filter(item => item.vendor === store.name);
                    const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.promotionPrice ?? item.price) * item.quantity, 0);

                    return (
                        <div key={order.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <div>
                                    <p className="font-bold text-lg font-mono text-gray-800 dark:text-gray-200">{order.id}</p>
                                    <p className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleString('fr-FR')}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="font-semibold">{sellerTotal.toLocaleString('fr-CM')} FCFA ({sellerItems.length} article(s))</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sellerDashboard.orders.table.customer')}: {order.shippingAddress.fullName}</p>
                                </div>
                                <div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(order.status)}`}>
                                        {t(`orderStatus.${order.status}`)}
                                    </span>
                                </div>
                            </div>
                            <div className="border-t dark:border-gray-700 mt-4 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex -space-x-2">
                                    {sellerItems.slice(0, 5).map(item => (
                                        <img key={item.id} src={item.imageUrls[0]} alt={item.name} className="w-10 h-10 object-cover rounded-full border-2 border-white dark:border-gray-800" title={item.name} />
                                    ))}
                                    {sellerItems.length > 5 && <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">+{sellerItems.length - 5}</div>}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => setSelectedOrder(order)} className="bg-gray-200 dark:bg-gray-600 font-semibold py-1 px-3 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                                        {t('sellerDashboard.orders.details')}
                                    </button>
                                     {order.status === 'confirmed' && (
                                        <>
                                            <button onClick={() => onUpdateOrderStatus(order.id, 'ready-for-pickup')} className="bg-blue-500 text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-blue-600">
                                                {t('sellerDashboard.orders.markReady')}
                                            </button>
                                            <button onClick={() => {if(window.confirm(t('sellerDashboard.orders.cancelConfirm'))) {onSellerCancelOrder(order.id)}}} className="bg-red-500 text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-red-600">
                                                {t('sellerDashboard.orders.cancelOrder')}
                                            </button>
                                        </>
                                    )}
                                     {order.status === 'refund-requested' && (
                                        <p className="text-sm font-bold text-purple-600 py-1 px-3">{t('sellerDashboard.orders.disputeNotice')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-center py-8 text-gray-500">{t('sellerDashboard.orders.noOrders')}</p>
                )}
            </div>
        </div>
    );
};

export default OrdersPanel;
