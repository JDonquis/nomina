import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import UnitRow from "./UnitRow";
import debounce from "lodash.debounce";
import Modal from "../Modal";
import FormField from "../forms/FormField.jsx";

const fields = [
  {
    name: "coordinates",
    label: "Coordenadas (latitud,longitud)",
    type: "coordenadas",
    placeholder: "Ej: 10.1234,-66.5678",
    required: true,
    fullWidth: true,
  },
  {
    name: "address",
    label: "Dirección",
    type: "text",
    required: false,
    fullWidth: true,
  },
  {
    name: "url",
    label: "URL",
    type: "url",
    required: false,
    fullWidth: true,
  },
];

const DependencyRow = React.memo(function DependencyRow({
  dependency,
  index,
  asicId,
  asicName,
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
  onGetReportActiveCensus,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localName, setLocalName] = useState(dependency.name);
  const newUnitKey = `newUnitName_${dependency.id}`;
  const newUnitName = formData[newUnitKey] || "";
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState({
    coordinates: dependency.coordinates || "",
    address: dependency.address || "",
    url: dependency.url || "",
  });

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    setLocalName(dependency.name);
    setLocationData({
      coordinates: dependency.coordinates || "",
      address: dependency.address || "",
      url: dependency.url || "",
    });
  }, [dependency]);

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

  const handleLocationSubmit = (e) => {
    e.preventDefault();

    setLoading(true);
    onUpdateDependency(dependency.id, {
      name: localName,
      address: locationData.address,
      url: locationData.url,
      coordinates: locationData.coordinates,
      asic_id: asicId,
    });
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleOnFocus = (e) => {
    setFormData((prev) => ({
      ...prev,
      [newUnitKey]:
        objPosiblesNames[
          dependency.administrative_units[
            dependency.administrative_units.length - 1
          ]?.name
        ] || "",
    }));
    setTimeout(() => {
      e.target.select();
    }, 100);
  };

  return (
    <>
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

          <div className="hidden md:flex items-center gap-1 mr-3 text-xs text-gray-500">
            <button
              className=" bg-color2/10 px-2 mr-2  py-0.5 rounded flex text-color2"
              title="Cantidad personal activo censado"
              onClick={() =>
                onGetReportActiveCensus(dependency.id, "Dependencia", { asicName, dependencyName: dependency.name })
              }
            >
              {dependency.active_censused_count}
              <Icon
                icon="ci:wavy-check"
                className="ml-1 text-gray-500"
                width={12}
                height={12}
              />
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              title="Ver ubicación"
            >
              <Icon
                icon="mdi:location"
                className="text-lg text-black/10 hover:text-color2"
              />
            </button>
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
                asicName={asicName}
                dependencyName={dependency.name}
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
                onGetReportActiveCensus={onGetReportActiveCensus}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Úbicación"
      >
        <form id="locationForm" onSubmit={handleLocationSubmit}>
          <div className="space-y-3">
            {fields.map((field) => (
              <FormField
                key={field.name}
                {...field}
                value={locationData[field.name]}
                onChange={handleLocationChange}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`px-12 py-3 rounded-md font-semibold bg-color1 text-white w-full mt-5 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            } `}
          >
            {loading ? <CircularProgress size={20} /> : "Guardar"}
          </button>
        </form>
      </Modal>
    </>
  );
});

export default DependencyRow;
