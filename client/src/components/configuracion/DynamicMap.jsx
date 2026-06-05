import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Icon } from '@iconify/react';

// Generador de iconos SVG dinámicos por tipo
const getSvgIcon = (type) => {
  const color = type === "ASIC" ? "#011140" : "#397373";

  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgTemplate,
    className: "custom-svg-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Se renombra a MapComponent para evitar el error "Constructor Map requires 'new'"
const MapComponent = ({ locations }) => {
  const defaultPosition = [11.4045, -69.6775]; 

  const mapCenter = locations && locations.length > 0 
    ? [parseFloat(locations[0].latitud), parseFloat(locations[0].longitud)]
    : defaultPosition;

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations?.map((site, index) => {
          const lat = parseFloat(site.latitud);
          const lng = parseFloat(site.longitud);

          if (isNaN(lat) || isNaN(lng)) return null;

          // Variables dinámicas de diseño según el tipo
          const isAsic = site.type === "ASIC";
          const btnBgColor = isAsic ? "bg-[#011140] hover:bg-[#011140]/90" : "bg-[#397373] hover:bg-[#397373]/90";

          return (
            <React.Fragment key={site.id || index}>
              {/* 1. RENDERIZAR EL MARCADOR (Para todos los sitios) */}
              <Marker 
                position={[lat, lng]} 
                icon={getSvgIcon(site.type)}
              >
                <Popup>
                  <div className="p-1 max-w-[200px] flex flex-col gap-1.5">
                    <h3 className="font-bold text-sm text-gray-900 m-0 leading-tight">{site.nombre}</h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-auto text-white ${isAsic ? "bg-[#011140]" : "bg-[#397373]"}`}>
                      {site.type}
                    </span>
                    <p className="text-xs text-gray-600 m-0 leading-normal">{site.direccion}</p>
                    
                    <a 
                      href={site.google_maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-1.5 text-xs text-white font-medium  px-2.5 rounded transition-colors no-underline mt-1`}
                    >
                      <Icon icon="logos:google-maps" className="w-3.5 h-3.5" />
                      Ver en Google Maps
                    </a>
                  </div>
                </Popup>
              </Marker>

              {/* 2. RENDERIZAR EL TERRITORIO (Solo si es un ASIC y tiene poligonal registrada) */}
              {isAsic && site.territorio && site.territorio.length > 0 && (
                <Polygon
                  positions={site.territorio}
                  pathOptions={{
                    color: '#011140',     // Color de la línea exterior del territorio
                    fillColor: '#011140', // Color del relleno del territorio
                    fillOpacity: 0.15,    // Transparencia
                    weight: 2.5           // Grosor de línea
                  }}
                >
                  <Popup>
                    <div className="p-1 text-center">
                      <p className="text-xs font-bold text-gray-700 m-0">Área de Cobertura Integral</p>
                      <p className="text-[11px] text-gray-500 m-0">{site.nombre}</p>
                    </div>
                  </Popup>
                </Polygon>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;