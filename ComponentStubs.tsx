import React from 'react';
import { ArrowLeftIcon } from './Icons';
import type { Product, Category, Store } from '../types';


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

interface InfoPageProps {
  title: string;
  content: string;
  slug: string;
  onBack: () => void;
  allProducts: Product[];
  allCategories: Category[];
  allStores: Store[];
  onProductClick: (product: Product) => void;
  onCategoryClick: (categoryId: string) => void;
  onVendorClick: (vendorName: string) => void;
}

const SitemapSection: React.FC<{title: string, children: React.ReactNode, className?: string}> = ({ title, children, className }) => (
    <div className={className}>
        <h2 className="text-xl font-bold border-b pb-2 mb-4 dark:border-gray-600">{title}</h2>
        <ul className="space-y-2">
            {children}
        </ul>
    </div>
);


export const InfoPage: React.FC<InfoPageProps> = ({ title, content, slug, onBack, allProducts, allCategories, allStores, onProductClick, onCategoryClick, onVendorClick }) => {
    
    const SitemapContent = () => (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            <SitemapSection title="Pages Principales">
                <li><button onClick={onBack} className="text-blue-500 hover:underline">Accueil</button></li>
                {/* Future static pages can be listed here */}
            </SitemapSection>

            <SitemapSection title="Catégories">
                {allCategories.map(category => (
                    <li key={category.id}>
                        <button onClick={() => onCategoryClick(category.id)} className="text-blue-500 hover:underline">
                            {category.name}
                        </button>
                    </li>
                ))}
            </SitemapSection>

            <SitemapSection title="Boutiques">
                {allStores.filter(s => s.status === 'active').map(store => (
                    <li key={store.id}>
                        <button onClick={() => onVendorClick(store.name)} className="text-blue-500 hover:underline">
                            {store.name}
                        </button>
                    </li>
                ))}
            </SitemapSection>
            
            <div className="md:col-span-2 lg:col-span-3">
                 <SitemapSection title="Produits">
                    <ul className="space-y-2 columns-1 sm:columns-2 md:columns-3 lg:columns-4">
                        {allProducts.filter(p => p.status === 'published').map(product => (
                            <li key={product.id}>
                                <button onClick={() => onProductClick(product)} className="text-blue-500 hover:underline text-left">
                                    {product.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </SitemapSection>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
                <ArrowLeftIcon className="w-5 h-5" />
                Retour
            </button>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{title}</h1>
                {slug === 'sitemap' ? <SitemapContent /> : <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />}
            </div>
        </div>
    );
};


export const StoresMapPage: React.FC<any> = (props) => <Stub name="StoresMapPage" props={props} />