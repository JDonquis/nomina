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
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newAsicName.trim()) {
      onCreateAsic();
    }
  };

  return (
    <div className="w-72   bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">ASICs</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {asics?.map((asic) => (
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
              <Icon
                icon="mdi:database"
                className={`text-lg ${
                  selectedAsicId === asic.id ? "text-color1" : "text-gray-400"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  selectedAsicId === asic.id ? "text-color1" : "text-gray-700"
                }`}
              >
                {asic.name}
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