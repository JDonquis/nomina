import React, { Suspense, useEffect, useCallback, useState } from "react";
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



import { useFeedback } from "../../context/FeedbackContext";
import { FormField } from "../../components/forms";
import {
  SidebarASICList,
  ASICDetailPanel,
} from "../../components/configuracion";

export default function ConfiguracionPage() {
  const { showError, showSuccess } = useFeedback();

  const [asicData, setAsicData] = useState([]);
  const [selectedAsicId, setSelectedAsicId] = useState(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

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
      setSelectedAsicId(id);
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

  const updateAsic = async (name) => {
    if (!selectedAsicId || !name.trim()) return;

    try {
      await ASICAPI.updateASIC(selectedAsicId, { name: name });
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
    if (!selectedAsicId) return;

    try {
      await ASICAPI.deleteASIC(selectedAsicId);
      showSuccess("ASIC eliminado exitosamente");
      setSelectedAsicId(null);
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
    if (!depName || !selectedAsicId) return;

    setIsLoadingForm(true);
    const newDependence = {
      name: depName,
      asic_id: selectedAsicId,
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
        await dependenciesAPI.updateDependency(id, { ...updatedData, name: updatedData.name });
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
          draft[`newUnitName_${dependenceId}`] = "";
        }),
      );
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
        await administrativeUnitsAPI.updateUnit(id, { ...updatedData, name: updatedData.name});
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
        await departmentAPI.updateDepartment(id, { ...updatedData, name: updatedData.name });
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
        await servicesAPI.updateService(id, { ...updatedData, name: updatedData.name });
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

  const selectedAsic = asicData.find((a) => a.id === selectedAsicId);

  const handlers = React.useMemo(() => ({
    asicId: selectedAsicId,
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
  }), [
    selectedAsicId,
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
  ]);

  return (
    <div className="md:flex h-full">
      <SidebarASICList
        asics={asicData}
        selectedAsicId={selectedAsicId}
        onSelectAsic={getAsicRelations}
        newAsicName={newAsicName}
        onNewAsicNameChange={setNewAsicName}
        onCreateAsic={createASIC}
        isCreating={isLoadingForm}
      />
      <ASICDetailPanel
        asic={selectedAsic}
        formData={formData}
        setFormData={setFormData}
        handlers={handlers}
        isLoading={isLoadingForm}
      />
    </div>
  );
}