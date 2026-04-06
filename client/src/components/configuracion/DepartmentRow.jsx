import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { FormField } from "../../components/forms";
import ServiceRow from "./ServiceRow";

export default function DepartmentRow({
  department,
  index,
  unitId,
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
  const newServiceKey = `newServiceName_${department.id}`;
  const newServiceName = formData[newServiceKey] || "";

  const handleCreateService = () => {
    if (newServiceName.trim()) {
      onCreateService(unitId, department.id, newServiceName);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newServiceName.trim()) {
      e.preventDefault();
      handleCreateService();
    }
  };

  const handleNewServiceChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [newServiceKey]: e.target.value,
    }));
  };

  const handleOnFocus = (e) => {
    if (department.services?.length === 0) {
      setFormData((prev) => ({
        ...prev,
        [newServiceKey]: department.name,
      }));
    }
    setTimeout(() => {
      e.target.select();
    }, 100);
  };

  return (
    <div className="ml-6 border-l-2 border-gray-200  my-1">
      <div className="flex bg-color4/45 items-center gap-1 group">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3 flex gap-1 hover:bg-color4/20 rounded"
        >
          <Icon
            icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
            className="text-gray-500"
          />
          <span className="text-xs text-gray-400">{index + 1}.</span>
        </button>
        
        
        <div className="flex-1">
          <FormField
            name={`departmentName_${department.id}`}
            value={department.name}
            disableOutline
            className="!bg-transparent"
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData((prev) => {
                const updated = { ...prev };
                for (const dep of updated.dependencies || []) {
                  for (const unit of dep.administrative_units || []) {
                    const deptIndex = unit.departments?.findIndex((d) => d.id === department.id);
                    if (deptIndex !== -1) {
                      updated.dependencies = [...updated.dependencies];
                      const depIndex = updated.dependencies.findIndex((d) => d.id === dep.id);
                      if (depIndex !== -1) {
                        updated.dependencies[depIndex] = { ...updated.dependencies[depIndex], administrative_units: [...(updated.dependencies[depIndex].administrative_units || [])] };
                        const unitIndex = updated.dependencies[depIndex].administrative_units.findIndex((u) => u.id === unit.id);
                        if (unitIndex !== -1) {
                          updated.dependencies[depIndex].administrative_units[unitIndex] = { ...updated.dependencies[depIndex].administrative_units[unitIndex], departments: [...(updated.dependencies[depIndex].administrative_units[unitIndex].departments || [])] };
                          const dIndex = updated.dependencies[depIndex].administrative_units[unitIndex].departments.findIndex((d) => d.id === department.id);
                          if (dIndex !== -1) {
                            updated.dependencies[depIndex].administrative_units[unitIndex].departments[dIndex] = {
                              ...updated.dependencies[depIndex].administrative_units[unitIndex].departments[dIndex],
                              name: newValue
                            };
                          }
                        }
                      }
                      break;
                    }
                  }
                }
                return updated;
              });
              onUpdateDepartment(department.id, {
                name: newValue,
                administrative_unit_id: unitId,
              });
            }}
          />
        </div>
        
        <button
          type="button"
          onClick={() => onDeleteDepartment(department.id, unitId)}
          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
          title="Eliminar departamento"
        >
          <Icon icon="material-symbols:close-rounded" className="text-sm" />
        </button>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-1">
          {department.services?.map((service, sIndex) => (
            <ServiceRow
              key={service.id}
              service={service}
              index={sIndex}
              onUpdateService={onUpdateService}
              onDeleteService={(serviceId) => onDeleteService(serviceId, unitId, department.id)}
              setFormData={setFormData}
            />
          ))}
          
          <div className="flex items-center gap-2 ml-10 mt-2 group/service">
            <span className="text-xs text-gray-400 w-5">
              {department.services?.length + 1 || 1}.
            </span>
            <div className="flex-1">
              <FormField
                name={newServiceKey}
                placeholder="Nuevo servicio..."
                value={newServiceName}
                onChange={handleNewServiceChange}
                onKeyDown={handleKeyDown}
                onFocus={handleOnFocus}
                disableOutline
                className="!bg-transparent"
              />
            </div>
            {newServiceName.trim() && (
              <button
                type="button"
                onClick={handleCreateService}
                disabled={isLoading}
                className="p-1 text-color1 hover:bg-color1/10 rounded"
                title="Agregar servicio"
              >
                <Icon icon="mdi:plus" className="text-sm" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}