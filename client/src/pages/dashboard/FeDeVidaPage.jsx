import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { API_URL } from "../../config/env.js";

import {
  liveProofAPI,
  ASICAPI,
  censusAPI,
  nominaNamesAPI,
} from "../../services/api.js";
import externalApi from "../../services/saludfalcon.api.js";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal.jsx";
import FuturisticButton from "../../components/FuturisticButton.jsx";
import FormField from "../../components/forms/FormField.jsx";
import { CircularProgress } from "@mui/material";
import { useFeedback } from "../../context/FeedbackContext.jsx";
import { MaterialReactTable } from "material-react-table";
import Planilla from "../../components/planilla.jsx";
import debounce from "lodash.debounce";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import withoutPhoto from "../../assets/withoutPhoto.webp";
import { cities } from "../../constants/cities.js";
import municipalitiesWithParishes from "../../constants/municipalitiesWithParishes.js";
import typePensions from "../../constants/type_pensions.js";
import PrintPage from "../../components/report.jsx";

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

export default function FeDeVidaPage() {
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess, showInfo } = useFeedback();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [PDFmodal, setPDFmodal] = useState(false);
  const [isCensusModalOpen, setIsCensusModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [PDFdata, setPDFdata] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [reportData, setReportData] = useState({});
  const [resultsToken, setResultsToken] = useState(null);
  const [origins, setOrigins] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [printButtonId, setPrintButtonId] = useState(null);
  const [administrativeLocations, setAdministrativeLocations] = useState([]);
  const [typePaySheets, setTypePaySheets] = useState([]);
  const { user } = useAuth();
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const galleryInputRef = useRef(null);
  const photoOptionsRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fetchInitialData = useCallback(async () => {
    try {
      const asics = await ASICAPI.getASIC();
      // Transform API response to match select component format { value, label }
      const formattedLocations = asics.map((location) => ({
        value: location.id,
        label: location.name,
      }));
      setAdministrativeLocations(formattedLocations);

      const type_personnel = await nominaNamesAPI.get();
      const formattedTypePersonnel = type_personnel.map((type) => ({
        value: type.id,
        label: type.name,
      }));
      setTypePaySheets(formattedTypePersonnel);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  }, []);
  // Form configuration for ReusableForm

  console.log(administrativeLocations)
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Close photo options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        photoOptionsRef.current &&
        !photoOptionsRef.current.contains(event.target)
      ) {
        setShowPhotoOptions(false);
      }
    };

    if (showPhotoOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPhotoOptions]);

  // Open camera using MediaDevices API
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setCameraStream(stream);
      setShowCameraModal(true);
      setShowPhotoOptions(false);

      // Wait for next render to ensure video element exists
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      showError("No se pudo acceder a la cámara. " + error.message);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          const file = new File([blob], `photo_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setFormData({
            ...formData,
            photo: file,
            fotoChanged: submitString === "Actualizar" ? true : false,
          });
          stopCamera();
        },
        "image/jpeg",
        0.95,
      );
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

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
    to_census: false,
    status: "inactive", // Siempre inactive para fe de vida
    // Datos personales
    photo: "",
    nac: "V",
    ci: "",
    full_name: "",
    date_birth: "",
    sex: "F",
    city: "Coro",
    state: "Falcón",
    asic_id: 1,
    phone_number: "",
    email: "",
    municipality: "",
    parish: "",
    address: "",
    civil_status: "C",
    receive_pension_from_another_organization_status: false,
    has_authorizations: true,
    pension_survivor_status: false,
    suspend_payment_status: false,
    is_resident: false,

    // Nuevo campo para tipo de personal
    type_personnel_id: 1,

    // Datos que van en additional_data
    type_pension: "Jubilacion",
    last_charge: "",
    minor_child_nro: 0,
    disabled_child_nro: 0,
    another_organization_name: null,
    fullname_causative: null,
    age_causative: null,
    parent_causative: null,
    sex_causative: null,
    ci_causative: null,
    decease_date: null,
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
      name: "asic_id",
      label: "Ubicación administrativa (ASIC)",
      type: "select",
      options: administrativeLocations,
      required: true,
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
      type: "phone",
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
      options: typePensions,
      className: "col-span-5",
    },
    {
      name: "type_personnel_id",
      label: "Tipo de personal",
      type: "select",
      options: typePaySheets,
      className: "col-span-7",
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
       className: `${
        formData.receive_pension_from_another_organization_status ? "col-span-6" : "hidden"
      }`,
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
  ] , );

  const [submitString, setSubmitString] = useState("Registrar");
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Structure the data like PersonalActivoPage
      const submitData = {
        // Direct fields
        to_census: formData.to_census,
        type_personnel_id: formData.type_personnel_id,
        nac: formData.nac,
        ci: formData.ci,
        full_name: formData.full_name,
        date_birth: formData.date_birth,
        sex: formData.sex,
        civil_status: formData.civil_status,
        address: formData.address,
        phone_number: formData.phone_number,
        email: formData.email,
        municipality: formData.municipality,
        parish: formData.parish,
        state: formData.state,
        city: formData.city,
        asic_id: formData.asic_id,
        dependency_id: formData.dependency_id,
        administrative_unit_id: formData.administrative_unit_id,
        department_id: formData.department_id,
        service_id: formData.service_id,
        receive_pension_from_another_organization_status: formData.receive_pension_from_another_organization_status,
        has_authorizations: formData.has_authorizations,
        pension_survivor_status: formData.pension_survivor_status,
        suspend_payment_status: formData.suspend_payment_status,
        is_resident: formData.is_resident,
        // additional_data fields
        additional_data: {
          type_pension: formData.type_pension,
          last_charge: formData.last_charge,
          minor_child_nro: formData.minor_child_nro,
          disabled_child_nro: formData.disabled_child_nro,
          another_organization_name: formData.another_organization_name,
          fullname_causative: formData.fullname_causative,
          age_causative: formData.age_causative,
          parent_causative: formData.parent_causative,
          sex_causative: formData.sex_causative,
          ci_causative: formData.ci_causative,
          decease_date: formData.decease_date,
          last_payment: formData.last_payment,
        },
      };

      // Upload photo separately if changed
      if (formData.fotoChanged && formData.photo instanceof File) {
        const photoData = new FormData();
        photoData.append("photo", formData.photo);

        if (submitString === "Actualizar") {
          await liveProofAPI.updatePersonnelPhoto(formData.id, photoData);
        }
      }

      if (submitString === "Actualizar") {
        await liveProofAPI.updatePersonnel(formData.id, submitData);
        setSubmitString("Registrar");
      } else {
        // createPersonnel uses multipart/form-data (for photo on create),
        // so booleans must be sent as "1"/"0"
        await liveProofAPI.createPersonnel({
          ...submitData,
          to_census: submitData.to_census ? "1" : "0",
          status: "inactive",
          receive_pension_from_another_organization_status: submitData.receive_pension_from_another_organization_status ? "1" : "0",
          has_authorizations: submitData.has_authorizations ? "1" : "0",
          pension_survivor_status: submitData.pension_survivor_status ? "1" : "0",
          suspend_payment_status: submitData.suspend_payment_status ? "1" : "0",
          is_resident: submitData.is_resident ? "1" : "0",
        });
      }

      showSuccess("Operación completada con éxito");
      setFormData(structuredClone(defaultFormData));
      setIsModalOpen(false);
      setIsFormInitialized(false);
      fetchData();
      localStorage.removeItem("formData");
      localStorage.removeItem("submitString");
    } catch (error) {
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
      if (!window.confirm("¿Está seguro de eliminar este personal?")) {
        return;
      }
      const res = await liveProofAPI.deletePersonnel(id);
      if (res.status) {
        showSuccess("Personal eliminado con éxito");
      }
      fetchData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    }

    // Call your delete API or show a confirmation dialog
  };

  const handleCensus = async (id) => {
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

  const exportData = async () => {
    try {
      setLoading(true);
      const data = await censusAPI.exportCensus();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `censos_export_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showSuccess("Datos exportados exitosamente");
    } catch (error) {
      showError("Error al exportar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const jsonData = JSON.parse(e.target.result);
        const response = await censusAPI.importCensus(jsonData);
        showSuccess(
          `Importación exitosa: ${response.result.censuses_imported} censos y ${response.result.users_imported} usuarios procesados.`,
        );
        fetchData();
        setIsOptionsModalOpen(false);
      } catch (error) {
        showError("Error al importar datos: " + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
        // Clear input
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const getHistory = async (id) => {
    try {
      const res = await liveProofAPI.getPersonnelById(id);
      setHistoryData(res);
      setIsHistoryModalOpen(true);
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
    setLoading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      const res = await payrollAPI.importExcel(formData);
      showSuccess(res.message);
      fetchData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    }
    setLoading(false);
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
              width={50}
              height={50}
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
              width={50}
              height={50}
              loading="lazy"
            />
          ),
      },
      {
        accessorKey: "full_name",
        header: "Nombre completo",

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
        accessorKey: "status",
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
        accessorKey: "phone_number",
        header: "Teléfono",
        size: 100,
      },
      {
        accessorKey: "city",
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
        header: "Ubicación administrativa",
        accessorKey: "asic.name",
        size: 130,
        filterVariant: "select",
        enableColumnFilter: true,

        filterSelectOptions: administrativeLocations
          .map((location) => location.label)
          .concat("Sin asignar"),
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
                  setFormData({
                    ...cell.row.original,
                    to_census: false,
                    ...cell.row.original.additional_data,
                  });
                  setSubmitString("Actualizar");
                }}
                className="text-blue-500 p-1 rounded-full hover:bg-gray-300 hover:underline"
                title="Editar"
              >
                <Icon icon="material-symbols:edit" width={20} height={20} />
              </button>

              {/* {!cell.row.original..status ? (
                <button
                  onClick={() => {
                    setIsCensusModalOpen(true);
                    setPDFdata(cell.row.original);
                  }}
                  className="text-color2 p-1 rounded-full hover:bg-gray-300 hover:underline"
                  title="Censar"
                >
                  <Icon icon="ci:wavy-check" width={20} height={20} />
                </button>
              ) : (
                <div className="w-7 "></div>
              )} */}

              {cell.row.original.status ? (
                <button
                  onClick={() => {
                    getHistory(cell.row.original.id);
                  }}
                  className="text-gray-500 p-1 rounded-full hover:bg-gray-300 hover:underline"
                  title="Ver historial"
                >
                  <Icon
                    icon="material-symbols:history"
                    width={20}
                    height={20}
                  />
                </button>
              ) : (
                <div className="w-7"></div>
              )}

              {cell.row.original.status ? (
                <button
                  onClick={() => {
                    setPDFmodal(true);

                    setPDFdata({
                      ...cell.row.original,
                    });
                  }}
                  className="text-0 p-1 rounded-full hover:bg-gray-300 hover:underline"
                  title="Descargar"
                >
                  <Icon icon="proicons:pdf-2" width={20} height={20} />
                </button>
              ) : (
                <div className="w-7"></div>
              )}
              {user.is_admin ? (
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
              ) : null}
            </div>
          );
        },
      },
    ],
    [administrativeLocations],
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
      const res = await liveProofAPI.getPersonnel({
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
      setData(res.personnels.data);
      setRowCount(res.personnels.total);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
    setIsLoading(false);
  }, [pagination, sorting, columnFilters, globalFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateReport = async () => {
    try {
      const res = await payrollAPI.getReport();
      console.log(res);
      setReportData(res);
      setIsReportModalOpen(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    }
  };
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

  useEffect(() => {
    if (
      formData.type_pension == "Sobrevivencia" ||
      formData.type_pension == "Jubilado y sobreviviente"
    ) {
      setFormData((prev) => ({
        ...prev,
        pension_survivor_status: true,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        pension_survivor_status: false,
      }));
    }
  }, [formData.type_pension]);

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

  return (
    <>
      <title>Fe de vida - LabFalcón</title>
      <div style={{ height: 580, width: "100%" }}>
        <div className="md:flex fadeInUp justify-between items-center mb-4">
          <div>
            <h1 className="text-lg md:text-2xl font-bold mb-2 md:mb-0">
              Fe de vida
            </h1>
          </div>
          <div className="flex gap-3 z-50 relative">
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
                if (!user.is_admin) {
                  showInfo("Solo los administradores pueden usar esta función")
                  return
                }
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
              className={`flex  z-50 items-center ${
                isOptionsModalOpen
                  ? "bg-gray-200 text-gray-700 shadow-xl"
                  : "bg-gray-100 text-gray-600 "
              } pl-2 rounded-md`}
              onClick={() => setIsOptionsModalOpen(!isOptionsModalOpen)}
            >
              <Icon icon="tdesign:data-filled" width={24} height={24} />
              {isOptionsModalOpen ? (
                <Icon icon="material-symbols:close" width={24} height={24} />
              ) : (
                <Icon
                  icon="material-symbols:more-vert"
                  width={24}
                  height={24}
                />
              )}
            </button>
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
            className={`px-3 md:px-12 space-y-5 md:space-y-0 gap-7 w-full relative`}
            onSubmit={onSubmit}
          >
            <div className="space-y-3 z-10 md:sticky top-0 h-max mb-24">
              <h2 className="text-xl font-bold mb-2 col-span-2  ">
                Datos personales
              </h2>

              <div className="md:grid space-y-3 md:grid-cols-12 gap-4">
                {patientFormFields.map((field, index) => {
                  if (field.name == "photo") {
                    return (
                      <div
                        key={field.name + "_" + field.label + index}
                        className="mb-5 md:col-span-12 flex justify-center  pb-4 mx-auto relative"
                      >
                        <div
                          ref={photoOptionsRef}
                          className="mx-auto text-gray-600 text-sm"
                        >
                          <div
                            onClick={() =>
                              setShowPhotoOptions(!showPhotoOptions)
                            }
                            className="bg-gray-200 mt-1 rounded-md w-36 h-44 flex items-center justify-center cursor-pointer hover:bg-gray-400 duration-150"
                          >
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
                                className="w-full h-full object-cover rounded-md"
                                width={144}
                                height={176}
                                loading="lazy"
                              />
                            ) : null}
                            {formData.photo &&
                            submitString === "Actualizar" &&
                            !formData.fotoChanged ? (
                              <img
                                src={API_URL + "/storage/" + formData.photo}
                                alt="preview"
                                className="w-full h-full object-cover rounded-md"
                                width={144}
                                height={176}
                                loading="lazy"
                              />
                            ) : null}
                          </div>

                          {/* Photo Options Menu */}
                          {showPhotoOptions && (
                            <div className="absolute z-50 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                              <button
                                type="button"
                                onClick={openCamera}
                                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 rounded-t-lg"
                              >
                                <Icon
                                  icon="mdi:camera"
                                  className="w-5 h-5 text-color1"
                                />
                                <span>Tomar foto</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  galleryInputRef.current?.click();
                                  setShowPhotoOptions(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 rounded-b-lg border-t border-gray-200"
                              >
                                <Icon
                                  icon="mdi:image"
                                  className="w-5 h-5 text-color1"
                                />
                                <span>Subir desde galería</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Gallery Input */}
                        <input
                          ref={galleryInputRef}
                          type="file"
                          name="photo-gallery"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setFormData({
                                ...formData,
                                photo: e.target.files[0],
                                fotoChanged:
                                  submitString === "Actualizar" ? true : false,
                              });
                            }
                          }}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <>
                        {field.name == "type_pension" && (
                          <>
                            <div
                              className={`md:col-span-12 flex gap-3 items-center ${
                                formData.to_census ? "bg-gray-200" : ""
                              } p-2 rounded-xl`}
                            >
                              <FormField
                                key="to_census"
                                name="to_census"
                                label="Censar al guardar"
                                type="checkbox"
                                value={formData.to_census}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    to_census: e.target.checked,
                                  })
                                }
                              />
                              <Icon
                                icon="ci:wavy-check"
                                width={20}
                                className="text-color2 inline-block"
                                height={20}
                              />
                            </div>
                            {formData.to_census && (
                              <div className="md:col-span-12 flex items-center">
                                <h2 className="text-xl min-w-56 mt-3 font-bold mb-2">
                                  Datos de la pensión
                                </h2>
                                <hr className="w-full h-0.5 flex-auto bg-gray-300" />
                              </div>
                            )}
                          </>
                        )}

                        {field.name == "pension_survivor_status" &&
                        formData.to_census ? (
                          <>
                            <div className="md:col-span-12 flex items-center">
                              <h2 className="text-xl min-w-56 mt-3 font-bold mb-2">
                                Pensión sobrevivencia
                              </h2>
                              <hr className="w-full h-0.5 flex-auto bg-gray-300" />
                            </div>
                            <div className="md:col-span-12">
                              {!formData.pension_survivor_status ? (
                                <p> No aplica</p>
                              ) : null}
                            </div>
                          </>
                        ) : index < 14 || formData.to_census ? (
                          <FormField
                            key={field.name}
                            {...field}
                            value={formData[field.name]}
                            onChange={handleChangeValue}
                          />
                        ) : null}
                      </>
                    );
                  }
                })}
              </div>
            </div>

            <div className="md:col-span-12">
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  className={`px-16 py-4 gap-2 flex items-center justify-center min-w-80 rounded-md font-semibold ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    formData.to_census
                      ? submitString == "Actualizar"
                        ? "bg-gradient-to-r from-color4 to-color2 text-color1 hover:from-color4 hover:to-color2"
                        : "bg-gradient-to-r from-color1 to-color2 text-color4 hover:from-color1 hover:to-color2"
                      : submitString == "Actualizar"
                        ? "bg-color4 text-color1 hover:bg-color3"
                        : "bg-color1 text-color4 hover:bg-color3"
                  }`}
                >
                  <span>{loading ? "Procesando..." : submitString} </span>

                  {formData.to_census && !loading && (
                    <span className="flex gap-1 items-center">
                      {" "}
                      y Censar{" "}
                      <Icon icon="ci:wavy-check" width={20} height={20} />
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Camera Modal */}
        <Modal
          isOpen={showCameraModal}
          onClose={stopCamera}
          title="Tomar Foto"
          size="lg"
        >
          <div className="flex flex-col items-center gap-4 p-4">
            <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                title="Rotar cámara"
                onClick={() => setIsFrontCamera(!isFrontCamera)}
                className="px-8 py-3 text-white bg-black/10 p-6 gap-2 absolute right-0 bottom-10"
              >
                <Icon icon="f7:camera-rotate" className="w-5 h-5" />
              </button>
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-8 py-3 bg-color1 text-white rounded-md hover:bg-color3 flex items-center gap-2"
              >
                <Icon icon="mdi:camera" className="w-5 h-5" />
                Capturar Foto
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="px-8 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>

        {!isModalOpen && (
          <div
            className="ag-theme-alpine z-40 ag-grid-no-border"
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
                    city: false,
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
                rowsPerPageOptions={user?.is_admin ? [25, 50, 100] : []}
                muiTablePaginationProps={{
                  rowsPerPageOptions: user.is_admin ? [25, 50, 100] : [],
                  showFirstButton: user.is_admin ? true : false,
                  showLastButton: user.is_admin ? true : false,
                  className: !user.is_admin ? "hide-rows-per-page" : "",
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
            // setPDFdata(false);
          }}
        >
          <div className="flex flex-col justify-center">
            <Planilla data={PDFdata} isHidden={false} />
          </div>
        </Modal>

        {/* <Modal
          title={`Censar a ${PDFdata.full_name}`}
          isOpen={isCensusModalOpen}
          onClose={() => setIsCensusModalOpen(false)}
        >
          <div>
            {PDFdata..status && (
              <div>
                <h5 className="font-bold">ÚLTIMO CENSO</h5>
                <p>
                  <b>Realizado el </b>
                  {new Date(PDFdata..created_at).toLocaleString(
                    navigator.language,
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  )}
                </p>
                <p>
                  <b>Registrado por </b>
                  {PDFdata..user?.full_name},
                  {PDFdata..user?.charge}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-4 justify-between mt-4">
            {PDFdata..status && (
              <button
                onClick={() => handleUncensus(PDFdata.id)}
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
        </Modal> */}

        <Modal
          title={`Historial de censos de ${historyData?.full_name}`}
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        >
          <ul>
            {historyData?.censuses?.map((census, index) => (
              <li
                key={census.id}
                className=" rounded overflow-hidden  bg-gray-100 mb-2.5"
              >
                <div className="flex rounded-xl  bg-gray-200 justify-between">
                  <p className="text-color4 w-10 p-4 flex items-center justify-center bg-color1 text-sm">
                    {index + 1}
                  </p>
                  <div className="p-3 text-center">
                    {census.status ? (
                      <p className="text-color2 text-sm font-semibold mb-3">
                        CENSO VIGENTE
                      </p>
                    ) : null}
                    <p className="flex gap-3">
                      <b>
                        {" "}
                        <Icon
                          icon="mingcute:time-line"
                          width={20}
                          height={20}
                        />{" "}
                      </b>
                      {new Date(census.created_at).toLocaleString(
                        navigator.language,
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </p>
                    <p className="flex gap-3 mt-2 text-sm">
                      <b>
                        <Icon
                          icon="material-symbols:person"
                          width={20}
                          height={20}
                        />{" "}
                      </b>
                      {census.data.user.full_name}, {census.data.user.charge}
                    </p>
                  </div>

                  <div>
                    {/* <Planilla data={census} isHidden={false} /> */}
                    <button
                      onClick={() => {
                        setPDFdata({
                          ...census.data,
                          status: census.status,
                        });
                        setPDFmodal(true);
                      }}
                      className="flex items-center justify-center h-full bg-gray-300 hover:shadow-xl hover:brightness-110 rounded-xl rounded-l-none p-2 px-3"
                    >
                      <Icon icon="proicons:pdf-2" width={30} height={30} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Modal>

        <Modal
          isOpen={isOptionsModalOpen}
          title="Mas opciones"
          size="md"
          onClose={() => setIsOptionsModalOpen(false)}
        >
          <div
            className={`px-4   z-50 top-12 w-full flex flex-col  rounded-md   ${
              isOptionsModalOpen ? "block" : "hidden"
            }`}
          >
            <button
              className="items-center flex p-2 py-2.5 hover:bg-gray-300 gap-2 rounded-md"
              onClick={generateReport}
            >
              <Icon icon="material-symbols:download" width={24} height={24} />
              <span>Generar Reporte de Censados por ASIC </span>
              <Icon icon="tabler:pdf" width={24} height={24} />
            </button>
            <button
              className="items-center flex p-2 py-2.5 hover:bg-gray-300 gap-2 rounded-md"
              onClick={exportData}
            >
              <Icon icon="material-symbols:download" width={24} height={24} />
              <span>Exportar Datos</span>
              <Icon icon="tabler:json" width={24} height={24} />
            </button>
            <label
              htmlFor="importJSON"
              className="cursor-pointer items-center flex p-2 py-2.5 hover:bg-gray-300 gap-2 rounded-md"
            >
              <Icon
                icon="streamline-ultimate:common-file-text-add-bold"
                width={24}
                height={24}
              />
              <span>Importar Datos</span>
              <Icon icon="tabler:json" width={24} height={24} />
              <input
                type="file"
                name="importJSON"
                id="importJSON"
                className="hidden"
                accept=".json"
                onChange={importData}
              />
            </label>
            <label
              htmlFor="importExcel"
              className="cursor-pointer items-center flex p-2 py-2.5 hover:bg-gray-300 gap-2 rounded-md"
            >
              <Icon
                icon="streamline-ultimate:common-file-text-add-bold"
                width={24}
                height={24}
              />
              <span>Importar Fe de vida desde Excel</span>
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
            {loading ? (
              <div className="flex w-full items-center gap-2">
                <Icon
                  icon="eos-icons:loading"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
                <span>Subiendo...</span>
              </div>
            ) : null}
          </div>
        </Modal>

        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title="Reporte de Censados por ASIC"
          size="full"
        >
          <PrintPage data={reportData} year={new Date().getFullYear()} />
        </Modal>
      </div>
    </>
  );
}
