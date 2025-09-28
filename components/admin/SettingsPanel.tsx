import React, { useState } from 'react';
import type { SiteSettings, SiteContent, PaymentMethod, EmailTemplate } from '../../types';

interface SettingsPanelProps {
    siteSettings: SiteSettings;
    onUpdateSiteSettings: (settings: SiteSettings) => void;
    siteContent: SiteContent[];
    onUpdateSiteContent: (content: SiteContent[]) => void;
    paymentMethods: PaymentMethod[];
    onUpdatePaymentMethods: (methods: PaymentMethod[]) => void;
}

const Field: React.FC<{ label: string; children: React.ReactNode, description?: string }> = ({ label, children, description }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {children}
        {description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
);

const ImageUrlOrUpload: React.FC<{
    label: string;
    name: string;
    value: string;
    preview: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, preview, onChange }) => {
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const syntheticEvent = {
                    target: { name, value: reader.result as string, type: 'text' }
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(syntheticEvent);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
         <Field label={label}>
            <div className="flex items-center gap-2">
                <input
                    type="url"
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder="https://... ou téléverser"
                    className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                 <label htmlFor={`${name}-upload`} className="cursor-pointer bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded-md text-sm font-medium">
                    Choisir
                    <input id={`${name}-upload`} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
            </div>
            {preview && <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md inline-block"><img src={preview} alt="Aperçu" className="h-12 object-contain"/></div>}
        </Field>
    )
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ siteSettings, onUpdateSiteSettings, siteContent, onUpdateSiteContent }) => {
    const [settings, setSettings] = useState(siteSettings);
    const [content, setContent] = useState(siteContent);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        const valueToSet = (() => {
            if (type === 'checkbox') {
                return checked;
            }
            if (type === 'number') {
                const num = parseFloat(value);
                return isNaN(num) ? null : num;
            }
            return value;
        })();

        const keys = name.split('.');
        if (keys.length > 1) {
            setSettings(s => {
                const newSettings = JSON.parse(JSON.stringify(s)); // Deep copy
                let current: any = newSettings;
                for (let i = 0; i < keys.length - 1; i++) {
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = valueToSet;
                return newSettings;
            });
        } else {
            setSettings(s => ({ ...s, [name]: valueToSet }));
        }
    };
    
    const handleRequiredDocsChange = (docName: string, isRequired: boolean) => {
        setSettings(s => ({
            ...s,
            requiredSellerDocuments: {
                ...s.requiredSellerDocuments,
                [docName]: isRequired,
            }
        }));
    };
    
    const handleBenefitsChange = (plan: 'premium' | 'premiumPlus', value: string) => {
        setSettings(s => {
            const newSettings = JSON.parse(JSON.stringify(s));
            newSettings.customerLoyaltyProgram[plan].benefits = value.split('\n').filter(b => b.trim() !== '');
            return newSettings;
        });
    };

    const handleContentChange = (slug: string, field: 'title' | 'content', value: string) => {
        setContent(prev => prev.map(c => c.slug === slug ? { ...c, [field]: value } : c));
    };
    
    const handleEmailTemplateChange = (id: string, field: 'subject' | 'body', value: string) => {
        setSettings(prev => {
            const updatedTemplates = (prev.emailTemplates || []).map(template => 
                template.id === id ? { ...template, [field]: value } : template
            );
            return { ...prev, emailTemplates: updatedTemplates };
        });
    };

    const handleSave = () => {
        onUpdateSiteSettings(settings);
        onUpdateSiteContent(content);
        alert('Paramètres sauvegardés !');
    };

    return (
        <div className="p-4 sm:p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Paramètres du Site</h2>
                <button onClick={handleSave} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">Sauvegarder les Paramètres</button>
            </div>
            
            <details className="p-4 border dark:border-gray-700 rounded-md">
                <summary className="font-semibold text-lg cursor-pointer">Identité Visuelle</summary>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUrlOrUpload label="Logo du site" name="logoUrl" value={settings.logoUrl} preview={settings.logoUrl} onChange={handleSettingsChange}/>
                    <ImageUrlOrUpload label="Bannière de la page d'accueil" name="bannerUrl" value={settings.bannerUrl || ''} preview={settings.bannerUrl || ''} onChange={handleSettingsChange} />
                </div>
            </details>
            
             <details className="p-4 border dark:border-gray-700 rounded-md">
                <summary className="font-semibold text-lg cursor-pointer">Fonctionnalités</summary>
                <div className="mt-4 space-y-4">
                     <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <input type="checkbox" name="isChatEnabled" checked={settings.isChatEnabled} onChange={handleSettingsChange} className="h-5 w-5 rounded"/>
                        <span>Activer le chat client-vendeur</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <input type="checkbox" name="isComparisonEnabled" checked={settings.isComparisonEnabled} onChange={handleSettingsChange} className="h-5 w-5 rounded"/>
                        <span>Activer la comparaison de produits</span>
                    </label>
                </div>
            </details>

            <details className="p-4 border dark:border-gray-700 rounded-md" open>
                <summary className="font-semibold text-lg cursor-pointer">Livraison</summary>
                <div className="mt-4 space-y-4">
                    <Field label="Frais de base intra-urbain (FCFA)"><input type="number" name="deliverySettings.intraUrbanBaseFee" value={settings.deliverySettings.intraUrbanBaseFee} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                    <Field label="Frais de base inter-urbain (FCFA)"><input type="number" name="deliverySettings.interUrbanBaseFee" value={settings.deliverySettings.interUrbanBaseFee} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                    <Field label="Coût additionnel par Kg (FCFA)"><input type="number" name="deliverySettings.costPerKg" value={settings.deliverySettings.costPerKg} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                    <Field label="Réduction livraison pour Premium (%)"><input type="number" name="deliverySettings.premiumDeliveryDiscountPercentage" value={settings.deliverySettings.premiumDeliveryDiscountPercentage || 0} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                </div>
            </details>
            
             <details className="p-4 border dark:border-gray-700 rounded-md">
                <summary className="font-semibold text-lg cursor-pointer">Documents Vendeur Requis</summary>
                <div className="mt-4 space-y-2">
                    {Object.entries(settings.requiredSellerDocuments).map(([name, isRequired]) => (
                        <label key={name} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <input type="checkbox" checked={isRequired} onChange={(e) => handleRequiredDocsChange(name, e.target.checked)} className="h-5 w-5 rounded"/>
                            <span>{name}</span>
                        </label>
                    ))}
                </div>
            </details>

             <details className="p-4 border dark:border-gray-700 rounded-md">
                <summary className="font-semibold text-lg cursor-pointer">Plans Vendeurs</summary>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-4 border dark:border-gray-600 rounded-md space-y-4">
                        <h4 className="font-bold text-md">Plan Premium</h4>
                        <Field label="Prix (FCFA)"><input type="number" name="premiumPlan.price" value={settings.premiumPlan.price} onChange={handleSettingsChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Durée (jours)"><input type="number" name="premiumPlan.durationDays" value={settings.premiumPlan.durationDays} onChange={handleSettingsChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Limite de produits"><input type="number" name="premiumPlan.productLimit" value={settings.premiumPlan.productLimit} onChange={handleSettingsChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Commission (%)"><input type="number" name="premiumPlan.commissionRate" value={settings.premiumPlan.commissionRate} onChange={handleSettingsChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <label className="flex items-center gap-2"><input type="checkbox" name="premiumPlan.photoServiceIncluded" checked={settings.premiumPlan.photoServiceIncluded} onChange={handleSettingsChange} /> Service photo inclus</label>
                    </div>
                     <div className="p-4 border dark:border-gray-600 rounded-md space-y-4">
                        <h4 className="font-bold text-md">Plan Super Premium</h4>
                        <Field label="Prix (FCFA)"><input type="number" name="superPremiumPlan.price" value={settings.superPremiumPlan.price} onChange={handleSettingsChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Durée (jours)"><input type="number" name="superPremiumPlan.durationDays" value={settings.superPremiumPlan.durationDays} onChange={handleSettingsChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Limite de produits"><input type="number" name="superPremiumPlan.productLimit" value={settings.superPremiumPlan.productLimit} onChange={handleSettingsChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Commission (%)"><input type="number" name="superPremiumPlan.commissionRate" value={settings.superPremiumPlan.commissionRate} onChange={handleSettingsChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <label className="flex items-center gap-2"><input type="checkbox" name="superPremiumPlan.photoServiceIncluded" checked={settings.superPremiumPlan.photoServiceIncluded} onChange={handleSettingsChange} /> Service photo inclus</label>
                        <label className="flex items-center gap-2"><input type="checkbox" name="superPremiumPlan.featuredOnHomepage" checked={settings.superPremiumPlan.featuredOnHomepage} onChange={handleSettingsChange} /> Mise en avant sur l'accueil</label>
                    </div>
                </div>
            </details>
            
            <details className="p-4 border dark:border-gray-700 rounded-md">
                <summary className="font-semibold text-lg cursor-pointer">Programme de Fidélité Client</summary>
                <div className="mt-4 space-y-4">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <input type="checkbox" name="customerLoyaltyProgram.isEnabled" checked={settings.customerLoyaltyProgram.isEnabled} onChange={handleSettingsChange} className="h-5 w-5 rounded"/>
                        <span>Activer le programme de fidélité pour les clients</span>
                    </label>
                    
                    <div className="p-4 border dark:border-gray-600 rounded-md space-y-4">
                        <h4 className="font-bold text-md">Plan Premium Client</h4>
                        <Field label="Nombre de commandes requises"><input type="number" name="customerLoyaltyProgram.premium.thresholds.orders" value={settings.customerLoyaltyProgram.premium.thresholds.orders} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Montant total dépensé requis (FCFA)"><input type="number" name="customerLoyaltyProgram.premium.thresholds.spending" value={settings.customerLoyaltyProgram.premium.thresholds.spending} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Montant de la caution (FCFA)"><input type="number" name="customerLoyaltyProgram.premium.cautionAmount" value={settings.customerLoyaltyProgram.premium.cautionAmount} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Avantages (un par ligne)">
                            <textarea value={settings.customerLoyaltyProgram.premium.benefits.join('\n')} onChange={e => handleBenefitsChange('premium', e.target.value)} rows={5} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </Field>
                    </div>
                    
                    <div className="p-4 border dark:border-gray-600 rounded-md space-y-4">
                        <h4 className="font-bold text-md">Plan Premium+ Client</h4>
                        <label className="flex items-center gap-2"><input type="checkbox" name="customerLoyaltyProgram.premiumPlus.isEnabled" checked={settings.customerLoyaltyProgram.premiumPlus.isEnabled} onChange={handleSettingsChange} /> Activer le plan Premium+</label>
                        <Field label="Frais annuels (FCFA)"><input type="number" name="customerLoyaltyProgram.premiumPlus.annualFee" value={settings.customerLoyaltyProgram.premiumPlus.annualFee} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></Field>
                        <Field label="Avantages (un par ligne)">
                            <textarea value={settings.customerLoyaltyProgram.premiumPlus.benefits.join('\n')} onChange={e => handleBenefitsChange('premiumPlus', e.target.value)} rows={5} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </Field>
                    </div>
                </div>
            </details>

            <details className="p-4 border dark:border-gray-700 rounded-md">
                <summary className="font-semibold text-lg cursor-pointer">SEO & Métadonnées</summary>
                <div className="mt-4 space-y-4">
                    <Field label="Titre Méta par défaut"><input type="text" name="seo.metaTitle" value={settings.seo.metaTitle} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                    <Field label="Description Méta par défaut"><textarea name="seo.metaDescription" value={settings.seo.metaDescription} onChange={handleSettingsChange} rows={3} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                    <Field label="URL de l'image de partage (OpenGraph)"><input type="url" name="seo.ogImageUrl" value={settings.seo.ogImageUrl} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                </div>
            </details>

            <details className="p-4 border dark:border-gray-700 rounded-md">
                <summary className="font-semibold text-lg cursor-pointer">Gestion du contenu des pages</summary>
                <div className="mt-4 space-y-4">
                    {content.map(page => (
                        <div key={page.slug} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                            <Field label={`Titre de la page : ${page.title}`}><input type="text" value={page.title} onChange={e => handleContentChange(page.slug, 'title', e.target.value)} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                            <Field label="Contenu"><textarea value={page.content} onChange={e => handleContentChange(page.slug, 'content', e.target.value)} rows={4} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                        </div>
                    ))}
                </div>
            </details>
            
            <details className="p-4 border dark:border-gray-700 rounded-md">
                <summary className="font-semibold text-lg cursor-pointer">Modèles d'e-mails</summary>
                <div className="mt-4 space-y-4">
                    {(settings.emailTemplates || []).map(template => (
                        <div key={template.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                             <h4 className="font-bold text-md mb-2">{template.name}</h4>
                            <Field label="Sujet de l'e-mail"><input type="text" value={template.subject} onChange={e => handleEmailTemplateChange(template.id, 'subject', e.target.value)} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                            <Field label="Corps de l'e-mail" description={`Variables disponibles : ${template.variables}`}><textarea value={template.body} onChange={e => handleEmailTemplateChange(template.id, 'body', e.target.value)} rows={5} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                        </div>
                    ))}
                </div>
            </details>

             <details className="p-4 border dark:border-gray-700 rounded-md">
                 <summary className="font-semibold text-lg cursor-pointer">Mode Maintenance</summary>
                 <div className="mt-4 flex flex-col gap-4">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <input type="checkbox" name="maintenanceMode.isEnabled" checked={settings.maintenanceMode.isEnabled} onChange={handleSettingsChange} className="h-5 w-5 rounded"/>
                        <span>Activer le mode maintenance</span>
                    </label>
                    <Field label="Message de maintenance">
                         <textarea name="maintenanceMode.message" value={settings.maintenanceMode.message} onChange={handleSettingsChange} rows={2} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </Field>
                 </div>
            </details>
            
            <details className="p-4 border dark:border-gray-700 rounded-md">
                <summary className="font-semibold text-lg cursor-pointer">Pied de page (Footer)</summary>
                <div className="mt-4 space-y-4">
                    <Field label="Nom de l'entreprise (Copyright)"><input type="text" name="companyName" value={settings.companyName} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                    
                    <div className='p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md space-y-2'>
                        <h4 className='font-semibold'>Facebook</h4>
                        <ImageUrlOrUpload label="URL de l'icône" name="socialLinks.facebook.iconUrl" value={settings.socialLinks.facebook.iconUrl} preview={settings.socialLinks.facebook.iconUrl} onChange={handleSettingsChange} />
                        <Field label="URL du lien"><input type="url" name="socialLinks.facebook.linkUrl" value={settings.socialLinks.facebook.linkUrl} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                    </div>
                     <div className='p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md space-y-2'>
                        <h4 className='font-semibold'>Twitter</h4>
                        <ImageUrlOrUpload label="URL de l'icône" name="socialLinks.twitter.iconUrl" value={settings.socialLinks.twitter.iconUrl} preview={settings.socialLinks.twitter.iconUrl} onChange={handleSettingsChange} />
                        <Field label="URL du lien"><input type="url" name="socialLinks.twitter.linkUrl" value={settings.socialLinks.twitter.linkUrl} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                    </div>
                     <div className='p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md space-y-2'>
                        <h4 className='font-semibold'>Instagram</h4>
                        <ImageUrlOrUpload label="URL de l'icône" name="socialLinks.instagram.iconUrl" value={settings.socialLinks.instagram.iconUrl} preview={settings.socialLinks.instagram.iconUrl} onChange={handleSettingsChange} />
                        <Field label="URL du lien"><input type="url" name="socialLinks.instagram.linkUrl" value={settings.socialLinks.instagram.linkUrl} onChange={handleSettingsChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></Field>
                    </div>
                </div>
            </details>
        </div>
    );
};