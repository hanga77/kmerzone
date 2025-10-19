import React, { useEffect, useRef } from 'react';

declare namespace L {
    interface LatLng {
        lat: number;
        lng: number;
        alt?: number;
    }
}
declare const L: any;

export const MissionMap: React.FC<{ start?: L.LatLng; end?: L.LatLng }> = ({ start, end }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);
    const routingControlRef = useRef<any>(null);

    useEffect(() => {
        if (mapRef.current && !leafletMap.current) {
            leafletMap.current = L.map(mapRef.current).setView([4.05, 9.75], 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(leafletMap.current);
        }

        if (leafletMap.current && end) {
            if (routingControlRef.current) {
                leafletMap.current.removeControl(routingControlRef.current);
            }
            if(start) {
                routingControlRef.current = L.Routing.control({
                    waypoints: [start, end],
                    routeWhileDragging: false,
                    show: false,
                    createMarker: () => null
                }).addTo(leafletMap.current);
            } else {
                 L.marker(end).addTo(leafletMap.current);
                 leafletMap.current.setView(end, 14);
            }
        }
        setTimeout(() => leafletMap.current?.invalidateSize(true), 100);
    }, [start, end]);

    return <div ref={mapRef} className="h-48 w-full rounded-md mt-4 z-0"></div>;
};