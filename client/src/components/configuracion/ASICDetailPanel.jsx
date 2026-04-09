import React from "react";
import { Icon } from "@iconify/react";
import { FormField } from "../../components/forms";
import DependencyRow from "./DependencyRow";

export default function ASICDetailPanel({
  asic,
  formData,
  setFormData,
  handlers,
  isLoading,
  objPosiblesNames,
}) {
  if (!asic) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Icon icon="mdi:database-off" className="text-6xl mb-4" />
          <p className="text-lg">Selecciona un ASIC para ver su configuración</p>
        </div>
      </div>
    );
  }

  const {
    asicId,
    asicName,
    onUpdateAsic,
    onDeleteAsic,
    onAddDependency,
    onUpdateDependency,
    onDeleteDependency,
    onCreateUnit,
    onUpdateUnit,
    onDeleteUnit,
    onCreateDepartment,
    onUpdateDepartment,
    onDeleteDepartment,
    onCreateService,
    onUpdateService,
    onDeleteService,

  } = handlers;

  const handleUpdateDependency = (id, data) => {
    onUpdateDependency(id, { ...data, asic_id: asicId });
  };

  const handleUpdateUnit = (id, data) => {
    onUpdateUnit(id, data);
  };

  const handleUpdateDepartment = (id, data) => {
    onUpdateDepartment(id, data);
  };

  const handleUpdateService = (id, data) => {
    onUpdateService(id, data);
  };

  const newDepKey = "newDependenceName";
  const newDepName = formData[newDepKey] || "";

  const handleCreateDependency = () => {
    if (newDepName.trim()) {
      onAddDependency();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newDepName.trim()) {
      e.preventDefault();
      handleCreateDependency();
    }
  };

  const handleNewDepChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [newDepKey]: e.target.value,
    }));
  };


  return (
    <div className="flex-1 bg-white overflow-y-auto md:p-6 ">
      <div className=" mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Icon icon="mdi:database" className="text-2xl text-color1" />
              <div className="flex-1">
                <FormField
                  name="asicName"
                  value={asicName}
                  disableOutline
                  className="!bg-transparent"
                  onChange={(e) => onUpdateAsic(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {formData.dependencies?.length || 0} dependencias 
              </span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("¿Eliminar este ASIC?")) {
                    onDeleteAsic();
                  }
                }}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Eliminar ASIC"
              >
                <Icon icon="mdi:delete-outline" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 overflow-y-auto ">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Icon icon="mdi:folder-outline" />
            Dependencias
            <button className="text-sm bg-gray-100 p-2 rounded "
            title="Crear nueva Dependencia"
            onClick={() => {
              //focus on the new dependency input
              const input = document.querySelector(`input[name="${newDepKey}"]`);
              if (input) {
                input.focus();
              }
            }}>
              <Icon icon="mdi:plus" className="text-color1" />
            </button>
          </h3>
        </div>

        {formData.dependencies?.map((dep, index) => (
          <DependencyRow
            key={dep.id}
            dependency={dep}
            index={index}
            asicId={asicId}
            onUpdateDependency={handleUpdateDependency}
            onDeleteDependency={onDeleteDependency}
            onCreateUnit={onCreateUnit}
            onUpdateUnit={handleUpdateUnit}
            onDeleteUnit={onDeleteUnit}
            onCreateDepartment={onCreateDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onDeleteDepartment={onDeleteDepartment}
            onCreateService={onCreateService}
            onUpdateService={handleUpdateService}
            onDeleteService={handlers.onDeleteService}
            formData={formData}
            setFormData={setFormData}
            isLoading={isLoading}
            objPosiblesNames={objPosiblesNames}
          />
        ))}

        <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 group">
          <span className="text-sm text-gray-400 font-medium">
            {formData.dependencies?.length + 1 || 1}.
          </span>
          <div className="flex-1">
            <FormField
              name={newDepKey}
              placeholder="Nueva dependencia..."
              value={newDepName}
              onChange={handleNewDepChange}
              onKeyDown={handleKeyDown}
              disableOutline
              className="!bg-transparent"
            />
          </div>
          {newDepName.trim() && (
            <button
              type="button"
              onClick={handleCreateDependency}
              disabled={isLoading}
              className="p-2 text-color1 hover:bg-color1/10 rounded"
              title="Agregar dependencia"
            >
              <Icon icon="mdi:plus" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}