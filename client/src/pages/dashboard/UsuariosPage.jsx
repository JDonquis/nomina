import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usersAPI, ASICAPI } from "../../services/api";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal";
import FuturisticButton from "../../components/FuturisticButton";
import { MaterialReactTable } from "material-react-table";
import { ReusableForm, ScopeTree, SCOPE_LEVELS } from "../../components/forms";
import { useFeedback } from "../../context/FeedbackContext";
import { useTableVisibility } from "../../hooks/useTablePersistence.js";

// En las versiones más recientes, no necesitas registrar módulos para funcionalidades básicas
// La versión Community ya incluye el ClientSideRowModel por defecto

// Función reutilizable para crear operadores de filtro para columnas de texto

const emptyTreeScope = () => ({
  granted: {
    dependency: [],
    administrative_unit: [],
    department: [],
    service: [],
  },
  revoked: {
    dependency: [],
    administrative_unit: [],
    department: [],
    service: [],
  },
});

// Convierte un alcance legacy (una sola ruta) a la estructura de árbol,
// revocando los nodos hermanos que quedan fuera de dicha ruta.
const legacyScopeToTree = (data, relations) => {
  const scope = emptyTreeScope();

  if (!data?.dependency_id) return scope;

  const dependencies = relations?.dependencies || [];
  const depId = Number(data.dependency_id);
  dependencies.forEach((dep) => {
    if (Number(dep.id) !== depId) scope.revoked.dependency.push(dep.id);
  });

  if (!data.administrative_unit_id) return scope;
  const dep = dependencies.find((d) => Number(d.id) === depId);
  const unitId = Number(data.administrative_unit_id);
  (dep?.administrative_units || []).forEach((unit) => {
    if (Number(unit.id) !== unitId) scope.revoked.administrative_unit.push(unit.id);
  });

  if (!data.department_id) return scope;
  const unit = (dep?.administrative_units || []).find(
    (u) => Number(u.id) === unitId,
  );
  const deptId = Number(data.department_id);
  (unit?.departments || []).forEach((dept) => {
    if (Number(dept.id) !== deptId) scope.revoked.department.push(dept.id);
  });

  if (!data.service_id) return scope;
  const dept = (unit?.departments || []).find((d) => Number(d.id) === deptId);
  const serviceId = Number(data.service_id);
  (dept?.services || []).forEach((service) => {
    if (Number(service.id) !== serviceId) scope.revoked.service.push(service.id);
  });

  return scope;
};

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
    access_scope: null,
  };
  const [formData, setFormData] = useState(structuredClone(defaultFormData));
  const [submitString, setSubmitString] = useState("Crear");
  const { showError, showSuccess, showInfo } = useFeedback();

  const [asicOptions, setAsicOptions] = useState([]);
  const [asicRelations, setAsicRelations] = useState(null);
  const [relationsLoading, setRelationsLoading] = useState(false);

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

  const loadAsicRelations = useCallback(async (asicId) => {
    if (!asicId) {
      setAsicRelations(null);
      return null;
    }

    setRelationsLoading(true);
    try {
      const rel = await ASICAPI.getASICRelations(asicId);
      setAsicRelations(rel);
      return rel;
    } catch (e) {
      console.error("Error cargando relaciones del ASIC", e);
      return null;
    } finally {
      setRelationsLoading(false);
    }
  }, []);

  const prepareScopeOptions = useCallback(
    async (data) => {
      if (!data?.asic_id) {
        setAsicRelations(null);
        return;
      }

      const rel = await loadAsicRelations(data.asic_id);

      const hasLegacyPath =
        data.dependency_id ||
        data.administrative_unit_id ||
        data.department_id ||
        data.service_id;

      if (rel && !data.access_scope && hasLegacyPath) {
        setFormData((prev) => ({
          ...prev,
          access_scope: legacyScopeToTree(data, rel),
        }));
      }
    },
    [loadAsicRelations],
  );

  const handleAsicChange = useCallback(
    async (asicId) => {
      setFormData((prev) => ({
        ...prev,
        asic_id: asicId ?? "",
        access_scope: null,
      }));

      await loadAsicRelations(asicId);
    },
    [loadAsicRelations],
  );

  const handleScopeChange = useCallback((scope) => {
    setFormData((prev) => ({ ...prev, access_scope: scope }));
  }, []);

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
      name: "access_scope",
      className: "col-span-2",
      render: ({ formData: current, disabled }) => (
        <ScopeTree
          asics={asicOptions}
          asicId={current.asic_id}
          asicRelations={asicRelations}
          accessScope={current.access_scope}
          onAsicChange={handleAsicChange}
          onScopeChange={handleScopeChange}
          disabled={disabled || current.is_admin}
          loading={relationsLoading}
        />
      ),
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
        if (!u.asic) return "Todos los ASIC";

        const name = u.asic.name.replace("ASIC", "").trim();

        if (u.access_scope) {
          const count = (group) =>
            SCOPE_LEVELS.reduce(
              (total, level) => total + (u.access_scope[group]?.[level]?.length || 0),
              0,
            );
          const revokes = count("revoked");
          const grants = count("granted");

          if (!revokes && !grants) return name;

          const detail = [];
          if (revokes) detail.push(`${revokes} exclusión(es)`);
          if (grants) detail.push(`${grants} excepción(es)`);

          return `${name} · ${detail.join(", ")}`;
        }

        const parts = [
          u.dependency,
          u.administrative_unit,
          u.department,
          u.service,
        ]
          .filter(Boolean)
          .map((s) => s.name.replace("ASIC", "").trim());

        return [name, ...parts].join(" / ");
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
          size="lg"
          aria-labelledby="modal-title"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReusableForm
              fields={userFormFields}
              onSubmit={onSubmit}
              onCancel={() => {
                setFormData(structuredClone(defaultFormData));
                setAsicRelations(null);
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
