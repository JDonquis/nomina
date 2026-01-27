import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usersAPI } from "../../services/api";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal";
import FuturisticButton from "../../components/FuturisticButton";
import {MaterialReactTable} from 'material-react-table';
import { ReusableForm } from "../../components/forms";


// En las versiones más recientes, no necesitas registrar módulos para funcionalidades básicas
// La versión Community ya incluye el ClientSideRowModel por defecto

// Función reutilizable para crear operadores de filtro para columnas de texto

export default function UsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultFormData = {
    email: "",
    first_name: "",
    last_name: "",
    allow_validate_exam: false,
    allow_handle_users: false,
    allow_handle_exams: false,
  };
  const [formData, setFormData] = useState(structuredClone(defaultFormData));
  const [submitString, setSubmitString] = useState("Crear");

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
    },
 
    {
      name: "is_admin",
      label: "Puede Gestionar Usuarios",
      type: "checkbox",
      helperText: "Permite crear, editar y eliminar usuarios del sistema",
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

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      throw new Error(
        error ||
          `Error al ${submitString.toLowerCase()} el usuario.`
      );  
    }
  };

  const columns = useMemo( () => [
    {
      accessorKey: "id",
      header: "ID",
      size: 75,
    },
    {
      accessorKey: "full_name",
      header: "Nombre",
      size: 310,
    },
 
    {
      accessorKey: "email",
      header: "Correo Electrónico",
      size: 200,
    },

    {
      accessorKey: "allow_handle_users",
      header: "Gestión de Usuarios",
      size: 180,
      Cell: ({ cell }) => cell.getValue() ? <Icon className="text-color2" icon="iconamoon:check-fill" width={20} height={20} /> :  <Icon className="text-red-300" icon="line-md:close" width={18} height={17} />,
    },

    {
      accessorKey: "status",
      header: "Estado",
      size: 180,
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
              setFormData({ ...row.original });
              setSubmitString("Actualizar");
            }}
            className="mx-1 p-1 hover:p-2 duration-75 text-gray-500 hover:bg-blue-100 hover:text-color3 rounded-full"

            title="Editar"
          >

            <Icon icon="material-symbols:edit" width={20} height={20} />
          </button>
        </div>
      ),
    }

  ]);
  const [rowData, setRowData] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await usersAPI.getAllUsers();
      console.log(res.data);
      setRowData(res.data.users);
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
          <h1 className="text-lg md:text-2xl font-bold mb-2 md:mb-0">Gestión de Usuarios</h1>
          <FuturisticButton
            onClick={() => {
              if (submitString === "Actualizar") {
                setSubmitString("Crear");
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
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReusableForm
              fields={userFormFields}
              onSubmit={onSubmit}
              onCancel={() => {
                setFormData(structuredClone(defaultFormData));
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
            initialState={{ pagination: { pageSize: 5 } }}
            muiTablePaginationProps={{
              rowsPerPageOptions: [5, 10, 20],
              showFirstButton: true,
              showLastButton: true,
            }}
          />
        </div>
      </div>
    </>
  );
}
