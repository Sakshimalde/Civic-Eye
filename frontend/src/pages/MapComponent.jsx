import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ onLocationSelect, initialCenter }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);

    // Default center (New York)
    const defaultCenter = [40.7128, -74.0060];

    useEffect(() => {
        // Initialize map
        const leafletMap = L.map(mapRef.current).setView(
            initialCenter ? [initialCenter.lat, initialCenter.lng] : defaultCenter,
            13
        );

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(leafletMap);

        // Add click event listener
        leafletMap.on('click', (e) => {
            const { lat, lng } = e.latlng;

            // Remove existing marker
            if (marker) {
                leafletMap.removeLayer(marker);
            }

            // Add new marker
            const newMarker = L.marker([lat, lng], {
                draggable: true,
            }).addTo(leafletMap);

            // Bind popup to marker
            newMarker.bindPopup('Selected Location<br>Drag to adjust').openPopup();

            setMarker(newMarker);

            // Call the callback with coordinates
            if (onLocationSelect) {
                onLocationSelect(lat, lng);
            }

            // Add drag end listener
            newMarker.on('dragend', (dragEvent) => {
                const newPosition = dragEvent.target.getLatLng();
                const newLat = newPosition.lat;
                const newLng = newPosition.lng;
                
                // Update popup content
                newMarker.setPopupContent('Selected Location (Adjusted)<br>Drag to adjust');
                
                if (onLocationSelect) {
                    onLocationSelect(newLat, newLng);
                }
            });
        });

        // If initial center is provided, add a marker
        if (initialCenter) {
            const initialMarker = L.marker([initialCenter.lat, initialCenter.lng], {
                draggable: true,
            }).addTo(leafletMap);
            
            initialMarker.bindPopup('Current Location<br>Drag to adjust').openPopup();
            setMarker(initialMarker);

            // Add drag end listener for initial marker
            initialMarker.on('dragend', (dragEvent) => {
                const newPosition = dragEvent.target.getLatLng();
                const newLat = newPosition.lat;
                const newLng = newPosition.lng;
                
                initialMarker.setPopupContent('Selected Location (Adjusted)<br>Drag to adjust');
                
                if (onLocationSelect) {
                    onLocationSelect(newLat, newLng);
                }
            });
        }

        setMap(leafletMap);

        // Cleanup function
        return () => {
            if (leafletMap) {
                leafletMap.remove();
            }
        };
    }, [onLocationSelect, initialCenter]);

    // Effect to update map center when initialCenter changes
    useEffect(() => {
        if (map && initialCenter) {
            map.setView([initialCenter.lat, initialCenter.lng], 13);
        }
    }, [map, initialCenter]);

    return (
        <div 
            ref={mapRef} 
            style={{ 
                width: '100%', 
                height: '400px', 
                borderRadius: '8px',
                border: '2px solid #e2e8f0'
            }} 
        />
    );
};

export default MapComponent;