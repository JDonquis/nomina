import React, { useEffect, useRef, useState } from "react";
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
  onGetPersonnelsReport,
}) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsMenuRef = useRef(null);
  const actionsButtonRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newAsicName.trim()) {
      onCreateAsic();
    }
  };

  const closeActionsMenu = () => setIsActionsOpen(false);

  const handleActionClick = (callback) => {
    callback();
    closeActionsMenu();
  };

  useEffect(() => {
    if (!isActionsOpen) return;

    const handleClickOutside = (event) => {
      const isOutsideMenu =
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(event.target);
      const isOutsideButton =
        actionsButtonRef.current &&
        !actionsButtonRef.current.contains(event.target);

      if (isOutsideMenu && isOutsideButton) {
        closeActionsMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActionsOpen]);

  return (
    <div className="w-80   bg-white border-r border-gray-200 h-96 md:h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">ASICs</h2>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              ref={actionsButtonRef}
              type="button"
              onClick={() => setIsActionsOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isActionsOpen}
              className="p-1 hover:bg-gray-100"
            >
              <Icon
                icon="mage:dots"
                className="ml-1 text-gray-500"
                width={20}
                height={20}
              />
            </button>

            {isActionsOpen && (
              <div
                ref={actionsMenuRef}
                className="absolute right-0 top-full z-10 mt-2 flex w-48 flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
              >
                <button
                  className="flex items-center justify-between rounded bg-color2/10 px-2 py-1.5 text-sm text-color2 hover:text-green-500"
                  title="Cantidad personal activo censado"
                  onClick={() =>
                    handleActionClick(() =>
                      onGetReportActiveCensus(null, "Estado Falcón", {
                        asicName: "Estado Falcón",
                      })
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
                      onGetPersonnelsReport(null, "Estado Falcón", {
                        asicName: "Estado Falcón",
                      })
                    )
                  }
                  title="Generar reporte de cargos censados"
                  className="rounded bg-color1/10 px-2 py-1.5 text-left text-xs text-color1 hover:text-color1/90"
                >
                  Tipos de personal
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleActionClick(() =>
                      onGetCargosReport(null, "Estado Falcón", {
                        asicName: "Estado Falcón",
                      })
                    )
                  }
                  title="Generar reporte de cargos censados"
                  className="rounded bg-color1/10 px-2 py-1.5 text-left text-xs text-color1 hover:text-color1/90"
                >
                  Cargos
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onToggleMap}
            className="flex items-center gap-2 p-1 text-sm hover:bg-slate-200"
          >
            {isMapOpen ? "Ocultar Mapa" : "Ver Mapa"}
            <Icon icon="mdi:map" />
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
