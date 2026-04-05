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
import { produce } from "immer";
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
    dependencies: [],
    administrative_units: [],
    departments: [],
    services: [],
  });

  const [isLoadingForm, setIsLoadingForm] = useState(false);

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

  const addNewDependency = async () => {
    if (!formData.newDependenceName) return;

    setIsLoadingForm(true);
    const newDependence = {
      name: formData.newDependenceName,
      asic_id: formData.id,
    };

    try {
      const response = await dependenciesAPI.createDependency(newDependence);
      setFormData({
        ...formData,
        dependencies: [...formData.dependencies, response],
        newDependenceName: "",
      });
      // focus in the new dependence input
      focusCreateDependenceInput();
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
      setFormData({
        ...formData,
        dependencies: formData.dependencies.filter((d) => d.id !== id),
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

  const updateDependency = useCallback(
    async (id, updatedData) => {
      try {
        await dependenciesAPI.updateDependency(id, updatedData);
        // showSuccess("Dependencia actualizada exitosamente");
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

  // Debounced version of updateDependency
  const debouncedUpdateDependency = useCallback(
    debounce((id, updatedData) => {
      updateDependency(id, updatedData);
    }, 500),
    [updateDependency],
  );

  const createAdministrativeUnit = async (dependenceId, unitName) => {
    if (!unitName) return;

    setIsLoadingForm(true);
    const newUnit = {
      name: unitName,
      dependency_id: dependenceId,
    };

    try {
      const response = await administrativeUnitsAPI.createUnit(newUnit);
      // showSuccess("Unidad administrativa creada exitosamente");
      setFormData(
        produce((draft) => {
          draft["newUnitName_" + dependenceId] = "";
          draft["newDepartmentName_" + response.id] = unitName;
          const dep = draft.dependencies.find((d) => d.id === dependenceId);
          if (dep) dep.administrative_units.push(response);
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
      setIsLoadingForm(true);
      try {
        await administrativeUnitsAPI.updateUnit(id, updatedData);
        // showSuccess("Unidad administrativa actualizada exitosamente");
      } catch (error) {
        console.error("Error updating administrative unit:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      } finally {
        setIsLoadingForm(false);
      }
    },
    [showError],
  );

  const createDepartment = async (unitId, departmentName, repeat) => {
    if (!departmentName) return;

    setIsLoadingForm(true);
    const newDepartment = {
      name: departmentName,
      administrative_unit_id: unitId,
    };
    try {
      const response = await departmentAPI.createDepartment(newDepartment);
      // showSuccess("Departamento creado exitosamente");

      // if repeat then create a service with the same name of the department
      if (repeat) {
        try {
          const serviceResponse = await servicesAPI.createService({
            name: departmentName,
            department_id: response.id,
          });

          setFormData(
            produce((draft) => {
              draft["newDepartmentName_" + unitId] = "";
              draft["newServiceName_" + response.id] = "";
              const unit = draft.dependencies
                .flatMap((d) => d.administrative_units)
                .find((u) => u.id === unitId);
              if (unit)
                unit.departments.push({
                  ...response,
                  services: [serviceResponse],
                });
            }),
          );
        } catch (serviceError) {
          console.error("Error creating service:", serviceError);
          // If service fails, still add the department
          setFormData(
            produce((draft) => {
              draft["newDepartmentName_" + unitId] = "";
              const unit = draft.dependencies
                .flatMap((d) => d.administrative_units)
                .find((u) => u.id === unitId);
              if (unit) unit.departments.push(response);
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
            draft["newDepartmentName_" + unitId] = "";
            const unit = draft.dependencies
              .flatMap((d) => d.administrative_units)
              .find((u) => u.id === unitId);
            if (unit) unit.departments.push(response);
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

  // Debounced version of updateAdministrativeUnit
  const debouncedUpdateUnit = useCallback(
    debounce((id, updatedData) => {
      updateAdministrativeUnit(id, updatedData);
    }, 500),
    [updateAdministrativeUnit],
  );

  const updateDepartment = useCallback(
    async (id, updatedData) => {
      setIsLoadingForm(true);

      try {
        await departmentAPI.updateDepartment(id, updatedData);
        // showSuccess("Departamento actualizado exitosamente");
      } catch (error) {
        console.error("Error updating department:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      } finally {
        setIsLoadingForm(false);
      }
    },
    [showError],
  );

  // Debounced version of updateDepartment
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

  //service
  const createService = async (unitId, departmentId, serviceName) => {
    if (!serviceName) return;

    setIsLoadingForm(true);
    const newService = {
      name: serviceName,
      department_id: departmentId,
    };
    try {
      const response = await servicesAPI.createService(newService);
      setFormData(
        produce((draft) => {
          draft["newServiceName_" + departmentId] = "";
          const dept = draft.dependencies
            .flatMap((d) => d.administrative_units)
            .flatMap((u) => u.departments)
            .find((dep) => dep.id === departmentId);
          if (dept) dept.services.push(response);
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
      setIsLoadingForm(true);
      try {
        await servicesAPI.updateService(id, updatedData);
        // showSuccess("Servicio actualizado exitosamente");
      } catch (error) {
        console.error("Error updating service:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error en el sistema principal";
        showError(errorMessage);
      } finally {
        setIsLoadingForm(false);
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

  const toggleVisivility = (e) => {
    const body = e.currentTarget.closest(".dependencyDiv").querySelector(".body");
    body.classList.toggle("hidden");

    // toggle rotate of the icon
    e.currentTarget.querySelector(".icon").classList.toggle("rotate-90");
  };

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Configuración</h1>

        {/* <FuturisticButton onClick={() => setIsModalOpen(true)}>
          Crear ASIC
        </FuturisticButton> */}

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
            <p className="font-semibold mr-4 col-span-3">Servicios:</p>
          </div>

          {formData.dependencies?.map((dependence, index) => (
            <div
              className="border-b  border- duration-300 transition-all h-fit dependencyDiv group/dependence grid mb-1 grid-cols-12 gap-5 items-start"
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
                  className=" group-hover/dependence:bg-gray-100 group-hover/dependence:text-dark rounded"
                  style={{ border: "none" }}
                  disableOutline
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData(
                      produce((draft) => {
                        const dep = draft.dependencies.find(
                          (d) => d.id === dependence.id,
                        );
                        if (dep) dep.name = newValue;
                      }),
                    );
                    debouncedUpdateDependency(dependence.id, {
                      name: newValue,
                      asic_id: formData.id,
                    });
                  }}
                />
                <button
                  type="button"
                  className="ml-1 text-gray-400 text-sm px-2 hover:bg-gray-300 h-10"
                  onClick={toggleVisivility}
                >
                  <Icon
                    icon="lets-icons:expand-right"
                    className={`rotate-90 icon  ml-1 text-gray-500 group-hover:text-gray-700 `}
                  ></Icon>
                </button>
              </div>

              <div className="body  mt-0 col-span-9">
                {dependence.administrative_units?.map((unit, Uindex) => (
                  <div
                    className=" group/unit border-b gap-2 grid grid-cols-6"
                    key={"unit" + unit.id}
                  >
                    <div className="col-span-2 flex group group-hover/unit:bg-slate-100 ">
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
                          setFormData(
                            produce((draft) => {
                              const u = draft.dependencies
                                .flatMap((d) => d.administrative_units)
                                .find((u) => u.id === unit.id);
                              if (u) u.name = newValue;
                            }),
                          );
                          debouncedUpdateUnit(unit.id, {
                            name: newValue,
                            dependency_id: dependence.id,
                          });
                        }}
                      />
                    </div>

                    <div className="group/department grid-cols-4 border-b col-span-4">
                      {unit.departments?.map((department, Dindex) => (
                        <div
                          key={"department" + department.id}
                          className="group/departmentInput  grid grid-cols-6"
                        >
                          <div className="flex  col-span-3 group-hover/departmentInput:bg-slate-100  ">
                            <div className="group-hover/departmentInput:hidden w-4 mr-2 relative -bottom-1.5 text-gray-500">
                              {Dindex + 1}.
                            </div>

                            <button
                              type="button"
                              className="hidden group-hover/departmentInput:block text-red-300 text-sm h-10 p-1 rounded rounded-r-none hover:bg-red-100 hover:text-red-500"
                              onClick={() =>
                                deleteDepartment(department.id, unit.id)
                              }
                            >
                              <Icon icon="material-symbols:close-rounded"></Icon>
                            </button>
                            <FormField
                              disableOutline
                              name={"departmentName_" + department.id}
                              type="text"
                              value={department.name}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setFormData(
                                  produce((draft) => {
                                    const dept = draft.dependencies
                                      .flatMap((d) => d.administrative_units)
                                      .flatMap((u) => u.departments)
                                      .find((dep) => dep.id === department.id);
                                    if (dept) dept.name = newValue;
                                  }),
                                );
                                debouncedUpdateDepartment(department.id, {
                                  name: newValue,
                                  administrative_unit_id: unit.id,
                                });
                              }}
                            />
                          </div>

                          <div className="col-span-3 group/service ">
                            {department.services?.map((service, Sindex) => (
                              <div
                                className="flex items-center ml-5 cols-pan-3 group-hover/service:bg-slate-100 group/serviceInput "
                                key={"service_" + service.id}
                              >
                                <div className="group-hover/serviceInput:hidden w-4 mr-2 text-gray-500">
                                  {Sindex + 1}.
                                </div>

                                <button
                                  type="button"
                                  className="hidden group-hover/serviceInput:block text-red-300 text-sm h-10 p-1 rounded rounded-r-none hover:bg-red-100 hover:text-red-500"
                                  onClick={() =>
                                    deleteService(
                                      service.id,
                                      unit.id,
                                      department.id,
                                    )
                                  }
                                >
                                  <Icon icon="material-symbols:close-rounded"></Icon>
                                </button>
                                <FormField
                                  disableOutline
                                  name={"serviceName_" + service.id}
                                  type="text"
                                  value={service.name}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setFormData(
                                      produce((draft) => {
                                        const svc = draft.dependencies
                                          .flatMap(
                                            (d) => d.administrative_units,
                                          )
                                          .flatMap((u) => u.departments)
                                          .flatMap((dep) => dep.services)
                                          .find((s) => s.id === service.id);
                                        if (svc) svc.name = newValue;
                                      }),
                                    );
                                    debouncedUpdateService(service.id, {
                                      name: newValue,
                                      department_id: department.id,
                                    });
                                  }}
                                />
                              </div>
                            ))}
                            <div className="hidden  transition-opacity duration-200 group-hover/service:flex items-center ml-5 mt-1">
                              <div className="w-4 mr-2 text-gray-500">
                                {department.services?.length + 1 || 1}.
                              </div>
                              <FormField
                                label="Nueva Servicio"
                                name={"newServiceName_" + department.id}
                                key={"newServiceName_" + department.id}
                                type="text"
                                // value={formData.newServiceName || ""}
                                value={
                                  formData["newServiceName_" + department.id] ||
                                  ""
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    ["newServiceName_" + department.id]:
                                      e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    formData["newServiceName_" + department.id]
                                  ) {
                                    e.preventDefault();
                                    createService(
                                      unit.id,
                                      department.id,
                                      formData[
                                        "newServiceName_" + department.id
                                      ],
                                    );
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={
                                  !formData["newServiceName_" + department.id]
                                }
                                className={`${formData["newServiceName_" + department.id] ? "bg-color1 hover:brightness-125" : "hidden"} ml-1 p-2 text-xs  text-white rounded`}
                                onClick={() => {
                                  if (
                                    createService(
                                      unit.id,
                                      department.id,
                                      formData[
                                        "newServiceName_" + department.id
                                      ],
                                    )
                                  ) {
                                  }
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
                      <div className="hidden  transition-opacity duration-200  group-hover/department:flex items-center  mt-1">
                        <div className="w-4 mr-2 relative -bottom-1.5 text-gray-500">
                          {unit.departments?.length + 1 || 1}.
                        </div>
                        <FormField
                          label="Nuevo Departamento"
                          name={"newDepartmentName_" + unit.id}
                          key={"newDepartmentName_" + unit.id}
                          type="text"
                          // value={formData.newDepartmentName || ""}
                          defaultValue={
                            unit.departments?.length == 0 ? unit?.name : ""
                          }
                          value={formData["newDepartmentName_" + unit.id]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ["newDepartmentName_" + unit.id]: e.target.value,
                            })
                          }
                          onFocus={(e) => {
                            // Scroll to the input when it gets focused
                            e.target.select();
                          }}
                          onMouseEnter={(e) => {
                            if (unit.departments?.length == 0) {
                              setFormData({
                                ...formData,
                                ["newDepartmentName_" + unit.id]: unit.name,
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              formData["newDepartmentName_" + unit.id]
                            ) {
                              e.preventDefault();
                              createDepartment(
                                unit.id,
                                formData["newDepartmentName_" + unit.id],
                                formData["newDepartmentName_" + unit.id] ===
                                  unit.name,
                              );
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={!formData["newDepartmentName_" + unit.id]}
                          className={`${formData["newDepartmentName_" + unit.id] ? "bg-color1 hover:brightness-125" : "hidden"} ml-1 p-2 text-xs  text-white rounded`}
                          onClick={() => {
                            if (
                              createDepartment(
                                unit.id,
                                formData["newDepartmentName_" + unit.id],
                                formData["newDepartmentName_" + unit.id] ===
                                  unit.name,
                              )
                            ) {
                            }
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

                <div className=" group-hover/dependence:flex  duration-300 mt-1 hidden ">
                  <div className="w-4 mr-2 text-gray-500">
                    {dependence.administrative_units?.length + 1 || 1}.
                  </div>

                  <FormField
                    label="Nueva Unidad Administrativa"
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
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        formData["newUnitName_" + dependence.id]
                      ) {
                        e.preventDefault();
                        createAdministrativeUnit(
                          dependence.id,
                          formData["newUnitName_" + dependence.id],
                        );
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!formData["newUnitName_" + dependence.id]}
                    className={`${formData["newUnitName_" + dependence.id] ? "bg-color1 hover:brightness-125" : "hidden"} ml-1 p-2 text-xs  text-white rounded`}
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
                {formData.dependencies?.length + 1 || 1}.
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
