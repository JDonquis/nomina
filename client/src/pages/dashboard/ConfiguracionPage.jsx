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

import debounce from "lodash.debounce";
import FuturisticButton from "../../components/FuturisticButton";
import Modal from "../../components/Modal";

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

  const [isLoadingForm, setIsLoadingForm] = useState(false);

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

  const focusCreateDependenceInput = () => {
    setTimeout(() => {
      const input = document.querySelector('input[name="newDependenceName"]');
      if (input) input.focus();
    }, 100);
  };

  const addNewDependency = () => {
    setIsLoadingForm(true);
    if (!formData.newDependenceName) {
      setIsLoadingForm(false);
      return;
    }

    const newDependence = {
      name: formData.newDependenceName,
      asic_id: formData.id,
    };

    dependenciesAPI
      .createDependency(newDependence)
      .then((response) => {
        showSuccess("Dependencia creada exitosamente");
        setFormData({
          ...formData,
          dependences: [...formData.dependences, response],
          newDependenceName: "",
        });
        // focus in the new dependence input
        focusCreateDependenceInput();
      })
      .catch((error) => {
        console.error("Error creating dependency:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      })
      .finally(() => {
        setIsLoadingForm(false);
      });
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

  const updateDependency = useCallback((id, updatedData) => {
    dependenciesAPI.updateDependency(id, updatedData)
      .then((response) => {
        showSuccess("Dependencia actualizada exitosamente");
      })
      .catch((error) => {
        console.error("Error updating dependency:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      });
  }, [showSuccess, showError]);

  // Debounced version of updateDependency
  const debouncedUpdateDependency = useCallback(
    debounce((id, updatedData) => {
      updateDependency(id, updatedData);
    }, 500),
    [updateDependency]
  );

  const createAdministrativeUnit = (dependenceId, unitName) => {
    if (!unitName) return;
    const newUnit = {
      name: unitName,
      dependence_id: dependenceId,
    };
    try {
      administrativeUnitsAPI.createUnit(newUnit).then((response) => {
        showSuccess("Unidad administrativa creada exitosamente");
        setFormData({
          ...formData,
          newUnitName: null,
          dependences: formData.dependences.map((d) =>
            d.id === dependenceId
              ? {
                  ...d,
                  administrativeUnits: [...d.administrativeUnits, response],
                }
              : d,
          ),
        });
      });
    } catch (error) {
      console.error("Error creating administrative unit:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
    // Aquí iría la lógica para crear la unidad administrativa
  };

  const deleteAdministrativeUnit = (id) => {
    administrativeUnitsAPI.deleteUnit(id)
      .then(() => {
        showSuccess("Unidad administrativa eliminada exitosamente");
        setFormData((prevFormData) => ({
          ...prevFormData,
          dependences: prevFormData.dependences.map((d) => ({
            ...d,
            administrative_unities: d.administrative_unities?.filter(
              (u) => u.id !== id,
            ) || [],
          })),
        }));
      })
      .catch((error) => {
        console.error("Error deleting administrative unit:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      });
  };

  const updateAdministrativeUnit = useCallback((id, updatedData) => {
    administrativeUnitsAPI.updateUnit(id, updatedData)
      .then(() => {
        showSuccess("Unidad administrativa actualizada exitosamente");
      })
      .catch((error) => {
        console.error("Error updating administrative unit:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      });
  }, [showSuccess, showError]);

  // Debounced version of updateAdministrativeUnit
  const debouncedUpdateUnit = useCallback(
    debounce((id, updatedData) => {
      updateAdministrativeUnit(id, updatedData);
    }, 500),
    [updateAdministrativeUnit]
  );

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Configuración</h1>

        <FuturisticButton onClick={() => setIsModalOpen(true)}>
          Crear ASIC
        </FuturisticButton>

        <div>
          <h2 className="text-xl font-semibold mt-6 mb-2">Administrar ASIC</h2>
          <ul className="text-sm">
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="full"
        title={
          isLoadingForm && (
            <>
              <Icon
                icon="line-md:loading-loop"
                width={24}
                height={24}
                className="animate-spin"
              />
            </>
          )
        }
      >
        <form>
          <FormField
            label="Nombre del ASIC"
            name="asicName"
            type="text"
            className={"w-fit mx-auto "}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-12 gap-5 mt-10 mb-3">
            <h3 className=" font-bold text-lg mr-6 col-span-3 ">
              Dependencias{" "}
              <button
                className="px-2 text-center text-color3 ml-2 hover:bg-slate-200 rounded-md h-min inline-block bg-gray-100"
                type="button"
                onClick={focusCreateDependenceInput}
              >
                +
              </button>{" "}
            </h3>
            <p className="font-semibold mr-4 col-span-3">
              Unidades administrativas:
              {/* <button
                className="px-2 text-center text-color3 ml-2 hover:bg-slate-200 rounded-md h-min inline-block bg-gray-100"
                type="button"
                // onClick={focusCreateDependenceInput}
              >
                +
              </button>{" "} */}
            </p>
            <p className="font-semibold mr-4 col-span-3">Departamentos:</p>
          </div>

          {formData.dependences?.map((dependence, index) => (
            <div
              className=" duration-300 transition-all h-fit  group/dependence grid mb-1 grid-cols-12 gap-5 items-start"
              key={"dependence" + dependence.id}
            >
              <div className="flex items-center col-span-3 group">
                <div className="group-hover:hidden mr-2 w-4 text-gray-500">
                  {index + 1}.
                </div>
                <button
                  type="button"
                  className="hidden group-hover:block text-red-300 h-10 p-1 rounded rounded-r-none hover:bg-red-100 hover:text-red-500"
                  onClick={() => deleteDependency(dependence.id)}
                >
                  <Icon icon="material-symbols:close-rounded"></Icon>
                </button>
                <FormField
                  name="dependenceName"
                  type="text"
                  value={dependence.name}
                  className="group-hover/dependence:bg-gray-100 group-hover/dependence:text-dark rounded"
                  style={{ border: "none" }}
                  disableOutline
                  onChange={(e) => {
                    const newValue = e.target.value;
                    // Update UI immediately
                    setFormData({
                      ...formData,
                      dependences: formData.dependences.map((d) =>
                        d.id === dependence.id
                          ? { ...d, name: newValue }
                          : d,
                      ),
                    });
                    // Debounced API call
                    debouncedUpdateDependency(dependence.id, {
                      name: newValue,
                      asic_id: formData.id,
                    });
                  }}
                />
              </div>

              <div className="body mt-3 col-span-3">
                <ul className="">
                  {dependence.administrative_unities?.map((unit, Uindex) => (
                    <li className="flex group  " key={"unit" + unit.id}>
                      <div className="group-hover:hidden w-4 mr-1.5 text-gray-500 text-md relative -bottom-1.5">
                        {Uindex + 1}.
                      </div>
                      <button
                        type="button"
                        className="hidden  group-hover:block text-red-300 text-sm h-10 p-1 rounded rounded-r-none hover:bg-red-100 hover:text-red-500"
                        onClick={() => deleteAdministrativeUnit(unit.id)}
                      >
                        <Icon icon="material-symbols:close-rounded"></Icon>
                      </button>
                      <FormField
                        disableOutline
                        name={"unitName_" + unit.id}
                        type="text"
                        value={unit.name}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          // Update UI immediately
                          setFormData({
                            ...formData,
                            dependences: formData.dependences.map((d) =>
                              d.id === dependence.id
                                ? {
                                    ...d,
                                    administrative_unities:
                                      d.administrative_unities.map((u) =>
                                        u.id === unit.id
                                          ? { ...u, name: newValue }
                                          : u,
                                      ),
                                  }
                                : d,
                            ),
                          });
                          // Debounced API call
                          debouncedUpdateUnit(unit.id, {
                            name: newValue,
                            dependence_id: dependence.id,
                          });
                        }}
                      />
                    </li>
                  ))}
                </ul>


                <div className="opacity-0 group-hover/dependence:opacity-100  duration-300 mt-1 flex ">
                  <div className="w-4 mr-2 text-gray-500">
                    {dependence.administrative_unities?.length + 1}.
                  </div>
                  <FormField
                    label="Agregar nueva Unidad Administrativa"
                    name={"newUnitName_" + dependence.id}
                    key={"newUnitName_" + dependence.id}
                    type="text"
                    // value={formData.newUnitName || ""}
                    value={formData["newUnitName_" + dependence.id] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ["newUnitName_" + dependence.id]: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    disabled={!formData["newUnitName_" + dependence.id]}
                    className={`${formData["newUnitName_" + dependence.id] ? "bg-color1 hover:brightness-125" : "bg-gray-50 "} ml-1 p-2 text-xs  text-white rounded`}
                    onClick={() => {
                      if (
                        createAdministrativeUnit(
                          dependence.id,
                          formData["newUnitName_" + dependence.id],
                        )
                      ) {
                      }

                      // Aquí iría la lógica para agregar una nueva unidad administrativa a esta dependencia
                    }}
                  >
                    {isLoadingForm ? (
                      <>
                        <Icon
                          icon="line-md:loading-loop"
                          width={24}
                          height={24}
                          className="animate-spin"
                        />
                      </>
                    ) : (
                      "Añadir"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-12">
            <div
              className={`col-span-3 flex ${formData.newDependenceName ? "" : "opacity-75"}`}
            >
              <div className="mr-2 w-3 text-gray-500">
                {formData.dependences?.length + 1}.
              </div>

              <FormField
                label="Agregar nueva Dependencia"
                name="newDependenceName"
                type="text"
                value={formData.newDependenceName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newDependenceName: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && formData.newDependenceName) {
                    e.preventDefault();
                    addNewDependency();
                  }
                }}
              />
              <button
                type="button"
                disabled={!formData.newDependenceName || isLoadingForm}
                className={`${formData.newDependenceName && !isLoadingForm ? "bg-color1 hover:brightness-125" : "bg-gray-50 "} ml-1 p-2 text-xs  text-white rounded`}
                onClick={addNewDependency}
              >
                {isLoadingForm ? (
                  <>
                    <Icon
                      icon="line-md:loading-loop"
                      width={24}
                      height={24}
                      className="animate-spin"
                    />
                  </>
                ) : (
                  "Añadir"
                )}
              </button>
            </div>
          </div>
          {/* <span>{isLoadingForm ? "Cargando..." : "Crear"} </span> */}

          {/* <FuturisticButton type="submit" classess={"w-full mt-5"}>
          </FuturisticButton> */}
        </form>
      </Modal>
    </>
  );
}
