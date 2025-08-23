import React, { useEffect, useRef, useState } from 'react';
import type { Store } from '../types';
import { ArrowLeftIcon } from './Icons';

declare const L: any;

interface StoresMapPageProps {
  stores: Store[];
  onBack: () => void;
  onVisitStore: (storeName: string) => void;
}

const StoresMapPage: React.FC<StoresMapPageProps> = ({ stores, onBack, onVisitStore }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedCity, setSelectedCity] = useState<'all' | 'Douala' | 'Yaoundé'>('all');

  const cityCoordinates = {
    'Douala': { lat: 4.0511, lng: 9.7679, zoom: 12 },
    'Yaoundé': { lat: 3.8480, lng: 11.5021, zoom: 12 },
    'all': { lat: 3.95, lng: 10.6, zoom: 7 }
  };

  useEffect(() => {
    if (mapContainer.current && !mapRef.current) {
      mapRef.current = L.map(mapContainer.current).setView([cityCoordinates.all.lat, cityCoordinates.all.lng], cityCoordinates.all.zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      // Clear existing markers
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          mapRef.current.removeLayer(layer);
        }
      });

      const { lat, lng, zoom } = cityCoordinates[selectedCity];
      mapRef.current.flyTo([lat, lng], zoom);

      const filteredStores = stores.filter(store =>
        selectedCity === 'all' || store.location === selectedCity
      );
      
      filteredStores.forEach(store => {
        if (store.latitude && store.longitude) {
          const marker = L.marker([store.latitude, store.longitude]).addTo(mapRef.current);
          const popupContent = `
            <div class="p-1">
              <img src="${store.logoUrl}" alt="${store.name}" class="w-24 h-12 object-contain mx-auto mb-2 rounded"/>
              <b class="text-base text-kmer-green">${store.name}</b><br>
              ${store.neighborhood}, ${store.location}<br>
              <button class="map-popup-button" data-store="${store.name}">Visiter la boutique</button>
            </div>
          `;
          marker.bindPopup(popupContent);
        }
      });
      
      // Add event listener for popup buttons
      mapRef.current.on('popupopen', (e: any) => {
        const button = e.popup._container.querySelector('.map-popup-button');
        if (button) {
            button.addEventListener('click', (ev: MouseEvent) => {
                ev.preventDefault();
                onVisitStore(button.dataset.store);
            });
        }
      });
    }
  }, [selectedCity, stores, onVisitStore]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour à la liste des boutiques
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Carte des Boutiques</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="city-filter" className="text-sm font-medium dark:text-gray-300">Filtrer par ville:</label>
            <select
              id="city-filter"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as any)}
              className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm font-semibold focus:ring-kmer-green focus:border-kmer-green"
            >
              <option value="all">Toutes</option>
              <option value="Douala">Douala</option>
              <option value="Yaoundé">Yaoundé</option>
            </select>
          </div>
        </div>
        <div ref={mapContainer} style={{ height: '600px', width: '100%', borderRadius: '8px', zIndex: 1 }} />
        <style>{`
          .map-popup-button { 
            color: white; 
            background-color: #84CC16; 
            border: none; 
            padding: 5px 10px; 
            border-radius: 4px; 
            cursor: pointer; 
            margin-top: 8px; 
            font-weight: bold;
            width: 100%;
          }
          .map-popup-button:hover {
            background-color: #65A30D;
          }
          .leaflet-popup-content-wrapper {
            border-radius: 8px;
          }
          .leaflet-popup-content {
            margin: 10px;
            font-family: 'Poppins', sans-serif;
            text-align: center;
          }
        `}</style>
      </div>
    </div>
  );
};

export default StoresMapPage;