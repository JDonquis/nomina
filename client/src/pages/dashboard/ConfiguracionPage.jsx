import React, { Suspense, useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ASICAPI,
  dependenciesAPI,
  departmentAPI,
  administrativeUnitsAPI,
  servicesAPI,
} from "../../services/api";

import debounce from "lodash.debounce";
import { produce } from "immer";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal";
import PrintPage from "../../components/configuracion/ReportActiveCensusPerLocation";
import { useFeedback } from "../../context/FeedbackContext";
import {
  SidebarASICList,
  ASICDetailPanel,
} from "../../components/configuracion";
import { SyncSection } from "./SyncPage";
import DynamicMap from "../../components/configuracion/DynamicMap";

// Ejemplo del formato de datos que deberías traer de tu BD
const mockSitiosDesdeBD = [
  {
    id: 1,
    nombre: "Hospital Universitario Alfredo Van Grieken",
    direccion: "Av. El Tenis, Coro, Falcón",
    latitud: "11.4135",
    longitud: "-69.6698",
    google_maps_url: "https://maps.google.com/?q=11.4135,-69.6698",
    type: "Dependencia",
  },
  {
    id: 2,
    nombre: "Consultorio Popular Tipo III La Velita",
    direccion: "Sector La Velita, Coro",
    latitud: "11.3980",
    longitud: "-69.6920",
    google_maps_url: "https://maps.google.com/?q=11.3980,-69.6920",
    type: "Dependencia",
  },
   {
    id: 2,
    nombre: "Consultorio Popular Tipo III La Velita",
    direccion: "Sector La Velita, Coro",
    latitud: "11.3980",
    longitud: "-69.6920",
    google_maps_url: "https://maps.google.com/?q=11.3980,-69.6920",
    type: "Dependencia",
  },
  {
    id: 3,
    nombre: "ASIC Alirio Navarro Aleman",
    direccion: "Sede Principal, Sector La Velita, Coro",
    latitud: "11.3980",
    longitud: "-69.6920",
    google_maps_url: "https://maps.google.com/?q=11.3980,-69.6920",
    type: "ASIC",
    // 🗺️ Coordenadas que dibujan el polígono del territorio del ASIC en el mapa
    territorio: [
      [11.4050, -69.7020], // Esquina Noroeste
      [11.4070, -69.6850], // Esquina Noreste
      [11.3920, -69.6820], // Esquina Sureste
      [11.3900, -69.6990], // Esquina Suroeste
    ]
  },
];
export default function ConfiguracionPage() {
  const { showError, showSuccess } = useFeedback();

  const [activeTab, setActiveTab] = useState("estructura");
  const [asicData, setAsicData] = useState([]);
  const [selectedAsic, setSelectedAsic] = useState(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    asicName: "",
    dependencies: [],
    newDependenceName: "",
  });

  const [newAsicName, setNewAsicName] = useState("");

  const getASIC = useCallback(async () => {
    try {
      const response = await ASICAPI.getASIC();
      setAsicData(response);
    } catch (error) {
      console.error("Error fetching ASIC data:", error);
    }
  }, []);

  const getAsicRelations = async (id) => {
    try {
      const response = await ASICAPI.getASICRelations(id);
      setFormData({
        asicName: response.name,
        asicId: response.id,
        dependencies: response.dependencies || [],
        newDependenceName: "",
      });
      console.log({ response }); // Debugging line to check the response from getASICRelations
      setSelectedAsic(response);
    } catch (error) {
      console.error("Error fetching ASIC relations:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  useEffect(() => {
    getASIC();
  }, [getASIC]);

  const createASIC = async () => {
    if (!newAsicName.trim()) return;

    setIsLoadingForm(true);
    try {
      await ASICAPI.createASIC({ name: newAsicName.trim() });
      showSuccess("ASIC creado exitosamente");
      getASIC();
      setNewAsicName("");
    } catch (error) {
      console.error("Error creating ASIC:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const updateAsic = async (data) => {
    if (!selectedAsic?.id) return;

    try {
      await ASICAPI.updateASIC(selectedAsic.id,  data);
      getASIC();
    } catch (error) {
      console.error("Error updating ASIC:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const deleteAsic = async () => {
    if (!selectedAsic?.id) return;

    try {
      await ASICAPI.deleteASIC(selectedAsic.id);
      showSuccess("ASIC eliminado exitosamente");
      setSelectedAsic(null);
      setFormData({
        asicName: "",
        asicId: null,
        dependencies: [],
        newDependenceName: "",
      });
      getASIC();
    } catch (error) {
      console.error("Error deleting ASIC:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const addNewDependency = async () => {
    const depName = formData.newDependenceName;
    if (!depName || !selectedAsic?.id) return;

    setIsLoadingForm(true);
    const newDependence = {
      name: depName,
      asic_id: selectedAsic.id,
    };

    try {
      const response = await dependenciesAPI.createDependency(newDependence);
      setFormData(
        produce((draft) => {
          draft.dependencies.push({
            ...response,
            administrative_units: [],
          });
          draft.newDependenceName = "";
        }),
      );
    } catch (error) {
      console.error("Error creating dependency:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const deleteDependency = async (id) => {
    if (
      !window.confirm("¿Estás seguro de que deseas eliminar esta dependencia?")
    ) {
      return;
    }

    try {
      await dependenciesAPI.deleteDependency(id);
      setFormData(
        produce((draft) => {
          draft.dependencies = draft.dependencies.filter((d) => d.id !== id);
        }),
      );
    } catch (error) {
      console.error("Error deleting dependency:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const updateDependency = useCallback(
    async (id, updatedData) => {
      try {
        await dependenciesAPI.updateDependency(id, {
          ...updatedData,
          name: updatedData.name,
        });
      } catch (error) {
        console.error("Error updating dependency:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      }
    },
    [showError],
  );

  const debouncedUpdateDependency = useCallback(
    debounce((id, updatedData) => {
      updateDependency(id, updatedData);
    }, 500),
    [updateDependency],
  );

  const objPosiblesNames = {
    Médicos: "Servicios Generales",
    "Servicios Generales": "Electromedicina",
    Electromedicina: "Sala de parto",
    "Sala de parto": "Odontología",
    Odontología: "Laboratorio",
    Laboratorio: "Enfermeras",
    Enfermeras: "Promoción Social",
    "Promoción Social": "Seguridad y Vigilancia",
  };

  const createAdministrativeUnit = async (dependenceId, unitName) => {
    if (!unitName || !dependenceId) return;

    setIsLoadingForm(true);
    const newUnit = {
      name: unitName,
      dependency_id: dependenceId,
    };

    try {
      const response = await administrativeUnitsAPI.createUnit(newUnit);
      setFormData(
        produce((draft) => {
          const dep = draft.dependencies.find((d) => d.id === dependenceId);
          if (dep) {
            dep.administrative_units.push({
              ...response,
              departments: [],
            });
          }
          draft[`newUnitName_${dependenceId}`] =
            objPosiblesNames[unitName] || "";
        }),
      );
      setTimeout(() => {
        document.querySelector(`#newUnitName_${dependenceId}`)?.select();
      }, 150);
    } catch (error) {
      console.error("Error creating administrative unit:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const deleteAdministrativeUnit = async (id) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar esta unidad administrativa?",
      )
    ) {
      return;
    }

    try {
      await administrativeUnitsAPI.deleteUnit(id);
      setFormData(
        produce((draft) => {
          for (const dep of draft.dependencies) {
            dep.administrative_units = dep.administrative_units.filter(
              (u) => u.id !== id,
            );
          }
        }),
      );
    } catch (error) {
      console.error("Error deleting administrative unit:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const updateAdministrativeUnit = useCallback(
    async (id, updatedData) => {
      try {
        await administrativeUnitsAPI.updateUnit(id, {
          ...updatedData,
          name: updatedData.name,
        });
      } catch (error) {
        console.error("Error updating administrative unit:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      }
    },
    [showError],
  );

  const debouncedUpdateUnit = useCallback(
    debounce((id, updatedData) => {
      updateAdministrativeUnit(id, updatedData);
    }, 500),
    [updateAdministrativeUnit],
  );

  const createDepartment = async (unitId, departmentName, repeat) => {
    if (!departmentName || !unitId) return;

    setIsLoadingForm(true);
    const newDepartment = {
      name: departmentName,
      administrative_unit_id: unitId,
    };
    try {
      const response = await departmentAPI.createDepartment(newDepartment);

      if (repeat) {
        try {
          const serviceResponse = await servicesAPI.createService({
            name: departmentName,
            department_id: response.id,
          });

          setFormData(
            produce((draft) => {
              const unit = draft.dependencies
                .flatMap((d) => d.administrative_units)
                .find((u) => u.id === unitId);
              if (unit) {
                unit.departments.push({
                  ...response,
                  services: [serviceResponse],
                });
              }
              draft[`newDepartmentName_${unitId}`] = "";
            }),
          );
        } catch (serviceError) {
          console.error("Error creating service:", serviceError);
          setFormData(
            produce((draft) => {
              const unit = draft.dependencies
                .flatMap((d) => d.administrative_units)
                .find((u) => u.id === unitId);
              if (unit) unit.departments.push(response);
              draft[`newDepartmentName_${unitId}`] = "";
            }),
          );
          const errorMessage =
            serviceError.response?.data?.message ||
            serviceError.message ||
            "Error al crear el servicio";
          showError(errorMessage);
        }
      } else {
        setFormData(
          produce((draft) => {
            const unit = draft.dependencies
              .flatMap((d) => d.administrative_units)
              .find((u) => u.id === unitId);
            if (unit) unit.departments.push(response);
            draft[`newDepartmentName_${unitId}`] = "";
          }),
        );
      }
    } catch (error) {
      console.error("Error creating department:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const updateDepartment = useCallback(
    async (id, updatedData) => {
      try {
        await departmentAPI.updateDepartment(id, {
          ...updatedData,
          name: updatedData.name,
        });
      } catch (error) {
        console.error("Error updating department:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      }
    },
    [showError],
  );

  const debouncedUpdateDepartment = useCallback(
    debounce((id, updatedData) => {
      updateDepartment(id, updatedData);
    }, 500),
    [updateDepartment],
  );

  const deleteDepartment = async (id, unitId) => {
    if (
      !window.confirm("¿Estás seguro de que deseas eliminar este departamento?")
    ) {
      return;
    }

    try {
      await departmentAPI.deleteDepartment(id);
      setFormData(
        produce((draft) => {
          const unit = draft.dependencies
            .flatMap((d) => d.administrative_units)
            .find((u) => u.id === unitId);
          if (unit)
            unit.departments = unit.departments.filter(
              (dept) => dept.id !== id,
            );
        }),
      );
    } catch (error) {
      console.error("Error deleting department:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const createService = async (unitId, departmentId, serviceName) => {
    if (!serviceName || !departmentId) return;

    setIsLoadingForm(true);
    const newService = {
      name: serviceName,
      department_id: departmentId,
    };
    try {
      const response = await servicesAPI.createService(newService);
      setFormData(
        produce((draft) => {
          const dept = draft.dependencies
            .flatMap((d) => d.administrative_units)
            .flatMap((u) => u.departments)
            .find((dep) => dep.id === departmentId);
          if (dept) dept.services.push(response);
          draft[`newServiceName_${departmentId}`] = "";
        }),
      );
    } catch (error) {
      console.error("Error creating service:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const updateService = useCallback(
    async (id, updatedData) => {
      try {
        await servicesAPI.updateService(id, {
          ...updatedData,
          name: updatedData.name,
        });
      } catch (error) {
        console.error("Error updating service:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      }
    },
    [showError],
  );

  const debouncedUpdateService = useCallback(
    debounce((id, updatedData) => {
      updateService(id, updatedData);
    }, 500),
    [updateService],
  );

  const deleteService = async (id, unitId, departmentId) => {
    if (
      !window.confirm("¿Estás seguro de que deseas eliminar este servicio?")
    ) {
      return;
    }

    try {
      await servicesAPI.deleteService(id);
      setFormData(
        produce((draft) => {
          const dept = draft.dependencies
            .flatMap((d) => d.administrative_units)
            .flatMap((u) => u.departments)
            .find((dep) => dep.id === departmentId);
          if (dept) dept.services = dept.services.filter((s) => s.id !== id);
        }),
      );
    } catch (error) {
      console.error("Error deleting service:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const [reportData, setReportData] = useState(null);

  const getReportActiveCensus = async (id, type, dataType) => {
    try {
      let response;
      switch (type) {
        case "ASIC": {
          response = await ASICAPI.getReportActiveCensus(id);
          // <-- Dos puntos corregidos. Se añaden llaves {} por buena práctica al usar const/let dentro de un case
          // Lógica para reporte por ubicación
          break;
        }

        case "Dependencia":
          response = await dependenciesAPI.getReportActiveCensus(id);
          // Tu lógica aquí
          break;

        case "Unidad Administrativa": // <-- Corregido (estaba case:)
          response = await administrativeUnitsAPI.getReportActiveCensus(id);
          // Tu lógica aquí
          break;

        case "Departamento": // <-- Corregido (estaba case:)
          response = await departmentAPI.getReportActiveCensus(id);
          // Tu lógica aquí
          break;
        case "Servicio": // <-- Corregido (estaba case:)
          response = await servicesAPI.getReportActiveCensus(id);
          // Tu lógica aquí

        default:
          break;
      }
      // Aquí puedes manejar la respuesta del reporte, como descargar un archivo o mostrar datos
      console.log("Reporte de censo activo:", response);
      setIsModalOpen(true);
      setReportData({data:response, type, dataType});
    } catch (error) {
      console.error("Error fetching active census report:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };


  console.log({ selectedAsic }); // Debugging line to check the values of selectedAsic and formData

  const handlers = React.useMemo(
    () => ({
      asicId: selectedAsic?.id,
      asicName: formData.asicName,
      onUpdateAsic: updateAsic,
      onDeleteAsic: deleteAsic,
      onAddDependency: addNewDependency,
      onUpdateDependency: debouncedUpdateDependency,
      onDeleteDependency: deleteDependency,
      onCreateUnit: createAdministrativeUnit,
      onUpdateUnit: debouncedUpdateUnit,
      onDeleteUnit: deleteAdministrativeUnit,
      onCreateDepartment: createDepartment,
      onUpdateDepartment: debouncedUpdateDepartment,
      onDeleteDepartment: deleteDepartment,
      onCreateService: createService,
      onUpdateService: debouncedUpdateService,
      onDeleteService: deleteService,
      onGetReportActiveCensus: getReportActiveCensus,
    }),
    [
      selectedAsic?.id,
      formData.asicName,
      updateAsic,
      deleteAsic,
      addNewDependency,
      debouncedUpdateDependency,
      deleteDependency,
      createAdministrativeUnit,
      debouncedUpdateUnit,
      deleteAdministrativeUnit,
      createDepartment,
      debouncedUpdateDepartment,
      deleteDepartment,
      createService,
      debouncedUpdateService,
      deleteService,
      getReportActiveCensus,
    ],
  );

  const [sitios, setSitios] = useState([]);

  useEffect(() => {
    // Aquí harías tu peticion fetch / axios a tu base de datos
    // const data = await censoAPI.get('/sitios');
    setSitios(mockSitiosDesdeBD);
  }, []);

  return (
    <div>

      <div className="p-6  mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Mapa de Cobertura Geográfica</h2>
      
      <DynamicMap locations={sitios} />
    </div>

      <nav className="w-full flex mb-4">
        <button
          onClick={() => setActiveTab("estructura")}
          className={`px-10 py-3 hover:bg-gray-200 ${
            activeTab === "estructura"
              ? "border-b-2 border-color1 font-semibold"
              : ""
          }`}
        >
          Estructura ASIC
        </button>
        <button
          onClick={() => setActiveTab("sincronizacion")}
          className={`px-10 py-3 hover:bg-gray-200 ${
            activeTab === "sincronizacion"
              ? "border-b-2 border-color1 font-semibold"
              : ""
          }`}
        >
          Sincronización
        </button>
      </nav>
      {activeTab === "estructura" ? (
        <>
          <div className="md:flex h-full">
            <SidebarASICList
              asics={asicData}
              selectedAsicId={selectedAsic?.id}
              onSelectAsic={getAsicRelations}
              newAsicName={newAsicName}
              onNewAsicNameChange={setNewAsicName}
              onCreateAsic={createASIC}
              isCreating={isLoadingForm}
            />
            <ASICDetailPanel
              asic={selectedAsic}
              objPosiblesNames={objPosiblesNames}
              formData={formData}
              setFormData={setFormData}
              handlers={handlers}
              isLoading={isLoadingForm}
            />
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              // Opcional: también limpiar localStorage aquí si quieres
            }}
            title={"ueje"}
            size="xl"
          >
            <PrintPage data={reportData} />
          </Modal>
        </>
      ) : (
        <SyncSection />
      )}
    </div>
  );
}
