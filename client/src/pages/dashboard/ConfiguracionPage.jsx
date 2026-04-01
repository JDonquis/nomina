// un ASIC puede tener varios dependencias físicas
// Una dependencia física puede tener varias unidades adminitrativas
import React, { Suspense, useEffect, useCallback, useState } from "react";
import {
  ASICAPI,
  dependenciesAPI,
  departmentAPI,
  administrativeUnitsAPI,
  servicesAPI,
} from "../../services/api";
import FuturisticButton from "../../components/FuturisticButton";
import { Modal } from "@mui/material";
import { Icon } from "@iconify/react";

import { useFeedback } from "../../context/FeedbackContext";
import { FormField } from "../../components/forms";

export default function ConfiguracionPage() {
  const { showError, showSuccess, showInfo } = useFeedback();

  const [asicData, setAsicData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [createAsicName, setCreateAsicName] = useState("");
  const [formData, setFormData] = useState({
    newDependenceName: null,
    newUnitName: null,
    asic_id: "",
    name: "",
    dependences: [],
    administrative_units: [],
    departments: [],
    services: [],
  });

  const getASIC = useCallback(async () => {
    try {
      const response = await ASICAPI.getASIC();
      setAsicData(response);
      console.log(response);
    } catch (error) {
      console.error("Error fetching ASIC data:", error);
    }
  }, []);

  const getAsicRelations = async (id) => {
    try {
      const response = await ASICAPI.getASICRelations(id);
      console.log("ASIC Relations:", response);
      setFormData(response);
      setIsModalOpen(true);
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

  const [isLoadingForm, setIsLoadingForm] = React.useState(false);
  const createASIC = async (e) => {
    e.preventDefault();
    setIsLoadingForm(true);
    try {
      const response = await ASICAPI.createASIC({ name: formData.name });
      showSuccess("ASIC creado exitosamente");
      getASIC(); // Refresh the list after creating

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating ASIC:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
    setIsLoadingForm(false);
  };

  const addNewDependency = () => {
    if (!formData.newDependenceName) return;
    const newDependence = {
      name: formData.newDependenceName,
      asic_id: formData.id,
    };
    try {
      dependenciesAPI.createDependency(newDependence).then((response) => {
        showSuccess("Dependencia creada exitosamente");
        setFormData({
          ...formData,
          dependences: [...formData.dependences, response],
          newDependenceName: "",
        });
      });
    } catch (error) {
      console.error("Error creating dependency:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const deleteDependency = (id) => {
    try {
      dependenciesAPI.deleteDependency(id).then(() => {
        showSuccess("Dependencia eliminada exitosamente");
        setFormData({
          ...formData,
          dependences: formData.dependences.filter((d) => d.id !== id),
        });
      });
    } catch (error) {
      console.error("Error deleting dependency:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const updateDependency = (id, updatedData) => {
    try {
      dependenciesAPI.updateDependency(id, updatedData).then((response) => {
        showSuccess("Dependencia actualizada exitosamente");
        setFormData({
          ...formData,
          dependences: formData.dependences.map((d) =>
            d.id === id ? response : d
          ),
        });
      });
    } catch (error) {
      console.error("Error updating dependency:", error);
      const errorMessage =  
      error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Configuración</h1>

        <FuturisticButton onClick={() => setIsModalOpen(true)}>
          Crear ASIC
        </FuturisticButton>

        <div>
          <h2 className="text-xl font-semibold mt-6 mb-2">Administrar ASIC</h2>
          <ul>
            {asicData?.map((asic) => (
              <li
                className="hover:bg-gray-100 py-2 px-2 cursor-pointer"
                onClick={() => getAsicRelations(asic.id)}
                key={asic.id}
              >
                {asic.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="modal-title"
        size="lg"
      >
        <form
          onSubmit={createASIC}
          className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto mt-20"
        >
          <FormField
            label="Nombre del ASIC"
            name="asicName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <h3 className="my-2">Dependencias</h3>

          <div className="flex">
            <FormField
              label="Agregar nueva Dependencia"
              name="dependenceName"
              type="text"
              value={formData.newDependenceName || ""}
              onChange={(e) =>
                setFormData({ ...formData, newDependenceName: e.target.value })
              }
            />
            <button
              type="button"
              disabled={!formData.newDependenceName}
              className={`${formData.newDependenceName ? "bg-color1" : "bg-grayBlue "} ml-2 p-2 hover:brightness-125 text-white rounded`}
              onClick={addNewDependency}
            >
              Agregar
            </button>
          </div>
          {formData.dependences?.map((dependence) => (
            <div key={"dependence" + dependence.id}>
              <div className="flex items-center">
                <FormField
                  name="dependenceName"
                  type="text"
                  value={dependence.name}
                />

                <button
                  type="button"
                  className="ml-2 text-red-300 p-1 rounded hover:bg-red-100 hover:text-red-500"
                  onClick={() => deleteDependency(dependence.id)}
                >
                  <Icon icon="material-symbols:close-rounded"></Icon>
                </button>
              </div>

              <div className="body">
                <p>Unidades administrativas relacionadas:</p>
                <FormField
                  label="Agregar nueva Unidad Administrativa"
                  name="unitName"
                  type="text"
                  value={formData.newUnitName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, newUnitName: e.target.value })
                  }
                />

                <ul>
                  {dependence.administrative_units?.map((unit) => (
                    <li key={"unit" + unit.id}>{unit.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <FuturisticButton type="submit" classess={"w-full mt-5"}>
            <span>{isLoadingForm ? "Cargando..." : "Crear"} </span>
          </FuturisticButton>
        </form>
      </Modal>
    </>
  );
}
