import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import DependencyRow from "./DependencyRow";
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

export default function ASICDetailPanel({
  asic,
  formData,
  setFormData,
  handlers,
  isLoading,
  objPosiblesNames,
}) {
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState({
    coordinates: asic?.coordinates || "",
    address: asic?.address || "",
    url: asic?.url || "",
  });

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [asicNameInput, setAsicName] = useState(asic?.name || "");

  useEffect(() => {
    setAsicName(asic?.name || "");
    setLocationData({
      coordinates: asic?.coordinates || "",
      address: asic?.address || "",
      url: asic?.url || "",
    });
  }, [asic]);


  console.log({ asic }); // Debugging line to check the values of asic and formData
  if (!asic) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Icon icon="mdi:database-off" className="text-6xl mb-4" />
          <p className="text-lg">
            Selecciona un ASIC para ver su configuración
          </p>
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
    onGetReportActiveCensus,
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

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    onUpdateAsic({
      ...asic,
      coordinates: locationData.coordinates,
      address: locationData.address,
      url: locationData.url,
    });

    setIsModalOpen(false);
    setLoading(false);
  };



  return (
    <>
      <div className="flex-1 bg-white overflow-y-auto md:p-6 ">
        <div className=" mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Icon icon="mdi:database" className="text-2xl text-color1" />
                <div className="flex-1">
                  <FormField
                    name="asicName"
                    value={ asicNameInput}
                    disableOutline
                    className="!bg-transparent"
                    onChange={(e) => {
                      setAsicName(e.target.value);
                      onUpdateAsic({...asic, name: e.target.value});
                    } }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="bg-color1/90 px-2 mr-2  py-0.5 rounded flex text-white"
                  title="Cantidad personal activo censado"
                  onClick={() =>
                    onGetReportActiveCensus(asicId, "ASIC", { asicName })
                  }
                >
                  {asic.active_censused_count}
                  <Icon
                    icon="ci:wavy-check"
                    className="ml-1 text-white"
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
                    className="text-lg text-color1/10 hover:text-color1"
                  />
                </button>

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
              <button
                className="text-sm bg-gray-100 p-2 rounded "
                title="Crear nueva Dependencia"
                onClick={() => {
                  //focus on the new dependency input
                  const input = document.querySelector(
                    `input[name="${newDepKey}"]`,
                  );
                  if (input) {
                    input.focus();
                  }
                }}
              >
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
              asicName={asicName}
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
              onGetReportActiveCensus={onGetReportActiveCensus}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Úbicación del ASIC"
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
}
