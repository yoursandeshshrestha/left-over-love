// src/components/ngo/MapView.tsx
"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapMarker } from "@/lib/types";

interface MapViewProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (id: string) => void;
}

const MapView: React.FC<MapViewProps> = ({
  markers,
  center = [27.7172, 85.324], // Default to Kathmandu
  zoom = 13,
  onMarkerClick,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView(center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((marker) => {
      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: ${getMarkerColor(
          marker.expiryTime
        )}; width: 30px; height: 30px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; border: 2px solid white;">${
          marker.quantity.value
        }</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
      });

      const leafletMarker = L.marker(marker.position, { icon: customIcon })
        .bindPopup(createPopupContent(marker))
        .addTo(mapRef.current!);

      if (onMarkerClick) {
        leafletMarker.on("click", () => onMarkerClick(marker.id));
      }

      markersRef.current.push(leafletMarker);
    });
  }, [markers, onMarkerClick]);

  return <div id="map" className="h-full w-full rounded-lg" />;
};

const getMarkerColor = (expiryTime: string): string => {
  const timeUntilExpiry = getTimeUntilExpiry(expiryTime);
  if (timeUntilExpiry === "Expired") return "#ef4444"; // red-500
  if (timeUntilExpiry.includes("hour")) return "#f97316"; // orange-500
  return "#22c55e"; // green-500
};

const getTimeUntilExpiry = (expiryTime: string): string => {
  const expiry = new Date(expiryTime);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hours left`;
  return `${Math.floor(hours / 24)} days left`;
};

const createPopupContent = (marker: MapMarker): string => {
  return `
    <div class="w-56">
      <h3 class="font-medium text-lg mb-1">${marker.title}</h3>
      <p class="text-sm text-gray-600 mb-2">${marker.description.substring(
        0,
        100
      )}...</p>
      <div class="flex justify-between text-sm mb-2">
        <span>Quantity: ${marker.quantity.value} ${marker.quantity.unit}</span>
        <span class="px-2 rounded-full ${
          getTimeUntilExpiry(marker.expiryTime) === "Expired"
            ? "bg-red-100 text-red-800"
            : "bg-green-100 text-green-800"
        }">${getTimeUntilExpiry(marker.expiryTime)}</span>
      </div>
      <div class="text-sm mb-3">
        <div>From: ${
          marker.vendor.vendorDetails?.businessName || marker.vendor.name
        }</div>
        <div>${marker.address.street}, ${marker.address.city}</div>
      </div>
      <a href="/ngo/available-food/${
        marker.id
      }" class="block w-full text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
        View & Claim
      </a>
    </div>
  `;
};

export default MapView;
