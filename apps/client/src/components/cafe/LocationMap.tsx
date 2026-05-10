import React, { useState } from "react";

interface LocationMapProps {
  address?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({ address }) => {
  const [zoomLevel, setZoomLevel] = useState(3); // 1 to 5
  
  const handleZoomIn = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoomLevel < 5) setZoomLevel(prev => prev + 1);
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoomLevel > 1) setZoomLevel(prev => prev - 1);
  };

  const handleReturnToCurrent = (e: React.MouseEvent) => {
    e.preventDefault();
    // In a real app, this would use geolocation API to center the map
    alert("現在地に移動します (GPS)");
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#e5e3df] rounded-xl overflow-hidden border border-[#d6cfc7]">
      {/* Placeholder Map Background - we will just simulate a map view */}
      <div 
        className="absolute inset-0 w-full h-full bg-[url('https://www.openstreetmap.org/export/embed.html?bbox=105.834%2C21.018%2C105.874%2C21.040&layer=mapnik')] bg-cover bg-center transition-transform duration-300"
        style={{ transform: `scale(${1 + (zoomLevel - 1) * 0.2})` }}
      >
        {/* Map tiles placeholder */}
      </div>

      {/* Center Cafe Pin (Fixed) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <span className="material-symbols-outlined text-[#e74c3c] text-4xl drop-shadow-md">
          location_on
        </span>
      </div>

      {/* Current Location Marker (Mock) */}
      <div className="absolute top-[60%] left-[40%] transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 bg-[#3498db] rounded-full border-2 border-white shadow-md"></div>
      </div>

      {/* Controls */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-2">
        <button
          onClick={handleReturnToCurrent}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-[#4f453e] hover:text-[#614734] hover:bg-gray-50 transition-colors"
          title="現在地へ戻る"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
        <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 5}
            className="w-10 h-10 flex items-center justify-center text-[#4f453e] hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white border-b border-gray-100 transition-colors"
            title="拡大"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="w-10 h-10 flex items-center justify-center text-[#4f453e] hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
            title="縮小"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
      </div>

      {/* Location Info Card */}
      <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-white/50">
        <p className="text-sm font-medium text-[#4f453e] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#614734]">map</span>
          {address || "地図を移動して場所を指定してください"}
        </p>
      </div>
    </div>
  );
};
