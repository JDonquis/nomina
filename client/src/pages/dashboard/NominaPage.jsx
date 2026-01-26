import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal";
import FuturisticButton from "../../components/FuturisticButton";
import FormField from "../../components/forms/FormField";
import { CircularProgress, Autocomplete, Box, TextField } from "@mui/material";
import { useFeedback } from "../../context/FeedbackContext";
import { MaterialReactTable } from "material-react-table";

import debounce from "lodash.debounce";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config/env";
import { useNavigate } from "react-router-dom";

let isThereLocalStorageFormData = localStorage.getItem("formData")
  ? true
  : false;
// Memoized component for test fields to prevent unnecessary re-renders
const MemoizedTestField = React.memo(
  ({ field, value, onChange, testKey, fieldName, id, multiline = false }) => {
    const handleChange = useCallback(
      (e) => {
        onChange(testKey, e);
      },
      [onChange, testKey]
    );

    return (
      <FormField
        key={fieldName + "_" + testKey}
        {...field}
        examination_type_id={testKey}
        value={value || ""}
        onChange={handleChange}
        id={id}
        multiline={multiline}
      />
    );
  },
  // Custom comparison function for better memoization
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.testKey === nextProps.testKey &&
      prevProps.fieldName === nextProps.fieldName &&
      JSON.stringify(prevProps.field) === JSON.stringify(nextProps.field)
    );
  }
);

export default function NominaPage({
  useForWorkTeam = false,
  workTeamId = null,
  employeeIdsObj = {},
  onSuccessTeam = () => {},
}) {
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess, showInfo } = useFeedback();
  const [isModalOpenCreateTeam, setIsModalOpenCreateTeam] = useState(false);
  const [isModalOpenSelectTeam, setIsModalOpenSelectTeam] = useState(false);
  const [messageData, setMessageData] = useState({});
  const [resultsToken, setResultsToken] = useState(null);
  const [examinationTypes, setExaminationTypes] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [workTeams, setWorkTeams] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [skills, setSkills] = useState([]);
  const navigate = useNavigate();

  console.log({ employeeIdsObj });
  // Form configuration for ReusableForm
  const patientFormFields = useMemo(() => [
    {
      name: "first_name",
      type: "text",
      required: true,
      className: "col-span-1",
    },
    {
      name: "last_name",
      type: "text",
      required: true,
      className: "col-span-1",
    },
    {
      name: "date_birth",
      type: "date",
      required: true,
      className: "col-span-1",
    },
    {
      name: "email",
      type: "email",
      required: false,
      className: "col-span-1",
    },
    {
      name: "phone_number",
      type: "text",
      required: false,
      className: "col-span-1",
    },
    {
      name: "address",
      type: "text",
      required: false,
      className: "col-span-1",
    },
    {
      name: "sex",
      type: "select",
      options: [],
      className: "col-span-1",
    },
    {
      name: "origin_id",
      type: "select",
      options: origins?.map((origin) => ({
        value: origin.id,
      })),
      className: "col-span-2",
    },
  ]);

  const defaultFormData = {
    patient: {
      ci: "",
      first_name: "",
      last_name: "",
      date_birth: "",
      email: "",
      phone_number: "",
      address: "",
      sex: "",
      patient_id: null,
    },
    all_validated: false,
    tests: {},
  };

  const [data, setData] = useState([]);
  const [formData, setFormData] = useState(structuredClone(defaultFormData));
  const [submitString, setSubmitString] = useState("Registrar");
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [openModalSkill, setOpenModalSkill] = useState(false);
  const [rowSelection, setRowSelection] = useState({});

  // Para obtener las filas seleccionadas
//   const selectedRowData = Object.keys(rowSelection)
//     .filter((key) => rowSelection[key])
//     .map((key) => data[parseInt(key)].id);
//   console.log("Filas seleccionadas:", selectedRowData);

  

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Cód",
        size: 60,
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "photo",
        header: "Foto",
        size: 110,
        filterFn: "includesString",
        enableColumnFilter: true,
        enableSorting: true,
        Cell: ({ cell }) => (
          <img
            src={API_URL + "/storage/" + cell.getValue()}
            alt="Profile"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "4px",
              objectFit: "cover",
            }}
            // This ensures the image is loaded before the print dialog opens
            loading="lazy"
          />
        ),
      },
      {
        accessorKey: "fullname",
        header: "Nombre completo",
        size: 110,
        filterFn: "includesString",
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "ci",
        header: "CI",
        size: 100,
        filterFn: "includesString",
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        header: "Censado",
        accessorKey: "is_censused",
        size: 100,
        filterFn: "includesString",
        enableColumnFilter: true,
        enableSorting: true,
      },
     
      //   {
      //     accessorKey: "email",
      //     header: "Correo Electrónico",
      //     size: 200,
      //   },
      {
        accessorKey: "phone_number",
        header: "Teléfono",
        size: 100,
      },
      {
        accessorKey: "localization",
        header: "Ubicación",
        size: 100,
      },
  

      {
        accessorKey: "created_at",
        header: "Fecha",
        size: 155,
        filterFn: "equals",

        enableColumnFilter: true,
        enableSorting: true,
        Cell: ({ cell }) => {
          const dateString = cell.getValue();

          // Safety check in case the value is null or undefined
          if (!dateString) return "N/A";

          return new Date(dateString).toLocaleString(navigator.language, {
            dateStyle: "medium",
            timeStyle: "short",
          });
        },
        // Optional: make the column look nicer
        muiTableBodyCellProps: {
          sx: { whiteSpace: "nowrap" },
        },
      },
      {
        accessorKey: "skills",
        header: "Habilidades",
        size: 100,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value.map((skill, i) => {
            return (
              <span
                title={`${
                  skill?.id == null ? "Crear nueva habilidad" : skill.name
                }`}
                className={`${
                  skill.id == null ? "bg-red-200 hover:bg-red-300" : ""
                } inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2`}
                key={skill.id + i + skill.name}
                onClick={(e) => {
                  if (skill.id == null) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Handle creation of new skill
                    setSelectedWorkerForNewSkill({
                      index: i,
                      skillName: skill.name,
                      worker: cell.row.original,
                    });
                    setOpenModalSkill(true);
                  }
                }}
              >
                {skill.id == null ? (
                  <Icon icon="mdi:plus" className="inline mr-1" />
                ) : null}
                {skill.name}
              </span>
            );
          });
        },
        enableSorting: false,
      },
    ],
    []
  );

 

  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Server-side state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [customFilters, setCustomFilters] = useState({});
  const [selectedWorkerForNewSkill, setSelectedWorkerForNewSkill] = useState(
    []
  );
  // Move useMemo outside the map - process all test sections at once

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await employeesAPI.getEmployees({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        sortField: sorting[0]?.id || "id",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        search: globalFilter, // Global search
        filters: JSON.stringify(
          columnFilters.reduce((acc, curr) => {
            acc[curr.id] = curr.value;
            return acc;
          }, {})
        ),
        ...customFilters,
      });
      setData(res.data);
      setRowCount(res.meta.total);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
    setIsLoading(false);
  }, [pagination, sorting, columnFilters, globalFilter, customFilters]);

  const fetchInitialData = useCallback(async () => {
    try {
      // const [examTypesRes, originsRes] = await Promise.all([
      //   examinationTypesAPI.getExaminationTypes(),
      //   originsAPI.getOrigins(),
      // ]);
      // setExaminationTypes(examTypesRes.data.examinationTypes);
      // setOrigins(originsRes.data.origins);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  }, []);





  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create debounced function once
  const debouncedSaveFormData = useMemo(
    () =>
      debounce((data, submitStr) => {
        localStorage.setItem("formData", JSON.stringify(data));
        localStorage.setItem("submitString", JSON.stringify(submitStr));
      }, 300),
    []
  );

  useEffect(() => {
    // Solo guardar si el formulario ya fue inicializado por el usuario
    if (isFormInitialized) {
      debouncedSaveFormData(formData, submitString);
    }
  }, [formData, debouncedSaveFormData, isFormInitialized]);

  // Debounced global filter handler
  const debouncedGlobalFilter = useMemo(
    () =>
      debounce((value) => {
        setGlobalFilter(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to first page
      }, 300),
    []
  );



  return (
    <>
      <title>Nomina </title>
      <div style={{ height: 580, width: "100%" }}>
        <div className="md:flex justify-between items-center mb-4">
          <h1 className="text-lg md:text-2xl font-bold mb-2 md:mb-0">
            Nomina
          </h1>
          <div className="flex gap-3">
            {isThereLocalStorageFormData && (
              <button
                title="Restaurar formulario sin guardar"
                className="hover:shadow-lg hover:bg-gray-100 flex gap-1 items-center text-gray-600 bg-gray-200 rounded-xl font-bold px-3"
                onClick={() => {
                  setFormData(JSON.parse(localStorage.getItem("formData")));
                  setSubmitString(
                    JSON.parse(localStorage.getItem("submitString"))
                  );
                  setIsModalOpen(true);
                }}
              >
                <small className="text-gray-500">Recuperar</small>
                <Icon
                  icon="line-md:backup-restore"
                  className="w-6 h-6 text-gray-500  "
                />
              </button>
            )}

             <FuturisticButton
              onClick={() => {
                setIsModalOpen(true);
                if (submitString === "Actualizar") {
                  setSubmitString("Registrar");
                  setFormData(structuredClone(defaultFormData));
                }
              }}
            >
              Registrar Trabajador
            </FuturisticButton> 
          </div>
        </div>

    

        <Modal
          isOpen={openModalSkill}
          onClose={() => {
            setOpenModalSkill(false);
            // Opcional: también limpiar localStorage aquí si quieres
          }}
          title="Crear habilidad"
          size="sm"
        >
          <form
            className={`space-y-5 md:space-y-0 gap-7 w-full relative`}
            onSubmit={(e) =>
              handleCreateSkill(
                selectedWorkerForNewSkill.index,
                selectedWorkerForNewSkill.skillName,
                selectedWorkerForNewSkill.worker,
                e
              )
            }
          >
            <FormField
              name="name"
              value={selectedWorkerForNewSkill.skillName}
              onChange={(e) =>
                setSelectedWorkerForNewSkill((prev) => ({
                  ...prev,
                  skillName: e.target.value,
                }))
              }
              required
            />
            <div className="col-span-2">
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  className={`px-16 py-3 rounded-md font-semibold ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  } ${"bg-color1 text-color4"}`}
                >
                  {loading ? "Procesando..." : "Crear"}
                </button>
              </div>
            </div>
          </form>
        </Modal>

        <div
          className="ag-theme-alpine ag-grid-no-border"
          style={{ height: 500 }}
        >
          {
            <MaterialReactTable
              columns={columns}
              data={data}
              rowCount={rowCount}
              manualPagination
              manualSorting
              manualFiltering
              manualGlobalFilter
              // Habilitar selección de filas
              enableRowSelection
              enableMultiRowSelection={true} // Permite seleccionar múltiples filas
              positionToolbarAlertBanner="top" // Muestra el contador de selección
              // Opcional: Selección inicial
              initialState={{
                density: "compact",
                columnVisibility: {
                  created_at: false,
                },
                rowSelection: {}, // Para selección inicial si es necesario
              }}
              // Estado para la selección
              state={{
                pagination,
                sorting,
                columnFilters,
                globalFilter,
                isLoading,
                rowSelection, // Añade esto
              }}
              // Handler para cambios en selección
              onRowSelectionChange={setRowSelection}
              onPaginationChange={setPagination}
              onSortingChange={setSorting}
              onColumnFiltersChange={setColumnFilters}
              onGlobalFilterChange={(value) => debouncedGlobalFilter(value)}
              enableGlobalFilter={true}
              enableColumnFilters={true}
              enableSorting={true}
              enableFilters={true}
              muiTablePaginationProps={{
                rowsPerPageOptions: [25, 50, 100],
                showFirstButton: true,
                showLastButton: true,
              }}
              muiSearchTextFieldProps={{
                placeholder: "Buscar",
                sx: { minWidth: "300px" },
                variant: "outlined",
              }}
              // Actualiza las props de las filas para manejar tanto click como checkbox
              muiTableBodyRowProps={({ row }) => ({
                onClick: (event) => {
                  // Evita que el click en el checkbox navegue
                  if (event.target.closest('input[type="checkbox"]')) {
                    return;
                  }
                  if (useForWorkTeam) {
                    return;
                  }
                  navigate(`/dashboard/trabajadores/${row.original.id}`);
                },
                sx: { cursor: "pointer" },
              })}
              // Estilos para los checkboxes
              muiSelectCheckboxProps={({ row }) => ({
                sx: {
                  // Ajusta según necesites
                },
              })}
              // Opcional: Personalizar la posición de las checkboxes
              positionActionsColumn="first" // 'first' o 'last', por defecto es 'first'
            />
          }
        </div>

       

     
        
      </div>
    </>
  );
}
