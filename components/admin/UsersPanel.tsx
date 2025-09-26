import React, { useState, useMemo } from 'react';
import type { User, UserRole, PickupPoint } from '../../types';
import { PencilSquareIcon, PlusIcon } from '../Icons';

interface UsersPanelProps {
    allUsers: User[];
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    onCreateUserByAdmin: (data: { name: string, email: string, role: UserRole }) => void;
    allPickupPoints: PickupPoint[];
}

export const UsersPanel: React.FC<UsersPanelProps> = ({ allUsers, onUpdateUser, onCreateUserByAdmin, allPickupPoints }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const filteredUsers = useMemo(() => 
        allUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())),
        [allUsers, searchTerm]
    );

    const UserForm = ({ user, onSave, onCancel }: { user?: User | null, onSave: (data: any) => void, onCancel: () => void }) => {
        const [data, setData] = useState({ name: user?.name || '', email: user?.email || '', role: user?.role || 'customer', depotId: user?.depotId || '' });
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setData(d => ({...d, [e.target.name]: e.target.value}));
        const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(data); };

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4">
                    <h3 className="text-lg font-bold">{user ? "Modifier l'utilisateur" : "Créer un utilisateur"}</h3>
                    <input name="name" value={data.name} onChange={handleChange} placeholder="Nom complet" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    <input type="email" name="email" value={data.email} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required disabled={!!user} />
                    <select name="role" value={data.role} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="customer">Client</option>
                        <option value="seller">Vendeur</option>
                        <option value="delivery_agent">Livreur</option>
                        <option value="depot_agent">Agent de dépôt</option>
                        <option value="depot_manager">Chef de Dépôt</option>
                        <option value="superadmin">Super Admin</option>
                    </select>
                    {(data.role === 'depot_agent' || data.role === 'depot_manager') && (
                        <div>
                            <label htmlFor="depotId" className="block text-sm font-medium dark:text-gray-300">Point de Dépôt Assigné</label>
                            <select name="depotId" id="depotId" value={data.depotId} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mt-1">
                                <option value="">-- Non assigné --</option>
                                {allPickupPoints.map(point => (
                                    <option key={point.id} value={point.id}>{point.name} - {point.city}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Annuler</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">Sauvegarder</button>
                    </div>
                </form>
            </div>
        )
    };
    
    const handleSaveUser = (data: any) => {
        if (editingUser) {
            const updates: Partial<User> = { role: data.role, name: data.name };
            if (data.role === 'depot_agent' || data.role === 'depot_manager') {
                updates.depotId = data.depotId || undefined;
            } else {
                updates.depotId = undefined; // Clear depotId if role changes
            }
            onUpdateUser(editingUser.id, updates);
        } else {
            onCreateUserByAdmin(data);
        }
        setEditingUser(null);
        setIsCreating(false);
    };

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">Gestion des Utilisateurs ({allUsers.length})</h2>
            <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Rechercher par nom ou email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-md w-1/2 dark:bg-gray-700 dark:border-gray-600"/>
                <button onClick={() => setIsCreating(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Créer un utilisateur</button>
            </div>
            {(editingUser || isCreating) && <UserForm user={editingUser} onSave={handleSaveUser} onCancel={() => {setEditingUser(null); setIsCreating(false);}}/>}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700"><tr >
                        <th className="p-2 text-left">Nom</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Rôle</th><th className="p-2 text-center">Action</th>
                    </tr></thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b dark:border-gray-700">
                                <td className="p-2">{user.name}</td><td className="p-2">{user.email}</td><td className="p-2 capitalize">{user.role.replace('_', ' ')}</td>
                                <td className="p-2 text-center"><button onClick={() => setEditingUser(user)} className="text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};