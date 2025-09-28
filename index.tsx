import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { UIProvider } from './contexts/UIContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import { LanguageProvider } from './contexts/LanguageContext';

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>
        <ThemeProvider>
            <LanguageProvider>
                <UIProvider>
                    <CartProvider>
                        <WishlistProvider>
                            <ComparisonProvider>
                                <ChatProvider>
                                    {children}
                                </ChatProvider>
                            </ComparisonProvider>
                        </WishlistProvider>
                    </CartProvider>
                </UIProvider>
            </LanguageProvider>
        </ThemeProvider>
    </AuthProvider>
);


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <AppProviders>
    <App />
  </AppProviders>
);
