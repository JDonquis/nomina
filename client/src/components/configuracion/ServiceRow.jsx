import React from "react";
import { Icon } from "@iconify/react";
import { FormField } from "../../components/forms";

export default function ServiceRow({
  service,
  index,
  onUpdateService,
  onDeleteService,
  setFormData,
}) {
  return (
    <div className="flex ml-6 bg-purple-100/60 items-center gap-2 py-1 pl-4 group hover:bg-purple-200/60 rounded">
      <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
      <div className="flex-1">
        <FormField
          name={`serviceName_${service.id}`}
          value={service.name}
          disableOutline
          className="!bg-transparent"
          onChange={(e) => {
            const newValue = e.target.value;
            setFormData((prev) => {
              const updated = { ...prev };
              for (const dep of updated.dependencies || []) {
                for (const unit of dep.administrative_units || []) {
                  for (const dept of unit.departments || []) {
                    const svcIndex = dept.services?.findIndex((s) => s.id === service.id);
                    if (svcIndex !== -1) {
                      updated.dependencies = [...updated.dependencies];
                      const depIndex = updated.dependencies.findIndex((d) => d.id === dep.id);
                      if (depIndex !== -1) {
                        updated.dependencies[depIndex] = { ...updated.dependencies[depIndex], administrative_units: [...(updated.dependencies[depIndex].administrative_units || [])] };
                        const unitIndex = updated.dependencies[depIndex].administrative_units.findIndex((u) => u.id === unit.id);
                        if (unitIndex !== -1) {
                          updated.dependencies[depIndex].administrative_units[unitIndex] = { ...updated.dependencies[depIndex].administrative_units[unitIndex], departments: [...(updated.dependencies[depIndex].administrative_units[unitIndex].departments || [])] };
                          const deptIndex = updated.dependencies[depIndex].administrative_units[unitIndex].departments.findIndex((d) => d.id === dept.id);
                          if (deptIndex !== -1) {
                            updated.dependencies[depIndex].administrative_units[unitIndex].departments[deptIndex] = { ...updated.dependencies[depIndex].administrative_units[unitIndex].departments[deptIndex], services: [...(updated.dependencies[depIndex].administrative_units[unitIndex].departments[deptIndex].services || [])] };
                            const sIndex = updated.dependencies[depIndex].administrative_units[unitIndex].departments[deptIndex].services.findIndex((s) => s.id === service.id);
                            if (sIndex !== -1) {
                              updated.dependencies[depIndex].administrative_units[unitIndex].departments[deptIndex].services[sIndex] = {
                                ...updated.dependencies[depIndex].administrative_units[unitIndex].departments[deptIndex].services[sIndex],
                                name: newValue
                              };
                            }
                          }
                        }
                      }
                      break;
                    }
                  }
                }
              }
              return updated;
            });
            onUpdateService(service.id, { name: newValue, department_id: service.department_id });
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => onDeleteService(service.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
        title="Eliminar servicio"
      >
        <Icon icon="material-symbols:close-rounded" className="text-sm" />
      </button>
    </div>
  );
}