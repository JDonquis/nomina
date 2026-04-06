import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { FormField } from "../../components/forms";
import DepartmentRow from "./DepartmentRow";

export default function UnitRow({
  unit,
  index,
  dependencyId,
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
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const newDeptKey = `newDepartmentName_${unit.id}`;
  const newDeptName = formData[newDeptKey] || "";

  const handleCreateDepartment = () => {
    if (newDeptName.trim()) {
      onCreateDepartment(unit.id, newDeptName, newDeptName === unit.name);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newDeptName.trim()) {
      e.preventDefault();
      handleCreateDepartment();
    }
  };

  const handleNewDeptChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [newDeptKey]: e.target.value,
    }));
  };

  const handleOnFocus = (e) => {
    if (unit.departments?.length === 0) {
      setFormData((prev) => ({
        ...prev,
        [newDeptKey]: unit.name,
      }));
    }
    setTimeout(() => {
      e.target.select()
      
    }, 100);
  };

  return (
    <div className="md:ml-6  border-l-2 border-gray-300  my-2">
      <div className="flex bg-color3/15 rounded items-center  group">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className=" md:p-3 flex gap-1 hover:bg-color3/20 rounded"
        >
          <Icon
            icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
            className={`${isExpanded ? 'text-color1 font-bold' : 'text-gray-500'}`}
          />
        <span className="text-xs text-gray-400">{index + 1}.</span>
        </button>
        
        
        <div className="flex-1 ">
          <FormField
            name={`unitName_${unit.id}`}
            value={unit.name}
            disableOutline
            className="!bg-transparent"
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData((prev) => {
                const updated = { ...prev };
                for (const dep of updated.dependencies || []) {
                  const unitIndex = dep.administrative_units?.findIndex((u) => u.id === unit.id);
                  if (unitIndex !== -1) {
                    updated.dependencies = [...updated.dependencies];
                    const depIndex = updated.dependencies.findIndex((d) => d.id === dep.id);
                    if (depIndex !== -1) {
                      updated.dependencies[depIndex] = { ...updated.dependencies[depIndex] };
                      updated.dependencies[depIndex].administrative_units = [...(updated.dependencies[depIndex].administrative_units || [])];
                      updated.dependencies[depIndex].administrative_units[unitIndex] = {
                        ...updated.dependencies[depIndex].administrative_units[unitIndex],
                        name: newValue
                      };
                    }
                    break;
                  }
                }
                return updated;
              });
              onUpdateUnit(unit.id, {
                name: newValue,
                dependency_id: dependencyId,
              });
            }}
          />
        </div>
        
        <button
          type="button"
          onClick={() => onDeleteUnit(unit.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
          title="Eliminar unidad administrativa"
        >
          <Icon icon="material-symbols:close-rounded" className="text-sm" />
        </button>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-1">
          {unit.departments?.map((dept, dIndex) => (
            <DepartmentRow
              key={dept.id}
              department={dept}
              index={dIndex}
              unitId={unit.id}
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
          
          <div className="flex md:ml-12 items-center  mt-2 group/dept">
            <span className="text-xs text-gray-400 w-5">
              {unit.departments?.length + 1 || 1}.
            </span>
            <div className="flex-1">
              <FormField
                name={newDeptKey}
                placeholder="Nuevo departamento..."
                value={newDeptName}
                onChange={handleNewDeptChange}
                onKeyDown={handleKeyDown}
                onFocus={handleOnFocus}
                disableOutline
                className="!bg-transparent"
              />
            </div>
            {newDeptName.trim() && (
              <button
                type="button"
                onClick={handleCreateDepartment}
                disabled={isLoading}
                className="p-1 px-4 text-color1 hover:bg-color1/10 rounded"
                title="Agregar departamento"
              >
                <Icon icon="mdi:plus" className="text-md font-bold" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}