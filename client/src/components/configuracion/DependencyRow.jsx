import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { FormField } from "../../components/forms";
import UnitRow from "./UnitRow";
import debounce from "lodash.debounce";

const DependencyRow = React.memo(function DependencyRow({
  dependency,
  index,
  asicId,
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
  formData,
  setFormData,
  isLoading,
  objPosiblesNames,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localName, setLocalName] = useState(dependency.name);
  const newUnitKey = `newUnitName_${dependency.id}`;
  const newUnitName = formData[newUnitKey] || "";

  useEffect(() => {
    setLocalName(dependency.name);
  }, [dependency.name]);

  const debouncedSetFormData = useCallback(
    debounce((newValue) => {
      setFormData((prev) => {
        const updated = { ...prev };
        const depIndex = updated.dependencies?.findIndex(
          (d) => d.id === dependency.id,
        );
        if (depIndex !== -1 && updated.dependencies) {
          updated.dependencies = [...updated.dependencies];
          updated.dependencies[depIndex] = {
            ...updated.dependencies[depIndex],
            name: newValue,
          };
        }
        return updated;
      });
    }, 500),
    [dependency.id, setFormData],
  );

  const handleCreateUnit = () => {
    if (newUnitName.trim()) {
      onCreateUnit(dependency.id, newUnitName);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newUnitName.trim()) {
      e.preventDefault();
      handleCreateUnit();
    }
  };

  const handleNewUnitChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [newUnitKey]: e.target.value,
    }));
  };

  const handleNameChange = (e) => {
    const newValue = e.target.value;
    setLocalName(newValue);
    debouncedSetFormData(newValue);
    onUpdateDependency(dependency.id, {
      name: newValue,
      asic_id: asicId,
    });
  };

  const handleOnFocus = (e) => {
      setFormData((prev) => ({
        ...prev,
        [newUnitKey]: objPosiblesNames[dependency.administrative_units[dependency.administrative_units.length - 1]?.name] || "",
      }));
    setTimeout(() => {
      e.target.select();
    }, 100);
  };

  return (
    <div className="bg-color2/10  rounded-lg mb-3 overflow-hidden">
      <div className="flex sticky top-0 z-10 bg-color2/10 items-center gap-0 pr-3 pl-0 group">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:p-3  flex gap-1  hover:bg-color2/10 text-color2 rounded"
        >
          <Icon
            icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
            className=""
          />

          <span className="text-sm  font-medium">{index + 1}.</span>
        </button>

        <div className="flex-1 ">
          <FormField
            name={`dependenceName_${dependency.id}`}
            value={localName}
            disableOutline
            onChange={handleNameChange}
          />
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
          <span className="bg-gray-200 px-2 mr-2 py-0.5 rounded">
            {dependency.administrative_units?.length || 0} unid.
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDeleteDependency(dependency.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
          title="Eliminar dependencia"
        >
          <Icon icon="material-symbols:close-rounded" className="text-sm" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 bg-white">
          {dependency.administrative_units?.map((unit, uIndex) => (
            <UnitRow
              key={unit.id}
              unit={unit}
              index={uIndex}
              dependencyId={dependency.id}
              onUpdateUnit={onUpdateUnit}
              onDeleteUnit={onDeleteUnit}
              onCreateDepartment={onCreateDepartment}
              onUpdateDepartment={onUpdateDepartment}
              onDeleteDepartment={onDeleteDepartment}
              onCreateService={onCreateService}
              onUpdateService={onUpdateService}
              onDeleteService={onDeleteService}
              formData={formData}
              setFormData={setFormData}
              isLoading={isLoading}
            />
          ))}

          <div className="flex ml-3 md:ml-14   items-center  mt-3  border-t border-gray-100 group/unit">
            <span className="text-sm text-gray-400 w-6">
              {dependency.administrative_units?.length + 1 || 1}.
            </span>
            <div className="flex-1">
              <FormField
                name={newUnitKey}
                placeholder="Nueva unidad administrativa..."
                value={newUnitName}
                onChange={handleNewUnitChange}
                onKeyDown={handleKeyDown}
                onFocus={handleOnFocus}
                id={`newUnitName_${dependency.id}`}
                disableOutline
                className="!bg-transparent"
              />
            </div>
            {newUnitName.trim() && (
              <button
                type="button"
                onClick={handleCreateUnit}
                disabled={isLoading}
                className="p-1 text-color1 hover:bg-color1/10 rounded"
                title="Agregar unidad administrativa"
              >
                <Icon icon="mdi:plus" className="text-sm" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default DependencyRow;
