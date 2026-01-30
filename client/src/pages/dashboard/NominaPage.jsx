import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { payrollAPI } from "../../services/api";
import externalApi from "../../services/saludfalcon.api";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal";
import FuturisticButton from "../../components/FuturisticButton";
import FormField from "../../components/forms/FormField";
import { CircularProgress } from "@mui/material";
import { useFeedback } from "../../context/FeedbackContext";
import { MaterialReactTable } from "material-react-table";

import debounce from "lodash.debounce";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

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
  const { user } = useAuth();

  // Form configuration for ReusableForm

  {
    /* 
    
    $table->id();
            $table->enum('nac', ['V', 'E']);
            $table->string('ci');
            $table->string('full_name');
            $table->string('date_birth')->nullable();
            $table->string('sex')->nullable()->default('Sin asignar');
            $table->string('city')->nullable()->default('Sin asignar');
            $table->string('state')->default('Falcon');
            $table->foreignId('administrative_location')->nullable();
            $table->string('phone_number')->nullable();
            //Pension Data
            $table->enum('type_pension', ['Jubilacion', 'Incapacidad', 'Sobrevivencia']);
            $table->foreignId('type_pay_sheet_id');
            $table->string('last_charge')->nullable();
            $table->enum('civil_status', ['S', 'C', 'V']);
            $table->integer('minor_child_nro')->default(0);
            $table->integer('disabled_child_nro')->default(0);
            $table->boolean('receive_pension_from_another_organization_status')->default(false);
            $table->string('another_organization_name')->nullable();
            $table->boolean('has_authorizations')->default(false);
            // Pension Survived
            $table->string('fullname_causative')->nullable();
            $table->integer('age_causative')->nullable();
            $table->enum('parent_causative', ['Padre', 'Madre', 'Conyuge', 'Concubino'])->nullable();
            $table->enum('sex_causative', ['M', 'F']);
            $table->string('ci_causative')->nullable();
            $table->date('decease_date')->nullable();
            $table->boolean('suspend_payment_status')->default(false);
            $table->date('last_payment')->nullable();
            $table->$table->timestamps();
    */
  }
  const patientFormFields = useMemo(() => [
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
        { value: "Masculino", label: "Masculino" },
        { value: "Femenino", label: "Femenino" },
      ],
      className: "col-span-1",
    },
    {
      name: "city",
      label: "Ciudad",
      type: "text",
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
      name: "administrative_location",
      label: "Ubicación administrativa",
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
    {
      name: "is_censused",
      label: "Censado",
      type: "checkbox",
      required: false,
      helperText: false,
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
      name: "type_pension",
      label: "Tipo de Pensión",
      type: "select",
      options: [
        { value: "Jubilacion", label: "Jubilación" },
        { value: "Incapacidad", label: "Incapacidad" },
        { value: "Sobrevivencia", label: "Sobrevivencia" },
      ],
      className: "col-span-1",
    },
    {
      name: "type_pay_sheet_id",
      label: "Tipo de Cuenta",
      type: "select",
      options: [
        { value: "1", label: "Cuenta 1" },
        { value: "2", label: "Cuenta 2" },
        { value: "3", label: "Cuenta 3" },
      ],
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

    {
      name: "email",
      label: "Correo Electrónico",
      type: "email",
      required: false,
      className: "col-span-1",
    },

    {
      name: "address",
      label: "Dirección",
      type: "text",
      required: false,
      className: "col-span-1",
    },
  
    {
      name: "origin_id",
      label: "Procedencia *",
      type: "select",
      options: origins?.map((origin) => ({
        value: origin.id,
        label: origin.name,
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

  const [formData, setFormData] = useState(structuredClone(defaultFormData));
  const [submitString, setSubmitString] = useState("Registrar");
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare both requestsF
      const internalRequest =
        submitString === "Actualizar"
          ? payrollAPI.updateWorker(formData.id, formData)
          : payrollAPI.createWorker(formData);

      const externalRequest =
        formData.patient.patient_id === null
          ? externalApi.post("/patients", {
              // Map your formData to the external API's expected format
              id: formData.patient.patient_id,
              ...formData.patient,
              name: formData.patient.first_name,
            })
          : Promise.resolve({ success: true, skipped: true });

      // Execute both requests in parallel
      const [internalResponse, externalResponse] = await Promise.all([
        internalRequest,
      ]);

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
    [],
  );

  const handleMessage = async () => {
    if (messageData?.patient?.email.length < 5) {
      showError("El paciente no tiene correo electrónico");
      return;
    }
    setLoadingMessage(true);
    try {
      await examResultsAPI.sendExamResults(messageData);
      showSuccess("Mensaje enviado con éxito");
      setIsMessageModalOpen(false);
      setMessageData(null);
      fetchData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    }
    setLoadingMessage(false);
  };
  const handleWhatsAppMessageSent = async () => {
    try {
      await examResultsAPI.updateMessageStatus(messageData.id, "ENVIADO");
      setIsMessageSentModalOpen(false);
      setMessageData(null);
      fetchData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    }
  };

  const generateResultsToken = async (analysisId) => {
    try {
      const response = await examResultsAPI.generateToken({ analysisId });
      return response.data.token;
    } catch (error) {
      console.error("Error generating token:", error);
      return null;
    }
  };

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
          }, {}),
        ),
      });
      setData(res.data.exams);
      setRowCount(res.data.totalCount);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
    setIsLoading(false);
  }, [pagination, sorting, columnFilters, globalFilter]);

  const fetchInitialData = useCallback(async () => {
    try {
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

  const handleTestInputChange = useCallback((examination_type_id, event) => {
    const { name, value } = event.target;

    // Use immediate update for better UX, but debounce heavy operations
    setFormData((prev) => {
      // Early return if value hasn't changed
      if (
        prev.tests?.[examination_type_id]?.testValues?.[name]?.value === value
      ) {
        return prev;
      }

      const updatedTests = {
        ...prev.tests,
        [examination_type_id]: {
          ...prev.tests[examination_type_id],
          testValues: {
            ...prev.tests[examination_type_id].testValues,
            [name]: {
              ...prev.tests[examination_type_id].testValues[name],
              value,
            },
          },
        },
      };

      // Auto-calculate razon when tp_paciente or control_tp changes
      if (name === "tp_paciente" || name === "tp_control") {
        const tpPaciente =
          name === "tp_paciente"
            ? parseFloat(value)
            : parseFloat(
                updatedTests[examination_type_id].testValues?.tp_paciente
                  ?.value || 0,
              );
        const controlTp =
          name === "tp_control"
            ? parseFloat(value)
            : parseFloat(
                updatedTests[examination_type_id].testValues?.tp_control
                  ?.value || 0,
              );
        if (tpPaciente && controlTp && controlTp !== 0) {
          const razon = (tpPaciente / controlTp).toFixed(2);
          updatedTests[examination_type_id].testValues.razon = {
            ...updatedTests[examination_type_id].testValues.razon,
            value: razon,
          };
        }
      }

      // Auto-calculate diferencia when tpt_paciente or control_tpt changes
      if (name === "tpt_paciente" || name === "tpt_control") {
        const tptPaciente =
          name === "tpt_paciente"
            ? parseFloat(value)
            : parseFloat(
                updatedTests[examination_type_id].testValues?.tpt_paciente
                  ?.value || 0,
              );
        const controlTpt =
          name === "tpt_control"
            ? parseFloat(value)
            : parseFloat(
                updatedTests[examination_type_id].testValues?.tpt_control
                  ?.value || 0,
              );

        if (tptPaciente && controlTpt) {
          const diferencia = (tptPaciente - controlTpt).toFixed(2);
          updatedTests[examination_type_id].testValues.diferencia = {
            ...updatedTests[examination_type_id].testValues.diferencia,
            value: diferencia,
          };
        }
      }

      return {
        ...prev,
        tests: updatedTests,
      };
    });

    setIsFormInitialized(true); // ← Activar guardado automático
  }, []);

  const handleMethodChange = useCallback((examination_type_id, event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      return {
        ...prev,
        tests: {
          ...prev.tests,
          [examination_type_id]: {
            ...prev.tests[examination_type_id],
            method: value,
          },
        },
      };
    });

    setIsFormInitialized(true); // ← Activar guardado automático
  }, []);

  const handleObservationChange = useCallback((examination_type_id, event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      return {
        ...prev,
        tests: {
          ...prev.tests,
          [examination_type_id]: {
            ...prev.tests[examination_type_id],
            observation: value,
          },
        },
      };
    });

    setIsFormInitialized(true); // ← Activar guardado automático
  }, []);

  const handlePatientInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      patient: {
        ...prev.patient,
        [name]: value,
      },
    }));

    setIsFormInitialized(true); // ← Activar guardado automático
  }, []);

  const handleValidatedChange = useCallback((examTypeId, e) => {
    const checked = e.target.checked;
    setFormData((prev) => {
      const newTests = {
        ...prev.tests,
        [examTypeId]: {
          ...prev.tests[examTypeId],
          validated: checked,
        },
      };

      // Check if all exam types are validated
      const all_validated = Object.values(newTests).every(
        (test) => test.validated === true,
      );
      setIsFormInitialized(true); // ← Activar guardado automático

      return {
        ...prev,
        tests: newTests,
        all_validated: all_validated,
      };
    });
  }, []);

  const [prosecingSearchPatient, setProsecingSearchPatient] = useState(false);
  const searchPatient = debounce(async (ci) => {
    setProsecingSearchPatient(true); // Cambiar a verdadero antes de la búsqueda

    try {
      const res = await externalApi.get(`/patients?ci=${ci}`);
      if (res.data.data.data.length === 0) {
        setFormData((prev) => ({
          ...prev,
          patient: {
            ...prev.patient,
            patient_id: null,
          },
        }));
        return;
      } else {
        setFormData((prev) => ({
          ...prev,
          patient: {
            ...prev.patient,
            first_name: res.data.data.data[0]?.name,
            ...res.data.data.data[0],
            patient_id: res.data.data.data[0]?.id,
          },
        }));
      }
    } catch (err) {
      console.log(err);
    } finally {
      setProsecingSearchPatient(false); // Cambiar a falso después de la búsqueda
    }
  }, 280);

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
            className={` space-y-5 md:space-y-0 gap-7 w-full relative`}
            onSubmit={onSubmit}
          >
            <div className="space-y-3 z-10 md:sticky top-0 h-max">
              <h2 className="text-xl font-bold mb-2">Datos personales</h2>
              <div className="grid grid-cols-2 gap-4">
                {patientFormFields.map((field) => {
                  if (field.name === "ci") {
                    return (
                      <div key={field.name}>
                        <FormField
                          {...field}
                          value={formData.patient?.[field.name]}
                          onInput={(e) => {
                            formData.patient.patient_id = null;
                            handlePatientInputChange(e);
                            if (e.target.value.length >= 6) {
                              setProsecingSearchPatient(true);
                              searchPatient(e.target.value);
                            }
                          }}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <FormField
                        key={field.name}
                        {...field}
                        value={formData.patient?.[field.name]}
                        onChange={handlePatientInputChange}
                      />
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
                  className={`px-16 py-3 rounded-md font-semibold ${
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
                      {loadingMessage
                        ? "Enviando..."
                        : "Enviar por correo"}{" "}
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

              <PrintPage
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
