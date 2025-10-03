import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    ArrowLeftIcon, UsersIcon, ChatBubbleBottomCenterTextIcon, AcademicCapIcon, ShieldCheckIcon, LockClosedIcon,
    MapIcon, TruckIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, BuildingStorefrontIcon, ShoppingBagIcon,
    PaperAirplaneIcon, ChevronDownIcon
} from './Icons';
import type { Product, Category, Store } from '../types';

declare const L: any;

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
  onProductClick: (product: Product) => void;
  onCategoryClick: (categoryId: string) => void;
  onVendorClick: (vendorName: string) => void;
  siteData: any;
  authData: any;
}

// --- Specific Content Components ---

const DefaultContent: React.FC<{ content: string }> = ({ content }) => (
    <div className="prose dark:prose-invert max-w-none lg:prose-lg mx-auto" dangerouslySetInnerHTML={{ __html: content }} />
);

const AboutContent: React.FC<{ content: string; siteData: any; authData: any }> = ({ content, siteData, authData }) => {
    const { allStores, allProducts } = siteData;
    const { allUsers } = authData;
    const stats = {
        stores: allStores.filter((s: Store) => s.status === 'active').length,
        products: allProducts.filter((p: Product) => p.status === 'published').length,
        customers: allUsers.filter((u: any) => u.role === 'customer').length
    };
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
                <div className="p-6 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <BuildingStorefrontIcon className="w-10 h-10 mx-auto text-kmer-green mb-2" />
                    <p className="text-3xl font-bold">{stats.stores}</p>
                    <p className="text-gray-500 dark:text-gray-400">Boutiques Actives</p>
                </div>
                 <div className="p-6 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <ShoppingBagIcon className="w-10 h-10 mx-auto text-kmer-green mb-2" />
                    <p className="text-3xl font-bold">{stats.products.toLocaleString('fr-CM')}</p>
                    <p className="text-gray-500 dark:text-gray-400">Produits Disponibles</p>
                </div>
                 <div className="p-6 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <UsersIcon className="w-10 h-10 mx-auto text-kmer-green mb-2" />
                    <p className="text-3xl font-bold">{stats.customers.toLocaleString('fr-CM')}</p>
                    <p className="text-gray-500 dark:text-gray-400">Clients</p>
                </div>
            </div>
            <DefaultContent content={content} />
        </div>
    );
};

const ContactContent: React.FC = () => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Message envoyé ! Notre équipe vous répondra dans les plus brefs délais.");
        (e.target as HTMLFormElement).reset();
    };
    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Votre Nom" className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                <input type="email" placeholder="Votre Email" className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <input type="text" placeholder="Sujet" className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            <textarea placeholder="Votre message..." rows={6} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            <button type="submit" className="w-full bg-kmer-green text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                <PaperAirplaneIcon className="w-5 h-5" /> Envoyer
            </button>
        </form>
    );
};

const FaqContent: React.FC<{ content: string }> = ({ content }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const faqs = useMemo(() => content.split('<h3>').slice(1).map(section => {
        const parts = section.split('</h3>');
        return { question: parts[0], answer: parts[1] };
    }), [content]);

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
                <div key={index} className="border-b dark:border-gray-700">
                    <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex justify-between items-center text-left py-4">
                        <span className="font-semibold text-lg">{faq.question}</span>
                        <ChevronDownIcon className={`w-6 h-6 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
                    </button>
                    {openIndex === index && (
                        <div className="pb-4 prose dark:prose-invert max-w-none animate-in" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                    )}
                </div>
            ))}
        </div>
    );
};

const CareersContent: React.FC<{ content: string }> = ({ content }) => {
    const jobPostings = [
      { title: 'Développeur Frontend Senior', location: 'Douala', type: 'Temps plein' },
      { title: 'Responsable Logistique', location: 'Yaoundé', type: 'Temps plein' },
      { title: 'Spécialiste Marketing Digital', location: 'Télétravail', type: 'Temps partiel' },
      { title: 'Agent de support client', location: 'Douala', type: 'Temps plein' },
    ];
    return (
        <div className="max-w-3xl mx-auto">
            <DefaultContent content={content} />
            <div className="mt-8 space-y-4">
                {jobPostings.map((job, index) => (
                    <div key={index} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{job.title}</h3>
                            <p className="text-sm text-gray-500">{job.location} - {job.type}</p>
                        </div>
                        <button className="bg-kmer-green text-white font-semibold py-2 px-4 rounded-lg">Postuler</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LogisticsContent: React.FC<{ content: string, siteData: any }> = ({ content, siteData }) => {
    const { allPickupPoints } = siteData;
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);

    useEffect(() => {
        if (mapRef.current && !leafletMap.current && typeof L !== 'undefined') {
            leafletMap.current = L.map(mapRef.current).setView([4.5, 11.5], 7); // Center on Cameroon
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(leafletMap.current);
            allPickupPoints.forEach((p: any) => {
                if (p.latitude && p.longitude) {
                    L.marker([p.latitude, p.longitude]).addTo(leafletMap.current).bindPopup(`<b>${p.name}</b><br>${p.city}`);
                }
            });
        }
    }, [allPickupPoints]);

    return (
        <div className="max-w-4xl mx-auto">
            <DefaultContent content={content} />
            <div ref={mapRef} className="h-96 w-full rounded-lg shadow-md mt-8 z-0"></div>
        </div>
    );
};

const SitemapContent: React.FC<Omit<InfoPageProps, 'title' | 'content' | 'slug' | 'authData'>> = ({ onBack, onProductClick, onCategoryClick, onVendorClick, siteData }) => {
    const { allProducts, allCategories, allStores } = siteData;
    const SitemapSection: React.FC<{title: string; icon: React.ReactNode; children: React.ReactNode; className?: string}> = ({ title, icon, children, className }) => (
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
    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <SitemapSection title="Catégories" icon={<DocumentTextIcon className="w-6 h-6 text-kmer-green"/>}>
                    {allCategories.map((category: Category) => (
                        <li key={category.id}>
                            <button onClick={() => onCategoryClick(category.id)} className="text-gray-600 dark:text-gray-300 hover:text-kmer-green hover:underline">
                                {category.name}
                            </button>
                        </li>
                    ))}
                </SitemapSection>

                <SitemapSection title="Boutiques" icon={<BuildingStorefrontIcon className="w-6 h-6 text-kmer-green"/>}>
                    {allStores.filter((s: Store) => s.status === 'active').map((store: Store) => (
                        <li key={store.id}>
                            <button onClick={() => onVendorClick(store.name)} className="text-gray-600 dark:text-gray-300 hover:text-kmer-green hover:underline">
                                {store.name}
                            </button>
                        </li>
                    ))}
                </SitemapSection>

                 <SitemapSection title="Pages" icon={<DocumentTextIcon className="w-6 h-6 text-kmer-green"/>}>
                    <li><button onClick={onBack} className="text-gray-600 dark:text-gray-300 hover:text-kmer-green hover:underline">Accueil</button></li>
                </SitemapSection>
            </div>
            
            <SitemapSection title="Produits" icon={<ShoppingBagIcon className="w-6 h-6 text-kmer-green"/>} className="lg:col-span-3">
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
};

// --- Main InfoPage Component ---

const pageIcons: { [key: string]: React.ReactNode } = {
    'about': <UsersIcon className="w-16 h-16 text-kmer-green" />,
    'contact': <ChatBubbleBottomCenterTextIcon className="w-16 h-16 text-kmer-green" />,
    'faq': <ChatBubbleLeftRightIcon className="w-16 h-16 text-kmer-green" />,
    'careers': <AcademicCapIcon className="w-16 h-16 text-kmer-green" />,
    'terms-of-service': <ShieldCheckIcon className="w-16 h-16 text-kmer-green" />,
    'privacy-policy': <LockClosedIcon className="w-16 h-16 text-kmer-green" />,
    'sitemap': <MapIcon className="w-16 h-16 text-kmer-green" />,
    'training-center': <AcademicCapIcon className="w-16 h-16 text-kmer-green" />,
    'logistics': <TruckIcon className="w-16 h-16 text-kmer-green" />,
    'default': <DocumentTextIcon className="w-16 h-16 text-kmer-green" />
};

export const InfoPage: React.FC<InfoPageProps> = (props) => {
    const { title, content, slug, onBack } = props;
    
    const renderContent = () => {
        switch (slug) {
            case 'about': return <AboutContent content={content} siteData={props.siteData} authData={props.authData} />;
            case 'contact': return <ContactContent />;
            case 'faq': return <FaqContent content={content} />;
            case 'careers': return <CareersContent content={content} />;
            case 'logistics': return <LogisticsContent content={content} siteData={props.siteData} />;
            case 'sitemap': return <SitemapContent {...props} />;
            default: return <DefaultContent content={content} />;
        }
    };

    const HeroIcon = pageIcons[slug] || pageIcons['default'];

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-[80vh]">
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Retour
                </button>
                <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-lg shadow-xl">
                    <div className="text-center mb-10 flex flex-col items-center">
                        {HeroIcon}
                        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mt-4">{title}</h1>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};


export const StoresMapPage: React.FC<any> = (props) => <Stub name="StoresMapPage" props={props} />;