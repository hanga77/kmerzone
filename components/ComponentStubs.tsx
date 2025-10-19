import React from 'react';
import { ArrowLeftIcon, DocumentTextIcon, BuildingStorefrontIcon, ShoppingBagIcon } from './Icons';
import type { Product, Category, Store } from '../types';
import { useLanguage } from '../contexts/LanguageContext';


const Stub: React.FC<{ name: string; props: any }> = ({ name, props }) => (
    <div className="p-6 m-4 border border-dashed border-gray-400 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">{name}</h2>
        <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
            {JSON.stringify(props, null, 2).substring(0, 500)}
            {JSON.stringify(props, null, 2).length > 500 && '...'}
        </pre>
    </div>
);

export const ComparisonPage: React.FC<any> = (props) => <Stub name="ComparisonPage" props={props} />;
export const ComparisonBar: React.FC<any> = (props) => <Stub name="ComparisonBar" props={props} />;

// FIX: Changed props from siteData object to individual props to resolve type mismatch.
interface InfoPageProps {
  title: string;
  content: string;
  slug: string;
  onBack: () => void;
  onProductClick: (product: Product) => void;
  onCategoryClick: (categoryId: string) => void;
  onVendorClick: (vendorName: string) => void;
  allProducts: Product[];
  allCategories: Category[];
  allStores: Store[];
}

const SitemapSection: React.FC<{title: string, icon: React.ReactNode; children: React.ReactNode, className?: string}> = ({ title, icon, children, className }) => {
    return (
        <div className={`bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md ${className}`}>
            <h2 className="text-xl font-bold border-b pb-3 mb-4 dark:border-gray-600 flex items-center gap-3">
                {icon}
                {title}
            </h2>
            <ul className="space-y-2">
                {children}
            </ul>
        </div>
    );
};


export const InfoPage: React.FC<InfoPageProps> = ({ title, content, slug, onBack, allProducts, allCategories, allStores, onProductClick, onCategoryClick, onVendorClick }) => {
    const { t } = useLanguage();
    
    const SitemapContent = () => (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <SitemapSection title={t('sitemap.categories')} icon={<DocumentTextIcon className="w-6 h-6 text-kmer-green"/>}>
                    {allCategories.map((category: Category) => (
                        <li key={category.id}>
                            <button onClick={() => onCategoryClick(category.id)} className="text-gray-600 dark:text-gray-300 hover:text-kmer-green hover:underline">
                                {t(category.name)}
                            </button>
                        </li>
                    ))}
                </SitemapSection>

                <SitemapSection title={t('sitemap.stores')} icon={<BuildingStorefrontIcon className="w-6 h-6 text-kmer-green"/>}>
                    {allStores.filter((s: Store) => s.status === 'active').map((store: Store) => (
                        <li key={store.id}>
                            <button onClick={() => onVendorClick(store.name)} className="text-gray-600 dark:text-gray-300 hover:text-kmer-green hover:underline">
                                {store.name}
                            </button>
                        </li>
                    ))}
                </SitemapSection>

                 <SitemapSection title={t('sitemap.pages')} icon={<DocumentTextIcon className="w-6 h-6 text-kmer-green"/>}>
                    <li><button onClick={onBack} className="text-gray-600 dark:text-gray-300 hover:text-kmer-green hover:underline">{t('header.backToHome')}</button></li>
                </SitemapSection>
            </div>
            
            <SitemapSection title={t('sitemap.products')} icon={<ShoppingBagIcon className="w-6 h-6 text-kmer-green"/>} className="lg:col-span-3">
                <ul className="space-y-2 columns-1 sm:columns-2 md:columns-3 lg:columns-4">
                    {allProducts.filter((p: Product) => p.status === 'published').map((product: Product) => (
                        <li key={product.id}>
                            <button onClick={() => onProductClick(product)} className="text-gray-600 dark:text-gray-300 hover:text-kmer-green hover:underline text-left text-sm">
                                {product.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </SitemapSection>
        </div>
    );

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
                <ArrowLeftIcon className="w-5 h-5" />
                {t('common.back')}
            </button>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{title}</h1>
                {slug === 'sitemap' ? <SitemapContent /> : <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />}
            </div>
        </div>
    );
};


export const StoresMapPage: React.FC<any> = (props) => <Stub name="StoresMapPage" props={props} />