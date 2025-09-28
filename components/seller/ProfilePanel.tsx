import React from 'react';
import SellerProfile from '../SellerProfile';
import type { Store } from '../../types';

interface ProfilePanelProps {
    store: Store;
    onUpdateProfile: (storeId: string, updatedData: Partial<Store>) => void;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ store, onUpdateProfile }) => {
    return (
         <SellerProfile 
            store={store} 
            onUpdateProfile={onUpdateProfile}
            onBack={() => {}} // Dummy function, not needed inside the dashboard panel
        />
    );
};

export default ProfilePanel;