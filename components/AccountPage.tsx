import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Address, Order, Store, Ticket, TicketMessage, User } from '../types';
import { 
    ArrowLeftIcon, BuildingStorefrontIcon, 
    ChatBubbleBottomCenterTextIcon, CheckCircleIcon, 
    ClipboardDocumentListIcon, Cog8ToothIcon, 
    HeartIcon, PencilSquareIcon, PlusIcon, 
    StarIcon, StarPlatinumIcon, TrashIcon, UserCircleIcon, XIcon, 
    PhotoIcon, MapPinIcon, BellSnoozeIcon, LockClosedIcon, ShieldExclamationIcon,
    ChartPieIcon, ArrowPathIcon, PaperAirplaneIcon, PaperclipIcon
} from './Icons';
import OrderHistoryPage from './OrderHistoryPage';
import StoreCard from './StoreCard';

// Leaflet is loaded from a script tag in index.html
declare const L: any;

// Helper components
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

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={className}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{title}</h2>
        {children}
    </div>
);

// Tab Components Implementation
const DashboardTab: React.FC<{ user: User; userOrders: Order[]; allStores: Store[], onTabChange: (tab: string) => void; onSelectOrder: (order: Order) => void; }> = ({ user, userOrders, allStores, onTabChange, onSelectOrder }) => {
    const lastOrder = userOrders.length > 0 ? userOrders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0] : null;
    const followedStores = allStores.filter(s => user.followedStores?.includes(s.id));
    
    return (
        <Section title={`Bienvenue, ${user.name} !`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Statut de Fidélité</h3>
                    <div className="flex items-center gap-2">
                         {user.loyalty.status === 'premium' && <StarIcon className="w-6 h-6 text-kmer-yellow" />}
                         {user.loyalty.status === 'premium_plus' && <StarPlatinumIcon className="w-6 h-6 text-kmer-red" />}
                        <p>Vous êtes un membre <span className="font-bold text-kmer-green capitalize">{user.loyalty.status.replace('_', '+')}</span>.</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Total commandes : {user.loyalty.orderCount}</p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Dernière commande</h3>
                    {lastOrder ? (
                        <>
                            <p>ID: <span className="font-mono text-sm">{lastOrder.id}</span></p>
                            <p>Statut: {lastOrder.status}</p>
                            <button onClick={() => onSelectOrder(lastOrder)} className="text-sm text-kmer-green font-semibold mt-2">Voir les détails</button>
                        </>
                    ) : <p>Aucune commande récente.</p>}
                </div>
                <div className="md:col-span-2 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-bold text-lg mb-4">Boutiques Suivies</h3>
                     {followedStores.length > 0 ? (
                        <div className="flex flex-wrap gap-4">
                            {followedStores.slice(0, 5).map(s => (
                                <div key={s.id} className="text-center">
                                    <img src={s.logoUrl} alt={s.name} className="w-16 h-16 rounded-full object-contain bg-white shadow-md"/>
                                    <p className="text-xs mt-1 w-16 truncate">{s.name}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p>Vous ne suivez aucune boutique.</p>}
                    <button onClick={() => onTabChange('followed-stores')} className="text-sm text-kmer-green font-semibold mt-4">Gérer mes boutiques</button>
                </div>
            </div>
        </Section>
    );
};

const ProfileTab: React.FC<{ user: User; onUpdate: (updates: Partial<User>) => void }> = ({ user, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>(user);
    const [avatarPreview, setAvatarPreview] = useState(user.profilePictureUrl);
    
    useEffect(() => {
        setFormData(user);
        setAvatarPreview(user.profilePictureUrl);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatarPreview(result);
                setFormData(prev => ({...prev, profilePictureUrl: result}));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSave = () => {
        onUpdate(formData);
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setFormData(user);
        setAvatarPreview(user.profilePictureUrl);
        setIsEditing(false);
    };
    
    return (
        <Section title="Mon Profil">
            <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                    <img src={avatarPreview || `https://ui-avatars.com/api/?name=${user.name}&background=008000&color=fff`} alt="Avatar" className="w-24 h-24 rounded-full object-cover"/>
                    {isEditing && (
                        <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-600 p-1.5 rounded-full cursor-pointer shadow-md">
                            <PencilSquareIcon className="w-5 h-5"/>
                            <input id="avatar-upload" type="file" className="sr-only" onChange={handleAvatarChange} accept="image/*"/>
                        </label>
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <p className="text-gray-500">{user.email}</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-gray-500">Nom complet</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} disabled={!isEditing} className="w-full p-2 mt-1 border rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-600"/></div>
                    <div><label className="text-sm font-medium text-gray-500">Téléphone principal</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} disabled={!isEditing} className="w-full p-2 mt-1 border rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-600"/></div>
                    <div><label className="text-sm font-medium text-gray-500">Date de naissance</label><input type="date" name="birthDate" value={formData.birthDate?.split('T')[0] || ''} onChange={handleChange} disabled={!isEditing} className="w-full p-2 mt-1 border rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-600"/></div>
                    <div><label className="text-sm font-medium text-gray-500">Genre</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} disabled={!isEditing} className="w-full p-2 mt-1 border rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-600">
                            <option>Préfère ne pas répondre</option><option>Homme</option><option>Femme</option><option>Autre</option>
                        </select>
                    </div>
                </div>
            </div>
            
             <div className="mt-8 flex gap-4">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg">Enregistrer</button>
                        <button onClick={handleCancel} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-6 rounded-lg">Annuler</button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg">Modifier le profil</button>
                )}
            </div>
        </Section>
    );
};

const AddressesTab: React.FC = () => {
    const { user, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingAddress(null);
        setIsFormOpen(true);
    };

    const handleSave = (address: Address) => {
        if (!user) return;
        if (editingAddress) {
            updateAddress(user.id, address);
        } else {
            addAddress(user.id, address);
        }
        setIsFormOpen(false);
    };

    if (!user) return null;

    return (
        <Section title="Mes Adresses">
            {isFormOpen ? (
                <AddressForm
                    address={editingAddress}
                    onSave={handleSave}
                    onCancel={() => setIsFormOpen(false)}
                />
            ) : (
                <div className="space-y-4">
                    <button onClick={handleAddNew} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-5 h-5"/> Ajouter une nouvelle adresse
                    </button>
                    {user.addresses && user.addresses.map(addr => (
                        <div key={addr.id} className={`p-4 border rounded-lg ${addr.isDefault ? 'border-kmer-green bg-green-50 dark:bg-green-900/20' : 'dark:border-gray-700'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{addr.label}</p>
                                    <address className="not-italic text-gray-600 dark:text-gray-300">
                                        {addr.fullName}<br/>
                                        {addr.address}, {addr.city}<br/>
                                        {addr.phone}
                                    </address>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(addr)}><PencilSquareIcon className="w-5 h-5 text-gray-500 hover:text-blue-500"/></button>
                                    <button onClick={() => deleteAddress(user.id, addr.id!)}><TrashIcon className="w-5 h-5 text-gray-500 hover:text-red-500"/></button>
                                </div>
                            </div>
                             {!addr.isDefault && (
                                <button onClick={() => setDefaultAddress(user.id, addr.id!)} className="text-sm font-semibold text-kmer-green mt-2">Définir par défaut</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Section>
    );
};

const AddressForm: React.FC<{ address: Address | null, onSave: (address: Address) => void, onCancel: () => void }> = ({ address, onSave, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Address>({
        id: address?.id || undefined,
        isDefault: address?.isDefault || false,
        label: address?.label || 'Maison',
        fullName: address?.fullName || user?.name || '',
        phone: address?.phone || user?.phone || '',
        address: address?.address || '',
        city: address?.city || 'Douala',
        latitude: address?.latitude,
        longitude: address?.longitude,
    });
    
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        const initialLatLng: [number, number] = [formData.latitude || 4.05, formData.longitude || 9.75];
        if (mapContainerRef.current && !mapRef.current && typeof L !== 'undefined') {
            mapRef.current = L.map(mapContainerRef.current).setView(initialLatLng, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
            
             const updateMarker = (latlng: { lat: number, lng: number }) => {
                setFormData(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
                if (!markerRef.current) {
                    markerRef.current = L.marker(latlng, { draggable: true }).addTo(mapRef.current);
                    markerRef.current.on('dragend', (e: any) => updateMarker(e.target.getLatLng()));
                } else {
                    markerRef.current.setLatLng(latlng);
                }
            };
            
            if (formData.latitude && formData.longitude) {
                updateMarker({ lat: formData.latitude, lng: formData.longitude });
            }
            
            mapRef.current.on('click', (e: any) => updateMarker(e.latlng));
        }
        setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Nom complet" className="w-full p-2 border rounded-md" required />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Téléphone" className="w-full p-2 border rounded-md" required />
                <input name="label" value={formData.label} onChange={handleChange} placeholder="Étiquette (Maison, Bureau...)" className="w-full p-2 border rounded-md" />
                <select name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded-md">
                    <option>Douala</option><option>Yaoundé</option><option>Bafoussam</option>
                </select>
                
                <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Adresse (Rue, quartier, repère...)" rows={2} className="w-full p-2 border rounded-md md:col-span-2" required />
            </div>
             <div>
                <label className="text-sm font-medium">Position sur la carte</label>
                <div ref={mapContainerRef} className="h-64 w-full mt-2 rounded-md z-0"></div>
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 font-bold py-2 px-4 rounded-lg">Annuler</button>
                <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">Enregistrer</button>
            </div>
        </form>
    );
};

const OrdersTab: React.FC<{ userOrders: Order[]; onSelectOrder: (order: Order) => void; onRepeatOrder: (order: Order) => void }> = ({ userOrders, onSelectOrder, onRepeatOrder }) => (
    <Section title="Mes Commandes">
      <OrderHistoryPage userOrders={userOrders} onBack={() => {}} onSelectOrder={onSelectOrder} onRepeatOrder={onRepeatOrder} />
    </Section>
);

const FollowedStoresTab: React.FC<{ allStores: Store[]; onVendorClick: (vendorName: string) => void }> = ({ allStores, onVendorClick }) => {
    const { user } = useAuth();
    const followedStores = allStores.filter(s => user?.followedStores?.includes(s.id));
    
    return (
        <Section title="Boutiques Suivies">
             {followedStores.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {followedStores.map(s => <StoreCard key={s.id} store={s} onVisitStore={onVendorClick} />)}
                </div>
            ) : <p>Vous ne suivez aucune boutique pour le moment.</p>}
        </Section>
    );
};

const SupportTab: React.FC<{ userTickets: Ticket[]; userOrders: Order[]; onCreateTicket: (subject: string, message: string, orderId?: string, type?: 'support' | 'service_request', attachments?: string[]) => void; onUserReplyToTicket: (ticketId: string, message: string, attachments?: string[]) => void; }> = (props) => {
    const { userTickets, userOrders, onCreateTicket, onUserReplyToTicket } = props;
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    if (isCreating) {
        return <NewTicketForm userOrders={userOrders} onCreate={onCreateTicket} onCancel={() => setIsCreating(false)} />;
    }
    
    if (selectedTicket) {
        return <TicketDetailView ticket={selectedTicket} onReply={onUserReplyToTicket} onBack={() => setSelectedTicket(null)} />;
    }

    return (
        <Section title="Support Client">
            <button onClick={() => setIsCreating(true)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg mb-4">Créer un nouveau ticket</button>
            <div className="space-y-2">
                {userTickets.map(ticket => (
                    <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{ticket.subject} <span className="font-normal text-sm text-gray-500">- {ticket.userName}</span></p>
                            <p className="text-xs text-gray-500">Dernière mise à jour: {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ticket.status === 'Résolu' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{ticket.status}</span>
                    </button>
                ))}
            </div>
        </Section>
    );
};

const NewTicketForm: React.FC<{ userOrders: Order[], onCreate: (s: string, m: string, o?: string, type?: 'support' | 'service_request', a?: string[]) => void, onCancel: () => void }> = ({ userOrders, onCreate, onCancel }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [orderId, setOrderId] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach((file: Blob) => {
                const reader = new FileReader();
                reader.onloadend = () => setAttachments(prev => [...prev, reader.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };
    
    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(subject, message, orderId, 'support', attachments);
    };

    return (
        <Section title="Créer un ticket">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Sujet" className="w-full p-2 border rounded-md" required />
                 <select value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full p-2 border rounded-md">
                     <option value="">(Optionnel) Lier à une commande</option>
                     {userOrders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                 </select>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez votre problème..." rows={5} className="w-full p-2 border rounded-md" required />
                <div>
                    <label htmlFor="attachments-upload-new" className="cursor-pointer text-sm font-semibold text-blue-500 flex items-center gap-2"><PaperclipIcon className="w-4 h-4" /> Joindre des fichiers</label>
                    <input id="attachments-upload-new" type="file" multiple onChange={handleFileChange} className="hidden" />
                    {attachments.length > 0 && <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />}
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="bg-gray-200 font-bold py-2 px-4 rounded-lg">Annuler</button>
                    <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">Envoyer</button>
                </div>
            </form>
        </Section>
    );
};

const AttachmentPreview: React.FC<{ attachments: string[], onRemove: (index: number) => void }> = ({ attachments, onRemove }) => (
    <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
        {attachments.map((url, i) => (
            <div key={i} className="relative group">
                <img src={url} alt={`Aperçu ${i}`} className="h-20 w-full object-cover rounded-md"/>
                <button type="button" onClick={() => onRemove(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        ))}
    </div>
);

const MessageAttachments: React.FC<{ urls: string[] }> = ({ urls }) => (
    <div className="mt-2 flex flex-wrap gap-2">
        {urls.map((url, i) => {
            const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(url) || url.startsWith('data:image');
            if (isImage) {
                return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block"><img src={url} alt={`Pièce jointe ${i+1}`} className="h-24 w-auto rounded-md object-contain border dark:border-gray-600"/></a>
            }
            return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm flex items-center gap-1 p-2 bg-blue-50 dark:bg-blue-900/50 rounded-md"><PaperclipIcon className="w-4 h-4"/>Pièce jointe {i+1}</a>
        })}
    </div>
);

const TicketDetailView: React.FC<{ ticket: Ticket, onReply: (id: string, msg: string, attachments?: string[]) => void, onBack: () => void }> = ({ ticket, onReply, onBack }) => {
    const [reply, setReply] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const { user } = useAuth();
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach((file: Blob) => {
                const reader = new FileReader();
                reader.onloadend = () => setAttachments(prev => [...prev, reader.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };
    
    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onReply(ticket.id, reply, attachments);
        setReply('');
        setAttachments([]);
    };

    return (
        <Section title={ticket.subject}>
            <button onClick={onBack} className="text-sm font-semibold text-kmer-green mb-4"> &lt; Retour à la liste</button>
            <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50 mb-4 space-y-4">
              {ticket.messages.map((msg, i) => {
                  const isMe = msg.authorId === user?.id;
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg max-w-sm ${isMe ? 'bg-kmer-green text-white' : 'bg-white'}`}>
                        <p className="font-bold text-sm">{msg.authorName}</p>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        {msg.attachmentUrls && <MessageAttachments urls={msg.attachmentUrls} />}
                      </div>
                    </div>
                  );
              })}
            </div>
            <form onSubmit={handleSubmit}>
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Votre réponse..." className="w-full p-2 border rounded-md"></textarea>
                <div className="mt-2">
                    <label htmlFor="attachments-upload-reply" className="cursor-pointer text-sm font-semibold text-blue-500 flex items-center gap-2"><PaperclipIcon className="w-4 h-4" /> Joindre des fichiers</label>
                    <input id="attachments-upload-reply" type="file" multiple onChange={handleFileChange} className="hidden" />
                    {attachments.length > 0 && <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />}
                </div>
                <button type="submit" className="mt-2 bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">Envoyer</button>
            </form>
        </Section>
    );
};

const NotificationsTab: React.FC = () => {
    const { user, updateUserInfo } = useAuth();
    const [prefs, setPrefs] = useState(user?.notificationPreferences || { promotions: true, orderUpdates: true, newsletters: true });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setPrefs(p => ({ ...p, [name]: checked }));
    };

    const handleSave = () => {
        if (user) {
            updateUserInfo(user.id, { notificationPreferences: prefs });
            alert("Préférences sauvegardées !");
        }
    };

    return (
        <Section title="Notifications">
            <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border rounded-lg">
                    <input type="checkbox" name="orderUpdates" checked={prefs.orderUpdates} onChange={handleChange} className="h-5 w-5 rounded"/>
                    <span>Mises à jour de mes commandes</span>
                </label>
                 <label className="flex items-center gap-3 p-4 border rounded-lg">
                    <input type="checkbox" name="promotions" checked={prefs.promotions} onChange={handleChange} className="h-5 w-5 rounded"/>
                    <span>Promotions et ventes flash</span>
                </label>
                 <label className="flex items-center gap-3 p-4 border rounded-lg">
                    <input type="checkbox" name="newsletters" checked={prefs.newsletters} onChange={handleChange} className="h-5 w-5 rounded"/>
                    <span>Newsletters de KMER ZONE</span>
                </label>
            </div>
            <button onClick={handleSave} className="mt-6 bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">Enregistrer les préférences</button>
        </Section>
    );
};

const SecurityTab: React.FC = () => {
    const { user, changePassword } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
            return;
        }
        if (user && changePassword(user.id, oldPassword, newPassword)) {
            setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès !' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setMessage({ type: 'error', text: 'L\'ancien mot de passe est incorrect.' });
        }
    };

    return (
        <Section title="Sécurité">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <h3 className="font-semibold text-lg">Changer mon mot de passe</h3>
                 <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Ancien mot de passe" className="w-full p-2 border rounded-md" required />
                 <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full p-2 border rounded-md" required />
                 <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmer le nouveau mot de passe" className="w-full p-2 border rounded-md" required />
                {message && <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
                <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">Mettre à jour</button>
            </form>
        </Section>
    );
};

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
  
  if (!user) {
    return <div>Veuillez vous connecter pour voir cette page.</div>;
  }
  
  const userTickets = allTickets.filter(t => t.userId === user.id);
  
  const handleUpdateProfile = (updates: Partial<User>) => {
      updateUserInfo(user.id, updates);
  };
  
  const TABS = [
      { id: 'dashboard', label: 'Tableau de bord', icon: <ChartPieIcon className="w-5 h-5"/> },
      { id: 'profile', label: 'Mon Profil', icon: <UserCircleIcon className="w-5 h-5"/> },
      { id: 'addresses', label: 'Mes Adresses', icon: <MapPinIcon className="w-5 h-5"/> },
      { id: 'orders', label: 'Mes Commandes', icon: <ClipboardDocumentListIcon className="w-5 h-5"/> },
      { id: 'followed-stores', label: 'Boutiques Suivies', icon: <HeartIcon className="w-5 h-5"/> },
      { id: 'support', label: 'Support Client', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/> },
      { id: 'notifications', label: 'Notifications', icon: <BellSnoozeIcon className="w-5 h-5"/> },
      { id: 'security', label: 'Sécurité', icon: <LockClosedIcon className="w-5 h-5"/> },
  ];

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
      default: return <DashboardTab user={user} userOrders={userOrders} allStores={allStores} onTabChange={setActiveTab} onSelectOrder={onSelectOrder} />;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour
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