import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usersAPI, ASICAPI } from "../../services/api";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal";
import FuturisticButton from "../../components/FuturisticButton";
import { MaterialReactTable } from "material-react-table";
import { ReusableForm } from "../../components/forms";
import { useFeedback } from "../../context/FeedbackContext";
import { useTableVisibility } from "../../hooks/useTablePersistence.js";

// En las versiones más recientes, no necesitas registrar módulos para funcionalidades básicas
// La versión Community ya incluye el ClientSideRowModel por defecto

// Función reutilizable para crear operadores de filtro para columnas de texto

export default function UsuariosPage() {
  const [columnVisibility, setColumnVisibility] = useTableVisibility(
    "usuarios_columns",
    {},
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultFormData = {
    email: "",
    full_name: "",
    is_admin: false,
    charge: "",
    status: false,
    can_register_personnel: false,
    asic_id: "",
    dependency_id: "",
    administrative_unit_id: "",
    department_id: "",
    service_id: "",
  };
  const [formData, setFormData] = useState(structuredClone(defaultFormData));
  const [submitString, setSubmitString] = useState("Crear");
  const { showError, showSuccess, showInfo } = useFeedback();

  const [asicOptions, setAsicOptions] = useState([]);
  const [dependencyOptions, setDependencyOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [asicRelations, setAsicRelations] = useState(null);

  const clearChildOptions = () => {
    setDependencyOptions([]);
    setUnitOptions([]);
    setDepartmentOptions([]);
    setServiceOptions([]);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await ASICAPI.getASIC();
        setAsicOptions(res.map((asic) => ({ value: asic.id, label: asic.name })));
      } catch (e) {
        console.error("Error cargando ASIC", e);
      }
    })();
  }, []);

  const prepareScopeOptions = useCallback(async (data) => {
    if (!data?.asic_id) {
      setAsicRelations(null);
      clearChildOptions();
      return;
    }

    try {
      const rel = await ASICAPI.getASICRelations(data.asic_id);
      setAsicRelations(rel);

      const deps = rel.dependencies || [];
      setDependencyOptions(deps.map((d) => ({ value: d.id, label: d.name })));

      const dep = deps.find((d) => d.id === data.dependency_id);
      const units = dep?.administrative_units || [];
      setUnitOptions(units.map((u) => ({ value: u.id, label: u.name })));

      const unit = units.find((u) => u.id === data.administrative_unit_id);
      const depts = unit?.departments || [];
      setDepartmentOptions(depts.map((d) => ({ value: d.id, label: d.name })));

      const dept = depts.find((d) => d.id === data.department_id);
      const services = dept?.services || [];
      setServiceOptions(services.map((s) => ({ value: s.id, label: s.name })));
    } catch (e) {
      console.error("Error cargando relaciones del ASIC", e);
    }
  }, []);

  const handleAsicChange = async (e, _formData, updateFormData) => {
    const value = e.target.value;

    updateFormData({
      asic_id: value,
      dependency_id: "",
      administrative_unit_id: "",
      department_id: "",
      service_id: "",
    });

    setAsicRelations(null);
    clearChildOptions();

    if (!value) return;

    try {
      const rel = await ASICAPI.getASICRelations(value);
      setAsicRelations(rel);
      setDependencyOptions(
        (rel.dependencies || []).map((d) => ({ value: d.id, label: d.name })),
      );
    } catch (e) {
      console.error("Error cargando relaciones del ASIC", e);
    }
  };

  const handleDependencyChange = (e, _formData, updateFormData) => {
    const value = e.target.value;

    updateFormData({
      dependency_id: value,
      administrative_unit_id: "",
      department_id: "",
      service_id: "",
    });

    setUnitOptions([]);
    setDepartmentOptions([]);
    setServiceOptions([]);

    const dep = (asicRelations?.dependencies || []).find(
      (d) => d.id === Number(value),
    );
    const units = dep?.administrative_units || [];
    setUnitOptions(units.map((u) => ({ value: u.id, label: u.name })));
  };

  const handleUnitChange = (e, _formData, updateFormData) => {
    const value = e.target.value;

    updateFormData({
      administrative_unit_id: value,
      department_id: "",
      service_id: "",
    });

    setDepartmentOptions([]);
    setServiceOptions([]);

    let unit = null;
    for (const dep of asicRelations?.dependencies || []) {
      unit = (dep.administrative_units || []).find(
        (u) => u.id === Number(value),
      );
      if (unit) break;
    }

    const depts = unit?.departments || [];
    setDepartmentOptions(depts.map((d) => ({ value: d.id, label: d.name })));
  };

  const handleDepartmentChange = (e, _formData, updateFormData) => {
    const value = e.target.value;

    updateFormData({ department_id: value, service_id: "" });
    setServiceOptions([]);

    let dept = null;
    for (const dep of asicRelations?.dependencies || []) {
      for (const unit of dep.administrative_units || []) {
        dept = (unit.departments || []).find((d) => d.id === Number(value));
        if (dept) break;
      }
      if (dept) break;
    }

    const services = dept?.services || [];
    setServiceOptions(services.map((s) => ({ value: s.id, label: s.label || s.name })));
  };

  // Form configuration for ReusableForm
  const userFormFields = [
    {
      name: "email",
      label: "Correo Electrónico",
      type: "email",
      required: true,
      placeholder: "usuario@hospital.com",
      className: "col-span-2",
    },
    {
      name: "full_name",
      label: "Nombre Completo",
      type: "text",
      required: true,
      className: "col-span-2",
    },
    {
      name: "charge",
      label: "Cargo",
      type: "text",
      required: true,
      className: "col-span-2",
    },

    {
      name: "is_admin",
      label: "Administrador",
      type: "checkbox",
      helperText:
        "Gestiona otros usuarios, además de tener ciertos privilegios en nómina",
    },
    {
      name: "can_register_personnel",
      label: "Puede registrar personal",
      type: "checkbox",
      helperText:
        "Permite crear personal (activo y fe de vida) dentro de su alcance",
    },
    {
      name: "asic_id",
      label: "Alcance: ASIC",
      type: "select",
      options: asicOptions,
      disabled: formData.is_admin,
      onChangeCustom: handleAsicChange,
      className: "col-span-2",
    },
    {
      name: "dependency_id",
      label: "Alcance: Dependencia",
      type: "select",
      options: dependencyOptions,
      disabled: formData.is_admin || !formData.asic_id,
      onChangeCustom: handleDependencyChange,
      className: "col-span-2",
    },
    {
      name: "administrative_unit_id",
      label: "Alcance: Unidad Administrativa",
      type: "select",
      options: unitOptions,
      disabled: formData.is_admin || !formData.dependency_id,
      onChangeCustom: handleUnitChange,
      className: "col-span-2",
    },
    {
      name: "department_id",
      label: "Alcance: Departamento",
      type: "select",
      options: departmentOptions,
      disabled: formData.is_admin || !formData.administrative_unit_id,
      onChangeCustom: handleDepartmentChange,
      className: "col-span-2",
    },
    {
      name: "service_id",
      label: "Alcance: Servicio",
      type: "select",
      options: serviceOptions,
      disabled: formData.is_admin || !formData.department_id,
      className: "col-span-2",
    },
    {
      name: "status",
      label: "Usuario Suspendido",
      type: "checkbox",
      helperText:
        "Activa esta opción para que el usuario no pueda iniciar sesión, desactivala cuando quieras",
    },
  ];

  const validationRules = {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
    first_name: {
      minLength: 2,
      maxLength: 50,
    },
    last_name: {
      minLength: 2,
      maxLength: 50,
    },
  };

  const onSubmit = async (submittedFormData) => {
    try {
      if (submitString === "Actualizar") {
        await usersAPI.updateUser(formData.id, submittedFormData);
        setSubmitString("Crear");
        setFormData(structuredClone(defaultFormData));
      } else {
        await usersAPI.createUser(submittedFormData);
      }

      // Reset form data after successful submission
      setFormData(structuredClone(defaultFormData));
      setAsicRelations(null);
      clearChildOptions();

      setIsModalOpen(false);
      showSuccess("Usuario creado");
      fetchData();
    } catch (error) {
      // This will only catch errors from the internal API
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      await usersAPI.deleteUser(id);
      // showSuccess("Operación completada con éxito");
      fetchData();
    } catch (error) {
      // This will only catch errors from the internal API
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    }
  };

  const handleResendInvitation = async (id) => {
    if (
      !window.confirm(
        "¿Reenviar el correo de creación de usuario a este usuario?",
      )
    ) {
      return;
    }

    try {
      await usersAPI.resendInvitation(id);
      showSuccess("Correo de creación reenviado exitosamente");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al reenviar el correo";
      showError(errorMessage);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: "id",
      header: "ID",
      size: 75,
    },    {
      accessorKey: "full_name",
      header: "Nombre",
      size: 310,
    },
    {
      accessorKey: "censos_count",
      header: "Nro de censos",
      size: 100,
    },

    {
      accessorKey: "email",
      header: "Correo Electrónico",
      size: 200,
    },
    {
      id: "scope",
      header: "Alcance",
      size: 260,
      Cell: ({ row }) => {
        const u = row.original;
        if (u.is_admin) return "Administrador (total)";
        const parts = [u.asic, u.dependency, u.administrative_unit, u.department, u.service]
          .filter(Boolean)
          .map((s) => s.name.replace("ASIC", "").trim());
        return parts.length ? parts.join(" / ") : "Todos los ASIC";
      },
    },
    {
      accessorKey: "charge",
      header: "Cargo",
      size: 200,
    },

    {
      accessorKey: "is_admin",
      header: "Administrador",
      size: 180,
      Cell: ({ cell }) =>
        cell.getValue() ? (
          <Icon
            className="text-color2"
            icon="iconamoon:check-fill"
            width={20}
            height={20}
          />
        ) : (
          <Icon
            className="text-red-300"
            icon="line-md:close"
            width={18}
            height={17}
          />
        ),
    },

    {
      accessorKey: "email_verified_status",
      header: "Estado",
      size: 180,
      Cell: ({ renderedCellValue, row }) => {
        const { original } = row;

        let status = original.email_verified_status && original.status;
        return status ? (
          <Icon
            className="text-color2"
            icon="iconamoon:check-fill"
            width={20}
            height={20}
          />
        ) : (
          <Icon
            className="text-red-300"
            icon="line-md:close"
            width={18}
            height={17}
          />
        );
      },
    },
    {
      header: "Acciones",
      id: "actions", // ← obligatorio cuando no usas accessorKey
      size: 100,
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <div className="flex gap-2 justify-center items-center">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setFormData({ ...defaultFormData, ...row.original });
              setSubmitString("Actualizar");
              prepareScopeOptions(row.original);
            }}
            className="mx-1 p-1 hover:p-2 duration-75 text-gray-500 hover:bg-blue-100 hover:text-color3 rounded-full"
            title="Editar"
          >
            <Icon icon="material-symbols:edit" width={20} height={20} />
          </button>

          <button
            onClick={() => handleResendInvitation(row.original.id)}
            className="mx-1 p-1 hover:p-2 duration-75 text-gray-500 hover:bg-green-100 hover:text-green-600 rounded-full"
            title="Reenviar correo de creación"
          >
            <Icon icon="material-symbols:mail-outline" width={20} height={20} />
          </button>

          <button
            onClick={() => {
              if (window.confirm("¿Está seguro de eliminar a este usuario?")) {
                handleDelete(row.original.id);
              }
            }}
            className="mx-1 p-1 hover:p-2 duration-75 text-gray-500 hover:bg-red-100 hover:text-red-500 rounded-full"
            title="Eliminar"
          >
            {" "}
            <Icon
              icon="material-symbols:delete-outline"
              width={20}
              height={20}
            />
          </button>
        </div>
      ),
    },
  ]);
  const [rowData, setRowData] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await usersAPI.getAllUsers();
      setRowData(res.users);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <title>Gestión de Usuarios - Nómina</title>
      <div style={{ height: 580, width: "100%" }}>
        <div className="md:flex justify-between items-center mb-4">
          <h1 className="text-lg md:text-2xl font-bold mb-2 md:mb-0">
            Gestión de Usuarios
          </h1>
          <FuturisticButton
            onClick={() => {
              if (submitString === "Actualizar") {
                setSubmitString("Crear");
                setFormData(structuredClone(defaultFormData));
                setAsicRelations(null);
                clearChildOptions();
              }
              setIsModalOpen(true);
            }}
          >
            Crear usuario
          </FuturisticButton>
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          title="Crear Nuevo Usuario"
          size="md"
          aria-labelledby="modal-title"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 p-3 bg-amber-50 rounded-md border border-amber-100 text-sm text-amber-800">
              <strong>Alcance:</strong> si deja todos los campos vacíos, el
              usuario podrá gestionar todos los ASIC. Al seleccionar un ASIC se
              limita a él; y puede seguir bajando (Dependencia, Unidad, etc.)
              para restringir el área de acceso. Los usuarios administradores no
              usan alcance.
            </div>
            <ReusableForm
              fields={userFormFields}
              onSubmit={onSubmit}
              onCancel={() => {
                setFormData(structuredClone(defaultFormData));
                setAsicRelations(null);
                clearChildOptions();
                setIsModalOpen(false);
              }}
              submitText={submitString}
              cancelText="Cancelar"
              validationRules={validationRules}
              className="col-span-2"
              formData={formData}
              onFormDataChange={setFormData}
            />
          </div>

          {/* Activation Information */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-100">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              Información de activación
            </h3>
            <p className="text-sm text-blue-700">
              Se enviará un enlace de activación al correo electrónico del
              usuario. A través de este enlace, el usuario podrá establecer su
              contraseña y activar su cuenta.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              El enlace de activación caducará en 48 horas. Si el usuario no
              activa su cuenta en este tiempo, el usuario será eliminado.
            </p>
          </div>
        </Modal>
        <div
          className="ag-theme-alpine ag-grid-no-border"
          style={{ height: 500 }}
        >
          <MaterialReactTable
            columns={columns}
            data={rowData}
            enableColumnFilters
            enableSorting
            enablePagination
            initialState={{ pagination: { pageSize: 25 } }}
            state={{ columnVisibility }}
            onColumnVisibilityChange={setColumnVisibility}
            muiTablePaginationProps={{
              rowsPerPageOptions: [5, 10, 20, 25],
              showFirstButton: true,
              showLastButton: true,
            }}
          />
        </div>
      </div>
    </>
  );
}
