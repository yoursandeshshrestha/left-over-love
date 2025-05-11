// src/components/ngo/SingleMarkerMap.tsx
"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SingleMarkerMapProps {
  position: [number, number]; // [latitude, longitude]
  popupContent?: string;
}

const SingleMarkerMap: React.FC<SingleMarkerMapProps> = ({
  position,
  popupContent,
}) => {
  useEffect(() => {
    // Fix the Leaflet icon issue
    delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
  }, []); // Empty dependency array since we only need to run this once

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        {popupContent && (
          <Popup>
            <div className="text-center">
              <strong>{popupContent}</strong>
            </div>
          </Popup>
        )}
      </Marker>
    </MapContainer>
  );
};

export default SingleMarkerMap;
