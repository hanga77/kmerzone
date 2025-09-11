import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { UIProvider } from './contexts/UIContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { ChatProvider } from './contexts/ChatContext';

const Main = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

  return (
    <React.StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <WishlistProvider>
            <UIProvider>
              <ComparisonProvider>
                <CartProvider>
                  <ChatProvider>
                    <App />
                  </ChatProvider>
                </CartProvider>
              </ComparisonProvider>
            </UIProvider>
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<Main />);