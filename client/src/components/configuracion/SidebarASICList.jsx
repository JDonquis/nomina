import React from "react";
import { Icon } from "@iconify/react";
import { FormField } from "../../components/forms";

export default function SidebarASICList({
  asics,
  selectedAsicId,
  onSelectAsic,
  newAsicName,
  onNewAsicNameChange,
  onCreateAsic,
  isCreating,
  onToggleMap,
  isMapOpen,
  onGetReportActiveCensus,
  onGetCargosReport,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newAsicName.trim()) {
      onCreateAsic();
    }
  };

  return (
    <div className="w-80   bg-white border-r border-gray-200 h-96 md:h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">ASICs</h2>

        <div className="flex">
          <button
            className=" bg-color2/10 px-2 mr-2 items-center py-0.5 rounded flex text-color2 hover:text-green-500"
            title="Cantidad personal activo censado"
            onClick={() =>
              onGetReportActiveCensus(null, "Estado Falcón", {
                asicName: "Estado Falcón",
              })
            }
          >
            <Icon
              icon="ci:wavy-check"
              className="ml-1 text-gray-500"
              width={12}
              height={12}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              onGetCargosReport(null, "Estado Falcón", {asicName: "Estado Falcón"});
            }}
            title="Generar reporte de cargos censados"
            className=" bg-color1/10 px-2 mr-2  py-1.5 text-xs rounded flex text-color1 hover:text-color1/90 hover:"
          >
            Cargos
          </button>

          <button
            onClick={onToggleMap}
            className="text-sm flex items-center gap-2 p-1 hover:bg-slate-200"
          >
            {" "}
            {isMapOpen ? "Ocultar Mapa" : "Ver Mapa"}{" "}
            <Icon icon="mdi:map" />{" "}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {asics?.map((asic, index) => (
          <div
            key={asic.id}
            onClick={() => onSelectAsic(asic.id)}
            className={`p-3 cursor-pointer border-b border-gray-100 transition-colors ${
              selectedAsicId === asic.id
                ? "bg-color1/10 border-l-4 border-l-color1"
                : "hover:bg-gray-50 border-l-4 border-l-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-400">{index + 1}.</div>
              <span
                className={`text-sm font-medium ${
                  selectedAsicId === asic.id ? "text-color1" : "text-gray-700"
                }`}
              >
                {asic.name.replace("ASIC", "")}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <FormField
              name="newAsicName"
              placeholder="Nuevo ASIC..."
              value={newAsicName}
              onChange={(e) => onNewAsicNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disableOutline
              className="!bg-white"
            />
          </div>
          <button
            onClick={onCreateAsic}
            disabled={!newAsicName.trim() || isCreating}
            className={`p-2 rounded-md transition-colors ${
              newAsicName.trim() && !isCreating
                ? "bg-color1 text-white hover:brightness-110"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isCreating ? (
              <Icon icon="line-md:loading-loop" className="animate-spin" />
            ) : (
              <Icon icon="mdi:plus" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
