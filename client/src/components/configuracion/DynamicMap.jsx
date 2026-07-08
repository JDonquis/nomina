import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Icon } from "@iconify/react";

const DIAGNOSTIC_TAG = "[DynamicMap diagnostic v2]";

const FALCON_BOUNDS = {
  north: 12.2, // Límite norte
  south: 10.4, // Límite sur
  east: -68.2, // Límite este
  west: -71.0, // Límite oeste
};

const getAsicColorSource = (asic) => String(+asic?.id ?? asic?.name ?? "ASIC");

const getStableAsicColor = (index, total) => {
  // Proporción áurea para distribución óptima
  const goldenRatio = 0.618033988749895;
  const hue = (index * goldenRatio * 360) % 360;

  // Alternar saturación y luminosidad para más variedad
  const saturation = 65 + (index % 5) * 7;
  const lightness = 35 + (index % 5) * 7;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
// 🎨 Generador de iconos dinámicos por tipo
const getSvgIcon = (type, color) => {
  const markerHtml =
    type === "ASIC"
      ? `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,.35);
        border: 2px solid white;
      ">
        <span style="
          color: white;
          font-weight: 800;
          font-size: 16px;
          line-height: 1;
          transform: rotate(45deg);
          font-family: Arial, sans-serif;
        ">A</span>
      </div>
    `
      : `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `;

  return L.divIcon({
    html: markerHtml,
    className: "custom-svg-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// 🛠️ Helper para limpiar el string "lat, lng"
const parseCoordinates = (coordString) => {
  if (!coordString || typeof coordString !== "string") return null;
  const parts = coordString.split(",");
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  return isNaN(lat) || isNaN(lng) ? null : [lat, lng];
};

// 📐 Algoritmo Convex Hull (Se mantiene igual)
const calculateTerritory = (asicCenter, dependencies) => {
  const points = [];
  if (asicCenter) points.push(asicCenter);
  dependencies?.forEach((dep) => {
    const coords = parseCoordinates(dep.coordinates);
    if (coords) points.push(coords);
  });
  if (points.length < 3) return [];
  points.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  const lower = [];
  for (let i = 0; i < points.length; i++) {
    while (
      lower.length >= 2 &&
      crossProduct(
        lower[lower.length - 2],
        lower[lower.length - 1],
        points[i],
      ) <= 0
    ) {
      lower.pop();
    }
    lower.push(points[i]);
  }
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    while (
      upper.length >= 2 &&
      crossProduct(
        upper[upper.length - 2],
        upper[upper.length - 1],
        points[i],
      ) <= 0
    ) {
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

// 🗺️ 1. COMPONENTE CONTROLADOR DEL MAPA
// Escucha cambios en el selectedAsic externos, vuela hacia allá y abre su popup
const MapController = ({ selectedAsic, markerRefs }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedAsic) return;

    const coords = parseCoordinates(selectedAsic.coordinates);
    if (coords) {
      // Centra el mapa con una animación suave (flyTo) e incrementa el zoom a 14
      map.flyTo(coords, 14, {
        animate: true,
        duration: 1.5, // Duración en segundos
      });

      // Buscamos la referencia de este marcador específico en nuestro diccionario
      const marker = markerRefs.current[selectedAsic.id];
      if (marker) {
        // Le damos un pequeño retraso para que abra el popup justo al terminar de moverse
        setTimeout(() => {
          marker.openPopup();
        }, 1200);
      }
    }
  }, [selectedAsic, map, markerRefs]);

  return null;
};

// COMPONENTE PRINCIPAL MODIFICADO
const MapComponent = ({
  asicsList,
  selectedAsic,
  onSelectAsic,
  handlers,
  totalActiveCensusedInDependency,
  getTotalActiveCensusedInDependency,
  onGetReportActiveCensus,
  onGetPersonnelsReport,
  onGetCargosReport,
}) => {
  const defaultPosition = [11.4045, -69.6775]; // Coro

  // Diccionario para almacenar las referencias físicas de cada marcador ASIC en el mapa
  const markerRefs = useRef({});

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsMenuRef = useRef(null);
  const actionsButtonRef = useRef(null);

  const firstAsicCoords =
    asicsList && asicsList.length > 0
      ? parseCoordinates(asicsList[0].coordinates)
      : null;
  const mapCenter = firstAsicCoords || defaultPosition;

  const closeActionsMenu = () => setIsActionsOpen(false);

  const handleActionClick = (callback) => {
    callback();
    closeActionsMenu();
  };

  return (
    <div className="w-full h-[600px] z-10 rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
        maxBounds={[
          [FALCON_BOUNDS.south, FALCON_BOUNDS.west],
          [FALCON_BOUNDS.north, FALCON_BOUNDS.east],
        ]}
        maxBoundsViscosity={1.0} // Evita que se salga de los límites
        minZoom={8.3} // Evita zoom out excesivo
        maxZoom={18} // Evita zoom in excesivo
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🧭 Controlador dinámico inyectado en el mapa */}
        <MapController selectedAsic={selectedAsic} markerRefs={markerRefs} />

        {asicsList?.map((asic, index) => {
          const asicCoords = parseCoordinates(asic.coordinates);
          const asicColor = getStableAsicColor(index, asicsList.length);
          console.log(asicColor);

          const territorioPoligono = calculateTerritory(
            asicCoords,
            asic.dependencies,
          );

          return (
            <React.Fragment key={asic.id}>
              {/* 1. TERRITORIO */}
              {territorioPoligono.length > 0 && (
                <Polygon
                  positions={territorioPoligono}
                  pathOptions={{
                    color: asicColor,
                    fillColor: asicColor,
                    fillOpacity: 0.1,
                    weight: 2.5,
                    dashArray: "6, 6",
                  }}
                >
                  <Popup>
                    <div className="text-center p-1">
                      <span className="font-bold text-xs text-gray-800 block">
                        Área Geográfica
                      </span>
                      <span className="text-xs text-gray-500">{asic.name}</span>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* 2. MARCADOR DEL ASIC PADRE (CON REFERENCIA AGREGADA) */}
              {asicCoords && (
                <Marker
                  position={asicCoords}
                  icon={getSvgIcon("ASIC", asicColor)}
                  // 🔑 Vinculamos el nodo físico del marcador con nuestro useRef usando su ID único
                  ref={(el) => {
                    if (el) markerRefs.current[asic.id] = el;
                  }}
                  eventHandlers={{
                    click: () => {
                      onSelectAsic(asic.id); // Esto actualizará el selectedAsic en el componente padre, lo que a su vez activará el MapController para volar hacia este marcador y abrir su popup automáticamente.
                    },
                  }}
                >
                  <Popup>
                    <div className="p-1 max-w-[220px] ">
                      <h3 className="font-bold text-sm text-gray-900 m-0 leading-tight">
                        {asic.name}
                      </h3>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-auto text-white"
                        style={{ backgroundColor: asicColor }}
                      >
                        Sede ASIC Principal
                      </span>
                      {/* Corregido: Si usas la prop externa para el conteo, la leemos desde la iteración del mapa */}
                      <p className="text-xs  font-semibold">
                        Censados:{" "}
                        {selectedAsic?.active_censused_count || "cargando..."}
                      </p>
                      <p className="text-xs text-gray-600 m-0 py-0">
                        {asic.address || "Sin dirección registrada"}
                      </p>
                      {asic.url && (
                        <a
                          href={asic.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 text-xs  font-medium py-1.5 px-2.5 rounded transition-colors no-underline mt-2"
                        >
                          <Icon
                            icon="logos:google-maps"
                            className="w-3.5 h-3.5"
                          />
                          Ver Sede en Maps
                        </a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* 3. MARCADORES DE LOS CONSULTORIOS */}
              {asic.dependencies?.map((dep) => {
                const depCoords = parseCoordinates(dep.coordinates);
                if (!depCoords) return null;

                return (
                  <Marker
                    key={dep.id}
                    position={depCoords}
                    icon={getSvgIcon("Dependencia", asicColor)}
                    eventHandlers={{
                      click: () => {
                        getTotalActiveCensusedInDependency(dep.id); // Llamamos a la función para actualizar el conteo de censados activos en esta dependencia
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-1 max-w-[220px]">
                        <div className="flex justify-between gap-1">
                          <h3 className="font-bold text-sm text-gray-900 m-0 leading-tight">
                            {dep.name}
                          </h3>
                          <div className="relative">
                            <button
                              ref={actionsButtonRef}
                              type="button"
                              onClick={() => setIsActionsOpen((prev) => !prev)}
                              className="rounded p-1 hover:bg-gray-100"
                              title="Acciones de reporte"
                            >
                              <Icon
                                icon="mage:dots"
                                className="text-lg text-gray-500"
                              />
                            </button>

                            {isActionsOpen && (
                              <div
                                ref={actionsMenuRef}
                                className="absolute right-0 top-full z-20 mt-2 flex w-48 flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
                              >
                                <button
                                  className="hover:font-bold flex items-center justify-between rounded bg-color2/10 px-2 py-1.5 text-sm text-color2 hover:text-green-500"
                                  title="Cantidad personal activo censado"
                                  onClick={() =>
                                    handleActionClick(() =>
                                      onGetReportActiveCensus(
                                        dep.id,
                                        "Dependencia",
                                        {
                                          asicName: asic.name,
                                          dependencyName: dep.name,
                                        },
                                      ),
                                    )
                                  }
                                >
                                  <span>Censados</span>
                                  <Icon
                                    icon="ci:wavy-check"
                                    className="ml-1 text-gray-500"
                                    width={12}
                                    height={12}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleActionClick(() =>
                                      onGetPersonnelsReport(
                                        dep.id,
                                        "Dependencia",
                                        {
                                          asicName: asic.name,

                                          dependencyName: dep.name,
                                        },
                                      ),
                                    )
                                  }
                                  className="hover:font-bold rounded bg-color1/10 px-2 py-1.5 text-left text-xs text-color1 hover:text-color1/90"
                                >
                                  Tipos de personal
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleActionClick(() =>
                                      onGetCargosReport(dep.id, "Dependencia", {
                                        asicName: asic.name,

                                        dependencyName: dep.name,
                                      }),
                                    )
                                  }
                                  className="hover:font-bold rounded bg-color1/10 px-2 py-1.5 text-left text-xs text-color1 hover:text-color1/90"
                                >
                                  Cargos
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-bold px-1.5 py-1 mt-1 inline-block rounded mr-auto text-white"
                          style={{ backgroundColor: asicColor }}
                        >
                          {asic.name}
                        </span>
                        <p className="text-xs font-semibold">
                          Censados:{" "}
                          {totalActiveCensusedInDependency !== null
                            ? totalActiveCensusedInDependency
                            : "cargando..."}
                        </p>
                        <p className="text-xs text-gray-600 m-0 mt-0">
                          {dep.address || "Sin dirección física"}
                        </p>
                        {dep.url && (
                          <a
                            href={dep.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-xs  font-medium py-1.5 px-2.5 rounded transition-colors no-underline mt-2"
                          >
                            <Icon
                              icon="logos:google-maps"
                              className="w-3.5 h-3.5 z-0"
                            />
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
