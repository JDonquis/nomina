import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";


import { API_URL } from "../../config/env.js";

import { payrollAPI, asicAPI, censusAPI } from "../../services/api";
import externalApi from "../../services/saludfalcon.api";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal";
import FuturisticButton from "../../components/FuturisticButton";
import FormField from "../../components/forms/FormField";
import { CircularProgress } from "@mui/material";
import { useFeedback } from "../../context/FeedbackContext";
import { MaterialReactTable } from "material-react-table";
import planilla from "../../components/planilla";
import debounce from "lodash.debounce";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const cities = [
  { value: "Coro", label: "Coro" },
  { value: "Punto Fijo", label: "Punto Fijo" },
  { value: "Tucacas", label: "Tucacas" },
  { value: "Dabajuro", label: "Dabajuro" },
  { value: "La Sierra", label: "La Sierra" },
];

const iconos_examenes = {
  1: { icon: "mdi:blood-bag", color: "#C62828" },
  2: { icon: "mdi:test-tube", color: "#1565C0" },
  3: { icon: "mdi:water", color: "#6A1B9A" },
  4: { icon: "mdi:virus", color: "#EF6C00" },
  5: { icon: "mdi:emoticon-poop", color: "#6D4C41" },
  6: { icon: "game-icons:liver", color: "#00897B" },
  7: { icon: "mdi:beaker", color: "#FBC02D" },
};

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

export default function ExamenesPage() {
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess, showInfo } = useFeedback();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isMessageSentModalOpen, setIsMessageSentModalOpen] = useState(false);
  const [messageData, setMessageData] = useState({});
  const [resultsToken, setResultsToken] = useState(null);
  const [origins, setOrigins] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [printButtonId, setPrintButtonId] = useState(null);
  const [administrativeLocations, setAdministrativeLocations] = useState([]);
  const [typePaySheets, setTypePaySheets] = useState([]);
  const { user } = useAuth();
  

  const fetchInitialData = useCallback(async () => {
    try {
      const administrative_locations = await asicAPI.getASIC()
      // Transform API response to match select component format { value, label }
      const formattedLocations = administrative_locations.map(location => ({
        value: location.id,
        label: location.name
      }));
      setAdministrativeLocations(formattedLocations)

      const type_pay_sheets = await typePaySheets.getPaySheets()
      const formattedTypePaySheets = type_pay_sheets.map(type_pay_sheet => ({
        value: type_pay_sheet.id,
        label: type_pay_sheet.name
      }));
      setTypePaySheets(formattedTypePaySheets)
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  }, []);
  // Form configuration for ReusableForm

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  console.log(administrativeLocations)
  {
    /* 
    
    // Datos personales
    "nac": "V",
    "ci": "12345678",
    "full_name": "María Elena Rodríguez Pérez",
    "date_birth": "1975-05-15",
    "sex": "F",
    "city": "Caracas",
    "state": "Distrito Capital",
    "administrative_location_id": 1,
    "phone_number": "+584141234567",
    
    // Datos de pensión
    "type_pension": "Jubilacion",
    "type_pay_sheet_id": 1,
    "last_charge": "Jefe de Departamento",
    "civil_status": "C",
    "minor_child_nro": 2,
    "disabled_child_nro": 0,
    "receive_pension_from_another_organization_status": false,
    "another_organization_name": null,
    "has_authorizations": true,
    
    // Pensión sobrevivencia (condicional - en este caso false)
    "pension_survivor_status": false,
    "fullname_causative": null,
    "age_causative": null,
    "parent_causative": null,
    "sex_causative": null,
    "ci_causative": null,
    "decease_date": null,
    "suspend_payment_status": false,
    "last_payment": null
    */
  }
  const patientFormFields = useMemo(() => [
    {
      name: "photo",
      label: "Foto",
      type: "file",
      required: false,
      className: "col-span-1",
    },
    {
      name: "nac",
      label: "Nacionalidad",
      type: "select",
      options: [
        { value: "V", label: "V" },
        { value: "E", label: "E" },
      ],
      className: "col-span-1",
    },
    {
      name: "ci",
      label: "Cédula de Identidad",
      type: "text",
      required: true,
      className: "col-span-1",
    },
    {
      name: "full_name",
      label: "Nombres y Apellidos",
      type: "text",
      required: true,
      className: "col-span-1",
    },
    {
      name: "date_birth",
      label: "Fecha de Nacimiento",
      type: "date",
      required: true,
      className: "col-span-1",
    },

    {
      name: "sex",
      label: "Sexo *",
      type: "select",
      options: [
        { value: "M", label: "Masculino" },
        { value: "F", label: "Femenino" },
      ],
      className: "col-span-1",
    },
    {
      name: "administrative_location",
      label: "Ubicación administrativa",
      type: "select",
      required: false,
      options: administrativeLocations,
      className: "col-span-1",
    },
    {
      name: "city",
      label: "Ciudad",
      type: "select",
      options: cities,
      required: false,
      className: "col-span-1",
    },
    {
      name: "state",
      label: "Estado",
      type: "text",
      required: false,
      className: "col-span-1",
    },
    {
      name: "phone_number",
      label: "Teléfono",
      type: "text",
      required: false,
      className: "col-span-1",
    },
    // Datos de la pénsion:
    {
      name: "type_pension",
      label: "Tipo de Pensión",
      type: "select",
      options: [
        { value: "Jubilacion", label: "Jubilación" },
        { value: "Incapacidad", label: "Incapacidad" },
        { value: "Sobrevivencia", label: "Sobrevivencia" },
      ],
    },
    {
      name: "type_pay_sheet_id",
      label: "Tipo de Cuenta",
      type: "select",
      options: typePaySheets,
      className: "col-span-1",
    },
    {
      name: "last_charge",
      label: "Último Cargó",
      type: "text",
      required: false,
      className: "col-span-1",
    },
    {
      name: "civil_status",
      label: "Estado Civil",
      type: "select",
      options: [
        { value: "S", label: "Soltero" },
        { value: "C", label: "Casado" },
        { value: "V", label: "Viudo" },
      ],
      className: "col-span-1",
    },
    {
      name: "minor_child_nro",
      label: "Nro. de Hijos Menores",
      type: "number",
      required: false,
      className: "col-span-1",
    },
    {
      name: "disabled_child_nro",
      label: "Nro. de Hijos Discapacitados",
      type: "number",
      required: false,
      className: "col-span-1",
    },
    {
      name: "receive_pension_from_another_organization_status",
      label: "Recibe Pensión de Otra Organización",
      type: "checkbox",
      required: false,
      className: "col-span-1",
    },
    {
      name: "another_organization_name",
      label: "Nombre de la Otra Organización",
      type: "text",
      required: false,
      className: "col-span-1",
    },
    {
      name: "has_authorizations",
      label: "Tiene Autorizaciones",
      type: "checkbox",
      required: false,
      className: "col-span-1",
    },

    // Pensión sobrevivencia
    {
      name: "pension_survivor_status",
      label: "Pensión Sobrevivencia",
      type: "checkbox",
      required: false,
      className: "col-span-1",
    },
    {
      name: "fullname_causative",
      label: "Nombre Completo del Causante",
      type: "text",
      required: false,
      className: "col-span-1",
    },
    {
      name: "age_causative",
      label: "Edad del Causante",
      type: "number",
      required: false,
      className: "col-span-1",
    },
    {
      name: "parent_causative",
      label: "Parentesco con el Causante",
      type: "select",
      options: [
        { value: "Padre", label: "Padre" },
        { value: "Madre", label: "Madre" },
        { value: "Conyuge", label: "Cónyuge" },
        { value: "Concubino", label: "Concubino" },
      ],
      className: "col-span-1",
    },
    {
      name: "sex_causative",
      label: "Sexo del Causante",
      type: "select",
      options: [
        { value: "M", label: "Masculino" },
        { value: "F", label: "Femenino" },
      ],
      className: "col-span-1",
    },
    {
      name: "ci_causative",
      label: "Cédula de Identidad del Causante",
      type: "text",
      required: false,
      className: "col-span-1",
    },
    {
      name: "decease_date",
      label: "Fecha de Fallecimiento",
      type: "date",
      required: false,
      className: "col-span-1",
    },
    {
      name: "suspend_payment_status",
      label: "Suspender Pago",
      type: "checkbox",
      required: false,
      className: "col-span-1",
    },
    {
      name: "last_payment",
      label: "Último Pago",
      type: "date",
      required: false,
      className: "col-span-1",
    },
  ]);

  const defaultFormData = {
    // Datos personales
    photo: "",
    nac: "V",
    ci: "12345678",
    full_name: "María Elena Rodríguez Pérez",
    date_birth: "",
    sex: "F",
    city: "Coro",
    state: "Falcón",
    administrative_location_id: 1,
    phone_number: "",

    // Datos de pensión
    type_pension: "Jubilacion",
    type_pay_sheet_id: 1,
    last_charge: "",
    civil_status: "C",
    minor_child_nro: 2,
    disabled_child_nro: 0,
    receive_pension_from_another_organization_status: false,
    another_organization_name: null,
    has_authorizations: true,

    // Pensión sobrevivencia (condicional - en este caso false)
    pension_survivor_status: false,
    fullname_causative: null,
    age_causative: null,
    parent_causative: null,
    sex_causative: null,
    ci_causative: null,
    decease_date: null,
    suspend_payment_status: false,
    last_payment: null,
  };

  const [formData, setFormData] = useState(structuredClone(defaultFormData));
  const [submitString, setSubmitString] = useState("Registrar");
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear FormData para enviar archivos
      const submitData = new FormData();

      // Agregar todos los campos del formulario
      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        if (value instanceof File) {
          // Archivos se agregan directamente
          submitData.append(key, value);
        } else if (Array.isArray(value) && value.length > 0) {
          // Arrays de objetos se envían como JSON string
          submitData.append(key, JSON.stringify(value));
        } else if (typeof value === "object" && value !== null) {
          // Objetos individuales también se envían como JSON string
          submitData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined && value !== "") {
          submitData.append(key, value);
        }
      });
      // Prepare both requestsF
      const internalRequest =
        submitString === "Actualizar"
          ? payrollAPI.updateWorker(formData.id, submitData)
          : payrollAPI.createWorker(submitData);

      await internalRequest;
      // Handle success
      if (submitString === "Actualizar") {
        setSubmitString("Registrar");
      }

      showSuccess("Operación completada con éxito");
      setFormData(structuredClone(defaultFormData));
      setIsModalOpen(false);
      setIsFormInitialized(false); // ← Desactivar guardado
      fetchData();
      localStorage.removeItem("formData"); // ← Limpiar
      localStorage.removeItem("submitString");
      // Optional: Log external API result
      if (!externalResponse.success) {
        console.warn("External system update failed (non-critical)");
        // You could show a non-blocking warning here if needed
      }
    } catch (error) {
      // This will only catch errors from the internal API
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el sistema principal";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        accessorKey: "full_name",
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
 
    ],
    []
  );

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("¿Está seguro de eliminar este examen?")) {
        return;
      }
      await payrollAPI.deleteExam(id);
      showSuccess("Examen eliminado con éxito");
      fetchData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    }

    // Call your delete API or show a confirmation dialog
  };

  const [data, setData] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Server-side state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  // Move useMemo outside the map - process all test sections at once

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await payrollAPI.getWorkers({
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
      });
      setData(res.paySheets.data);
      setRowCount(res.data.totalCount);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
    setIsLoading(false);
  }, [pagination, sorting, columnFilters, globalFilter]);







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

  const handleChangeValue = useCallback((e) => {
    const { name, value } = e.target;
    // if input is type checked
    if (e.target.type === "checkbox") {
      setFormData((prev) => ({
        ...prev,

        [name]: e.target.checked,
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,

      [name]: value,
    }));

    setIsFormInitialized(true); // ← Activar guardado automático
  }, []);

  return (
    <>
      <title>Nómina - LabFalcón</title>
      <div style={{ height: 580, width: "100%" }}>
        <div className="md:flex justify-between items-center mb-4">
          <h1 className="text-lg md:text-2xl font-bold mb-2 md:mb-0">Nómina</h1>
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
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            // Opcional: también limpiar localStorage aquí si quieres
          }}
          title="Registrar Trabajador"
          size="xl"
        >
          <form
            className={`px-4 space-y-5 md:space-y-0 gap-7 w-full relative`}
            onSubmit={onSubmit}
          >
            <div className="space-y-3 z-10 md:sticky top-0 h-max mb-24">
              <h2 className="text-xl font-bold mb-2 col-span-2  ">
                Datos personales
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {patientFormFields.map((field) => {
                  if (field.name == "photo") {
                    return (
                      <div key={field.name + field.label} className="mb-5 col-span-2 flex justify-center  pb-4 mx-auto">
                        <label
                          htmlFor="photo"
                          className="mx-auto text-gray-600 text-sm"
                        >
                          <div className="bg-gray-200 mt-1 rounded-md w-36 h-44 flex items-center justify-center cursor-pointer hover:bg-gray-400 duration-150">
                            {formData.photo ? null : (
                              <Icon
                                icon="tabler:photo-up"
                                className="w-20 h-20 text-gray-300"
                              />
                            )}
                            {formData.photo ? (
                              <img
                                src={URL.createObjectURL(formData.photo)}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                        </label>
                        <input
                          type="file"
                          name="photo"
                          id="photo"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              photo: e.target.files[0],
                            })
                          }
                        />
                      </div>
                    );
                  } else {
                    
                    return (
                      <>
                        {field.name == "type_pension" && (
                          <div className="col-span-2 flex items-center">
                            <h2 className="text-xl min-w-56 mt-3 font-bold mb-2">
                              Datos de la pensión
                            </h2>
                            <hr className="w-full h-0.5 flex-auto bg-gray-300" />
                          </div>
                        )}
  
                        {field.name == "pension_survivor_status" ? (
                          <>
                            <div className="col-span-2 flex items-center">
                              <h2 className="text-xl min-w-56 mt-3 font-bold mb-2">
                                Pensión sobrevivencia
                              </h2>
                              <hr className="w-full h-0.5 flex-auto bg-gray-300" />
                            </div>
                            <div className="col-span-2">
                              <FormField
                                key={field.name}
                                {...field}
                                value={formData[field.name]}
                                onChange={handleChangeValue}
                              />
                            </div>
                          </>
                        ) : (
                          <FormField
                            key={field.name}
                            {...field}
                            value={formData[field.name]}
                            onChange={handleChangeValue}
                          />
                        )}
                      </>
                    );
                  }
                })}
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  className={`px-16 py-3 rounded-md font-semibold hover:bg-color3 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    submitString == "Actualizar"
                      ? "bg-color4 text-color1"
                      : "bg-color1 text-color4"
                  }`}
                >
                  {loading ? "Procesando..." : submitString}
                </button>
              </div>
            </div>
          </form>
        </Modal>
        {!isModalOpen && (
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
                initialState={{
                  density: "compact",
                }}
                state={{
                  pagination,
                  sorting,
                  columnFilters,
                  globalFilter,
                  isLoading,
                }}
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
              />
            }
          </div>
        )}

        <Modal
          title="Documento de resultados"
          isOpen={isMessageModalOpen}
          size="xl"
          onClose={() => {
            setResultsToken(null);
            setIsMessageModalOpen(false);
            setMessageData(false);
          }}
        >
          {messageData?.all_validated && resultsToken == null && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          )}
          {((messageData?.all_validated && resultsToken != null) ||
            (messageData?.hasOwnProperty("all_validated") &&
              messageData?.all_validated == false)) && (
            <div className="flex flex-col justify-center">
              {messageData?.all_validated ? (
                <div className="flex gap-4 w-full justify-center mb-6">
                  <button
                    title="Enviar por correo"
                    onClick={() => loadingMessage || handleMessage()}
                    className={`${
                      messageData?.patient?.email.length > 9
                        ? ""
                        : "opacity-40 cursor-not-allowed"
                    } hover:bg-color1 w-60 hover:text-white duration-100 bg-gray-200 rounded-xl  p-3 px-4  flex items-center gap-2`}
                  >
                    {loadingMessage ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Icon
                        icon="line-md:email-twotone"
                        className="w-10 h-10"
                      ></Icon>
                    )}
                    <span className="text-sm">
                      {loadingMessage ? "Enviando..." : "Enviar por correo"}{" "}
                    </span>
                  </button>

                  <a
                    title="Enviar por WhatsApp"
                    onClick={() => {
                      setIsMessageModalOpen(false);
                      setIsMessageSentModalOpen(true);
                    }}
                    href={`https://wa.me/${(() => {
                      let phoneNumber =
                        messageData?.patient?.phone_number.replace(/[ -]/g, "");
                      if (!phoneNumber || phoneNumber.length < 9) return "";
                      // If number doesn't start with country code, add Venezuelan code
                      if (
                        !phoneNumber.startsWith("+") &&
                        !phoneNumber.startsWith("58")
                      ) {
                        phoneNumber = "58" + phoneNumber;
                      }
                      // Remove + if present since WhatsApp API doesn't need it
                      return phoneNumber.replace("+", "") || "";
                    })()}?text=Hola ${
                      messageData?.patient?.first_name
                    }, le escribimos desde el laboratorio de Secretaria de Salud Falcón, para informarle que sus resultados están listos y puede acceder a ellos en el siguiente enlace:%0A${
                      window.location.origin
                    }/results/${resultsToken || "cargando..."}`}
                    target="_blank"
                    className={`${
                      messageData?.patient?.phone_number.length > 9
                        ? ""
                        : "opacity-40 cursor-not-allowed"
                    } hover:bg-color1 w-60  hover:text-white duration-100 bg-gray-200 rounded-xl p-3 px-5  flex items-center gap-2`}
                  >
                    <Icon
                      icon="logos:whatsapp-icon"
                      className="w-10 h-10"
                    ></Icon>
                    <span className="text-sm">Enviar por WhatsApp</span>
                  </a>
                </div>
              ) : (
                <p className=" text-center mb-4">
                  El examen no está validado, no se puede enviar ni descargar el
                  documento
                </p>
              )}

              <planilla
                data={messageData}
                examinationTypes={examinationTypes}
                token={resultsToken}
                isHidden={false}
              />
            </div>
          )}
        </Modal>

        <Modal
          title="¿El mensaje de WhatsApp fue enviado?"
          isOpen={isMessageSentModalOpen}
          onClose={() => setIsMessageSentModalOpen(false)}
        >
          <p>
            A diferencia de enviar el mensaje por correo, con WhatsApp no
            sabemos si fue enviado o no, por lo tanto, necesitamos su
            confirmación.
          </p>
          <div className="flex gap-4 justify-between mt-4">
            <button
              onClick={() => setIsMessageSentModalOpen(false)}
              className="bg-gray-300 hover:shadow-xl hover:brightness-110 rounded-xl p-3 px-5"
            >
              No
            </button>
            <button
              onClick={() => handleWhatsAppMessageSent()}
              className="bg-color2 hover:shadow-xl hover:brightness-110 text-white rounded-xl p-3 px-5"
            >
              Sí, se envió
            </button>
          </div>
        </Modal>
      </div>
    </>
  );
}
