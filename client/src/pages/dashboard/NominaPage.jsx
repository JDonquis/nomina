import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { API_URL } from "../../config/env.js";

import {
  payrollAPI,
  asicAPI,
  censusAPI,
  typePaySheetsAPI,
} from "../../services/api";
import externalApi from "../../services/saludfalcon.api";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal";
import FuturisticButton from "../../components/FuturisticButton";
import FormField from "../../components/forms/FormField";
import { CircularProgress } from "@mui/material";
import { useFeedback } from "../../context/FeedbackContext";
import { MaterialReactTable } from "material-react-table";
import Planilla from "../../components/planilla";
import debounce from "lodash.debounce";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import withoutPhoto from "../../assets/withoutPhoto.png";
import { cities } from "../../constants/cities";
import municipalitiesWithParishes from "../../constants/municipalitiesWithParishes";

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
      [onChange, testKey],
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
  },
);

export default function NominaPage() {
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess, showInfo } = useFeedback();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [PDFmodal, setPDFmodal] = useState(false);
  const [isCensusModalOpen, setIsCensusModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [PDFdata, setPDFdata] = useState({});
  const [resultsToken, setResultsToken] = useState(null);
  const [origins, setOrigins] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [printButtonId, setPrintButtonId] = useState(null);
  const [administrativeLocations, setAdministrativeLocations] = useState([]);
  const [typePaySheets, setTypePaySheets] = useState([]);
  const { user } = useAuth();

  const fetchInitialData = useCallback(async () => {
    try {
      const administrative_locations = await asicAPI.getASIC();
      // Transform API response to match select component format { value, label }
      const formattedLocations = administrative_locations.map((location) => ({
        value: location.id,
        label: location.name,
      }));
      setAdministrativeLocations(formattedLocations);

      const type_pay_sheets = await typePaySheetsAPI.getPaySheets();
      const formattedTypePaySheets = type_pay_sheets.map((type_pay_sheet) => ({
        value: type_pay_sheet.id,
        label: type_pay_sheet.name,
      }));
      setTypePaySheets(formattedTypePaySheets);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  }, []);
  // Form configuration for ReusableForm

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

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

  const defaultFormData = {
    // Datos personales
    photo: "",
    nac: "V",
    ci: "",
    full_name: "",
    date_birth: "",
    sex: "F",
    city: "Coro",
    state: "Falcón",
    administrative_location_id: 1,
    phone_number: "",
    email: "",
    municipality: "",
    parish: "",
    address: "",

    // Datos de pensión
    type_pension: "Jubilacion",
    type_pay_sheet_id: 1,
    last_charge: "",
    civil_status: "C",
    minor_child_nro: 0,
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
    fotoChanged: false,
  };

  const [formData, setFormData] = useState(structuredClone(defaultFormData));

  const patientFormFields = useMemo(() => [
    {
      name: "photo",
      label: "Foto",
      type: "file",
      required: false,
      className: "col-span-6",
    },
    {
      name: "nac",
      label: "Nacionalidad",
      type: "select",
      options: [
        { value: "V", label: "V" },
        { value: "E", label: "E" },
      ],
      className: "col-span-2",
    },
    {
      name: "ci",
      label: "Cédula de Identidad",
      type: "number",
      required: true,
      className: "col-span-4",
    },
    {
      name: "full_name",
      label: "Nombres y Apellidos",
      type: "text",
      required: true,
      className: "col-span-6",
    },
    {
      name: "date_birth",
      label: "Fecha de Nacimiento",
      type: "date",
      required: true,
      className: "col-span-6",
    },

    {
      name: "sex",
      label: "Sexo *",
      type: "select",
      options: [
        { value: "M", label: "Masculino" },
        { value: "F", label: "Femenino" },
      ],
      className: "col-span-6",
    },
    {
      name: "administrative_location_id",
      label: "Ubicación administrativa",
      type: "select",
      required: false,
      options: administrativeLocations,
      className: "col-span-6",
    },
    {
      name: "city",
      label: "Ciudad",
      type: "select",
      options: cities,
      required: false,
      className: "col-span-6",
    },
    {
      name: "state",
      label: "Estado",
      type: "text",
      required: false,
      className: "col-span-6",
    },
    {
      name: "phone_number",
      label: "Teléfono",
      type: "text",
      required: false,
      className: "col-span-6",
    },
    {
      name: "email",
      label: "Correo Electrónico",
      type: "email",
      required: false,
      className: "col-span-6",
    },
    {
      name: "municipality",
      label: "Municipio",
      type: "select",
      required: false,
      options: Object.keys(municipalitiesWithParishes).map((municipality) => ({
        value: municipality,
        label: municipality,
      })),
      className: "col-span-6",
    },
    {
      name: "parish",
      label: "Parroquia",
      type: "select",
      options: municipalitiesWithParishes[formData.municipality] || [],
      required: false,
      className: "col-span-6",
    },
    {
      name: "address",
      label: "Dirección",
      type: "text",
      required: false,
      className: "col-span-6",
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
      className: "col-span-6",
    },
    {
      name: "type_pay_sheet_id",
      label: "Nombre de nómina",
      type: "select",
      options: typePaySheets,
      className: "col-span-6",
    },
    {
      name: "last_charge",
      label: "Último Cargó",
      type: "text",
      required: false,
      className: "col-span-6",
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
      className: "col-span-6",
    },
    {
      name: "minor_child_nro",
      label: "Nro. de Hijos Menores",
      type: "number",
      required: false,
      className: "col-span-6",
    },
    {
      name: "disabled_child_nro",
      label: "Nro. de Hijos Discapacitados",
      type: "number",
      required: false,
      className: "col-span-6",
    },
    {
      name: "receive_pension_from_another_organization_status",
      label: "Recibe Pensión de Otra Organización",
      type: "checkbox",
      required: false,
      className: "col-span-6",
    },
    {
      name: "another_organization_name",
      label: "Nombre de la Otra Organización",
      type: "text",
      required: false,
      className: "col-span-6",
    },
    {
      name: "has_authorizations",
      label: "Tiene Autorizaciones",
      type: "checkbox",
      required: false,
      className: "col-span-6",
    },

    // Pensión sobrevivencia
    {
      name: "pension_survivor_status",
      label: "Pensión Sobrevivencia",
      type: "checkbox",
      required: false,
      className: "col-span-6",
    },
    {
      name: "fullname_causative",
      label: "Nombre Completo del Causante",
      type: "text",
      required: false,
      className: `${
        formData.pension_survivor_status ? "col-span-6" : "hidden"
      }`,
    },
    {
      name: "age_causative",
      label: "Edad del Causante",
      type: "number",
      required: false,
      className: `${
        formData.pension_survivor_status ? "col-span-6" : "hidden"
      }`,
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
      className: `${
        formData.pension_survivor_status ? "col-span-6" : "hidden"
      }`,
    },
    {
      name: "sex_causative",
      label: "Sexo del Causante",
      type: "select",
      options: [
        { value: "M", label: "Masculino" },
        { value: "F", label: "Femenino" },
      ],
      className: `${
        formData.pension_survivor_status ? "col-span-6" : "hidden"
      }`,
    },
    {
      name: "ci_causative",
      label: "Cédula de Identidad del Causante",
      type: "text",
      required: false,
      className: `${
        formData.pension_survivor_status ? "col-span-6" : "hidden"
      }`,
    },
    {
      name: "decease_date",
      label: "Fecha de Fallecimiento",
      type: "date",
      required: false,
      className: `${
        formData.pension_survivor_status ? "col-span-6" : "hidden"
      }`,
    },
    {
      name: "suspend_payment_status",
      label: "¿Pago suspendido?",
      type: "checkbox",
      required: false,
      className: `${
        formData.pension_survivor_status ? "col-span-6" : "hidden"
      }`,
    },
    {
      name: "last_payment",
      label: "Último Pago",
      type: "date",
      required: false,
      className: `${
        formData.pension_survivor_status ? "col-span-6" : "hidden"
      }`,
    },
  ]);

  const [submitString, setSubmitString] = useState("Registrar");
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear FormData para enviar archivos
      const submitData = new FormData();

      // Lista de campos que NO deben enviarse (son relaciones o campos internos)
      const fieldsToSkip = [
        "type_pay_sheet", // Relación, ya tienes type_pay_sheet_id
        "administrative_location", // Relación, ya tienes administrative_location_id
        "latest_census", // Relación
        "latestCensus", // Relación
        "created_at", // Timestamp automático
        "updated_at", // Timestamp automático
        "fotoChanged", // Campo interno de React
      ];

      // Agregar todos los campos del formulario
      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        // Skip campos innecesarios
        if (fieldsToSkip.includes(key)) {
          return;
        }

        // No enviar photo si no cambió
        if (
          key === "photo" &&
          submitString === "Actualizar" &&
          !formData.fotoChanged
        ) {
          return; // Skip this field
        }

        // Solo agregar archivos
        if (value instanceof File) {
          console.log("✅ Agregando File:", key, value);
          submitData.append(key, value);
        }
        // Para booleanos, convertir a 0 o 1
        else if (typeof value === "boolean") {
          submitData.append(key, value ? "1" : "0");
        }
        // NO enviar objetos ni arrays (solo valores primitivos)
        else if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          typeof value !== "object" // Esto excluye objetos y arrays
        ) {
          submitData.append(key, value);
        }
        // DEBUG: Ver qué se está saltando
      });

      if (
        formData.photo &&
        submitString === "Actualizar" &&
        formData.fotoChanged
      ) {
        await payrollAPI.updatePhoto(formData.id, submitData);

        // Eliminar el campo photo para evitar confusión en la siguiente petición
        submitData.delete("photo");
      }
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

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("¿Está seguro de eliminar esta nómina?")) {
        return;
      }
      const res = await payrollAPI.deleteWorker(id);
      if (res.status) {
        showSuccess("Trabajador eliminado con éxito");
      }
      console.log(res.status);
      fetchData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    }

    // Call your delete API or show a confirmation dialog
  };

  const handleCensus = async (id) => {
    if (
      !window.confirm(`¿Está seguro de Censar a ${PDFdata.full_name} ahora?`)
    ) {
      return;
    }

    try {
      await censusAPI.createCensus({ pay_sheet_id: id });
      showSuccess("Censo realizado con éxito");
      fetchData();
      setIsCensusModalOpen(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    }
  };

  const handleUncensus = async (id) => {
    if (
      !window.confirm(
        `¿Está seguro de anular el censo de ${PDFdata.full_name}?`,
      )
    ) {
      return;
    }
    try {
      await censusAPI.deleteCensus(id);
      showSuccess("Censo anulado con éxito");
      fetchData();
      setIsCensusModalOpen(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    }
  };

  const importExcel = async (e) => {
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      const res = await payrollAPI.importExcel(formData);
      showSuccess(res.message);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
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
        Cell: ({ cell }) =>
          cell.getValue() ? (
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
          ) : (
            <img
              src={withoutPhoto}
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
        accessorKey: "latest_census.status",
        size: 100,
        filterVariant: "select",
        filterSelectOptions: ["CENSADO", "NO CENSADO"],
        enableColumnFilter: true,
        enableSorting: true,
        Cell: ({ cell }) => {
          return cell.getValue() ? (
            <p className="text-color2 text-xs font-semibold">CENSADO</p>
          ) : (
            <p className="text-dark/75 text-xs ">NO CENSADO</p>
          );
        },
      },

      //   {
      //     accessorKey: "email",
      //     header: "Correo Electrónico",
      //     size: 200,
      //   },
      {
        accessorKey: "latest_census.phone_number",
        header: "Teléfono",
        size: 100,
      },
      {
        accessorKey: "latest_census.city",
        header: "Ciudad",
        size: 100,
        filterVariant: "select",
        filterSelectOptions: cities.map((city) => city.label),
        enableColumnFilter: true,
        enableSorting: true,
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
        header: "Tipo de Pensión",
        accessorKey: "latest_census.type_pension",
        size: 100,
        filterVariant: "select",
        filterSelectOptions: ["Jubilación", "Incapacidad", "Sobrevivencia"],
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        header: "Acciones",
        accessorKey: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ cell }) => {
          return (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  console.log(cell.row.original);
                  setFormData({
                    ...cell.row.original,
                    ...cell.row.original.latest_census,
                  });
                  setSubmitString("Actualizar");
                }}
                className="text-blue-500 p-1 rounded-full hover:bg-gray-300 hover:underline"
                title="Editar"
              >
                <Icon icon="material-symbols:edit" width={20} height={20} />
              </button>

              {cell.row.original.latest_census?.status && (
                <button
                  onClick={() => {
                    setPDFmodal(true);
                    setPDFdata({
                      ...cell.row.original,
                      ...cell.row.original.latest_census,
                    });
                  }}
                  className="text-0 p-1 rounded-full hover:bg-gray-300 hover:underline"
                  title="Descargar"
                >
                  <Icon icon="proicons:pdf-2" width={20} height={20} />
                </button>
              )}
              <button
                onClick={() => handleDelete(cell.row.original.id)}
                className="text-red-500 ml-auto p-1 rounded-full hover:bg-gray-300 hover:underline "
                title="Eliminar"
              >
                <Icon
                  icon="material-symbols:delete-outline"
                  width={20}
                  height={20}
                />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

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
        per_page: user.is_admin ? pagination.pageSize : 1,
        sortField: sorting[0]?.id || "id",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        search: globalFilter, // Global search
        filters: JSON.stringify(
          columnFilters.reduce((acc, curr) => {
            acc[curr.id] = curr.value;
            return acc;
          }, {}),
        ),
      });
      setData(res.paySheets.data);
      setRowCount(res.paySheets.total);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
    setIsLoading(false);
  }, [pagination, sorting, columnFilters, globalFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  console.log({ user });
  // Create debounced function once
  const debouncedSaveFormData = useMemo(
    () =>
      debounce((data, submitStr) => {
        // Excluir el campo photo porque File no se puede serializar a JSON
        const { photo, ...dataWithoutPhoto } = data;
        localStorage.setItem("formData", JSON.stringify(dataWithoutPhoto));
        localStorage.setItem("submitString", JSON.stringify(submitStr));
      }, 300),
    [],
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
    [],
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

  console.log({ formData });
  return (
    <>
      <title>Nómina - LabFalcón</title>
      <div style={{ height: 580, width: "100%" }}>
        <div className="md:flex justify-between items-center mb-4">
          <div>
            <h1 className="text-lg md:text-2xl font-bold mb-2 md:mb-0">
              Nómina
            </h1>
          </div>
          <div className="flex gap-3 relative">
            {isThereLocalStorageFormData && (
              <button
                title="Restaurar formulario sin guardar"
                className="hover:shadow-lg hover:bg-gray-100 flex gap-1 items-center text-gray-600 bg-gray-200 rounded-xl font-bold px-3"
                onClick={() => {
                  setFormData(JSON.parse(localStorage.getItem("formData")));
                  setSubmitString(
                    JSON.parse(localStorage.getItem("submitString")),
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

            <button
              title="más opciones"
              className={`flex  items-center ${isOptionsModalOpen ? "bg-gray-200 text-gray-700 shadow-xl" : "bg-gray-100 text-gray-600 "} pl-2 rounded-md`}
              onClick={() => setIsOptionsModalOpen(!isOptionsModalOpen)}
            >
              <Icon icon="tdesign:data-filled" width={24} height={24} />
              <Icon icon="material-symbols:more-vert" width={24} height={24} />
            </button>

            <div
              className={`px-4 absolute right-0 z-50 top-12 w-96 flex flex-col py-4  bg-gray-200 rounded-md shadow-xl border border-gray-100 ${isOptionsModalOpen ? "block" : "hidden"}`}
            >
              <p className="p-2 text-sm text-gray-500">Opciones</p>
              <button className="items-center flex p-2 py-2.5 hover:bg-white gap-2 rounded-md">
                <Icon icon="material-symbols:download" width={24} height={24} />
                <span>Exportar Datos</span>
                <Icon icon="tabler:json" width={24} height={24} />
              </button>
              <button className="items-center flex p-2 py-2.5 hover:bg-white gap-2 rounded-md">
                <Icon
                  icon="streamline-ultimate:common-file-text-add-bold"
                  width={24}
                  height={24}
                />
                <span>Importar Datos</span>
                <Icon icon="tabler:json" width={24} height={24} />
              </button>
              <label
                htmlFor="importExcel"
                className="cursor-pointer items-center flex p-2 py-2.5 hover:bg-white gap-2 rounded-md"
              >
                <Icon
                  icon="streamline-ultimate:common-file-text-add-bold"
                  width={24}
                  height={24}
                />
                <span>Importar Nómina desde Excel</span>
                <Icon
                  icon="vscode-icons:file-type-excel"
                  width={24}
                  height={24}
                />
                <input
                  type="file"
                  name="importExcel"
                  id="importExcel"
                  className="hidden"
                  accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) => {
                    if (
                      window.confirm(
                        e.target.files[0].name +
                          "   ¿Desea añadir los datos de este excel a la nómina?",
                      )
                    ) {
                      importExcel(e);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            // Opcional: también limpiar localStorage aquí si quieres
          }}
          title={
            submitString === "Actualizar"
              ? "Actualizar Trabajador"
              : "Registrar Trabajador"
          }
          size="xl"
        >
          <form
            className={`px-12 space-y-5 md:space-y-0 gap-7 w-full relative`}
            onSubmit={onSubmit}
          >
            <div className="space-y-3 z-10 md:sticky top-0 h-max mb-24">
              {submitString === "Actualizar" &&
                formData.latest_census?.status && (
                  <div className="bg-gray-200 p-3 rounded-xl text-center">
                    <h5 className="font-bold">ÚLTIMO CENSO</h5>
                    <p>
                      <b>Realizado el </b>
                      {new Date(
                        formData.latest_census?.created_at,
                      ).toLocaleString(navigator.language, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p>
                      <b>Registrado por </b>
                      {formData.latest_census?.user?.full_name},<span> </span>
                      {formData.latest_census?.user?.charge}
                    </p>
                  </div>
                )}
              <h2 className="text-xl font-bold mb-2 col-span-2  ">
                Datos personales
              </h2>

              <div className="grid grid-cols-12 gap-4">
                {patientFormFields.map((field, index) => {
                  if (field.name == "photo") {
                    return (
                      <div
                        key={field.name + "_" + field.label + index}
                        className="mb-5 col-span-12 flex justify-center  pb-4 mx-auto"
                      >
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
                            {(formData.photo && submitString === "Registrar") ||
                            formData.fotoChanged ? (
                              <img
                                src={URL.createObjectURL(formData.photo)}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                            {formData.photo &&
                            submitString === "Actualizar" &&
                            !formData.fotoChanged ? (
                              <img
                                src={API_URL + "/storage/" + formData.photo}
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
                              fotoChanged:
                                submitString === "Actualizar" ? true : false,
                            })
                          }
                        />
                      </div>
                    );
                  } else {
                    return (
                      <>
                        {field.name == "type_pension" && (
                          <div className="col-span-12 flex items-center">
                            <h2 className="text-xl min-w-56 mt-3 font-bold mb-2">
                              Datos de la pensión
                            </h2>
                            <hr className="w-full h-0.5 flex-auto bg-gray-300" />
                          </div>
                        )}

                        {field.name == "pension_survivor_status" ? (
                          <>
                            <div className="col-span-12 flex items-center">
                              <h2 className="text-xl min-w-56 mt-3 font-bold mb-2">
                                Pensión sobrevivencia
                              </h2>
                              <hr className="w-full h-0.5 flex-auto bg-gray-300" />
                            </div>
                            <div className="col-span-12">
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

            <div className="col-span-12">
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
                //pagination only when is admin
                // enablePagination={user.is_admin}
                manualPagination
                manualSorting
                manualFiltering
                manualGlobalFilter
                initialState={{
                  density: "compact",
                  columnVisibility: {
                    created_at: false,
                  },
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
                rowsPerPageOptions={user.is_admin ? [25, 50, 100] : []}
                muiTablePaginationProps={{
                  rowsPerPageOptions: user.is_admin ? [25, 50, 100] : [],
                  showFirstButton: user.is_admin ? true : false, 
                  showLastButton: user.is_admin ? true : false, 
                    className: !user.is_admin ? 'hide-rows-per-page' : '',
                
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
          title="Planilla"
          isOpen={PDFmodal}
          size="xl"
          onClose={() => {
            setResultsToken(null);
            setPDFmodal(false);
            setPDFdata(false);
          }}
        >
          <div className="flex flex-col justify-center">
            <Planilla data={PDFdata} isHidden={false} />
          </div>
        </Modal>

        <Modal
          title="Censar"
          isOpen={isCensusModalOpen}
          onClose={() => setIsCensusModalOpen(false)}
        >
          <div>
            {PDFdata.latest_census?.status && (
              <div>
                <h5 className="font-bold">ÚLTIMO CENSO</h5>
                <p>
                  <b>Realizado el </b>
                  {new Date(PDFdata.latest_census?.created_at).toLocaleString(
                    navigator.language,
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  )}
                </p>
                <p>
                  <b>Registrado por </b>
                  {PDFdata.latest_census?.user?.full_name},
                  {PDFdata.latest_census?.user?.charge}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-4 justify-between mt-4">
            {PDFdata.latest_census?.status && (
              <button
                onClick={() => handleUncensus(PDFdata.latest_census.id)}
                className="bg-gray-300 hover:shadow-xl hover:brightness-110 rounded-xl p-3 px-5"
              >
                Anular el censo
              </button>
            )}
            <div></div>
            <button
              onClick={() => handleCensus(PDFdata.id)}
              className="bg-color2 hover:shadow-xl hover:brightness-110 text-white rounded-xl p-3 px-5"
            >
              Censar al usuario
            </button>
          </div>
        </Modal>
      </div>
    </>
  );
}
