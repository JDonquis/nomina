import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Icon } from '@iconify/react';

// 🎨 Generador de iconos SVG dinámicos por tipo (ASIC o Consultorio)
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

// 🛠️ Helper para limpiar el string "lat, lng" de tu BD
const parseCoordinates = (coordString) => {
  if (!coordString || typeof coordString !== 'string') return null;
  const parts = coordString.split(',');
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  
  return isNaN(lat) || isNaN(lng) ? null : [lat, lng];
};

// 📐 Algoritmo para calcular el territorio perimetral por cada ASIC (Convex Hull)
const calculateTerritory = (asicCenter, dependencies) => {
  const points = [];
  if (asicCenter) points.push(asicCenter);
  
  dependencies?.forEach(dep => {
    const coords = parseCoordinates(dep.coordinates);
    if (coords) points.push(coords);
  });

  if (points.length < 3) return [];

  points.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);

  const lower = [];
  for (let i = 0; i < points.length; i++) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
      lower.pop();
    }
    lower.push(points[i]);
  }

  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
      upper.pop();
    }
    upper.push(points[i]);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
};

const crossProduct = (a, b, c) => {
  return (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
};

// Componente principal preparado para recibir un arreglo de ASICs
const MapComponent = ({ asicsList }) => {
  const defaultPosition = [11.4045, -69.6775]; // Coro por defecto
  
  // Tomamos el centro del primer ASIC de la lista para enfocar el mapa al cargar
  const firstAsicCoords = asicsList && asicsList.length > 0 ? parseCoordinates(asicsList[0].coordinates) : null;
  const mapCenter = firstAsicCoords || defaultPosition;

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
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

        {/* Iteramos sobre cada uno de los ASICs que vienen en el listado */}
        {asicsList?.map((asic) => {
          const asicCoords = parseCoordinates(asic.coordinates);
          
          // Calculamos el territorio exclusivo para este ASIC usando sus propias dependencias
          const territorioPoligono = calculateTerritory(asicCoords, asic.dependencies);

          return (
            <React.Fragment key={asic.id}>
              
              {/* 1. DIBUJAR EL TERRITORIO DEL ASIC ACTUAL */}
              {territorioPoligono.length > 0 && (
                <Polygon
                  positions={territorioPoligono}
                  pathOptions={{
                    color: '#011140',
                    fillColor: '#011140',
                    fillOpacity: 0.10, // Un poco más claro para no saturar si se cruzan
                    weight: 2.5,
                    dashArray: '6, 6'
                  }}
                >
                  <Popup>
                    <div className="text-center p-1">
                      <span className="font-bold text-xs text-gray-800 block">Área Geográfica</span>
                      <span className="text-xs text-gray-500">{asic.name}</span>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* 2. MARCADOR DEL ASIC PADRE */}
              {asicCoords && (
                <Marker position={asicCoords} icon={getSvgIcon("ASIC")}>
                  <Popup>
                    <div className="p-1 max-w-[220px] flex flex-col gap-1">
                      <h3 className="font-bold text-sm text-gray-900 m-0 leading-tight">{asic.name}</h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-auto text-white bg-[#011140]">
                        Sede ASIC Principal
                      </span>
                      <p className="text-xs text-gray-600 m-0 mt-1">{asic.address || "Sin dirección registrada"}</p>
                      {asic.url && (
                        <a 
                          href={asic.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 text-xs text-white font-medium py-1.5 px-2.5 rounded transition-colors no-underline mt-2 "
                        >
                          <Icon icon="logos:google-maps" className="w-3.5 h-3.5" />
                          Ver Sede en Maps
                        </a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* 3. MARCADORES DE LOS CONSULTORIOS DE ESTE ASIC */}
              {asic.dependencies?.map((dep) => {
                const depCoords = parseCoordinates(dep.coordinates);
                if (!depCoords) return null;

                return (
                  <Marker 
                    key={dep.id} 
                    position={depCoords} 
                    icon={getSvgIcon("Dependencia")}
                  >
                    <Popup>
                      <div className="p-1 max-w-[200px] flex flex-col gap-1">
                        <h3 className="font-bold text-sm text-gray-900 m-0 leading-tight">{dep.name}</h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-auto text-white bg-[#397373]">
                          {asic.name} (Hijo)
                        </span>
                        <p className="text-xs text-gray-600 m-0 mt-1">{dep.address || "Sin dirección física"}</p>
                        
                        {dep.url && (
                          <a 
                            href={dep.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-xs text-white font-medium py-1.5 px-2.5 rounded transition-colors no-underline mt-2 bg-[#397373] hover:bg-[#397373]/90"
                          >
                            <Icon icon="logos:google-maps" className="w-3.5 h-3.5" />
                            Ir a Google Maps
                          </a>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;