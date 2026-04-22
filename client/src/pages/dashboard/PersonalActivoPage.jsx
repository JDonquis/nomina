import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { produce } from "immer";

import { API_URL } from "../../config/env.js";
import {
  activePersonnelAPI,
  ASICAPI,
  dependenciesAPI,
  administrativeUnitsAPI,
  departmentAPI,
  servicesAPI,
  censusAPI,
  nominaNamesAPI,
} from "../../services/api.js";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal.jsx";
import FuturisticButton from "../../components/FuturisticButton.jsx";
import FormField from "../../components/forms/FormField.jsx";
import PlanillaPersonalActivo from "../../components/PlanillaPersonalActivo.jsx";
import { CircularProgress, Switch } from "@mui/material";
import { useFeedback } from "../../context/FeedbackContext.jsx";
import { MaterialReactTable } from "material-react-table";
import debounce from "lodash.debounce";
import { useAuth } from "../../context/AuthContext.jsx";
import withoutPhoto from "../../assets/withoutPhoto.webp";

const defaultFormData = {
  nac: "V",
  ci: "",
  full_name: "",
  date_birth: "",
  sex: "M",
  civil_status: "S",
  degree_obtained: "",
  undergraduate_degree: "",
  postgraduate_degree: "",
  address: "",
  email: "",
  mobile_phone: "",
  fixed_phone: "",
  shirt_size: "",
  pant_size: "",
  shoe_size: "",
  photo: "",
  status: false,
  payroll_dependency: "",
  asic_id: "",
  dependency_id: "",
  administrative_unit_id: "",
  department_id: "",
  service_id: "",
  payroll_code: "",
  payroll_name: "",
  entry_date: "",
  job_title: "",
  is_resident: false,
  level: "",
  university: "",
  shift: "",
  bank_account_number: "",
  job_code: "",
  work_status: "",
  observation: "",
  personnel_type: "",
  budget: "",
  laboral_relationship: "",
  position_code: "",
  grade: "",
  residency_type: "",
  fotoChanged: false,
  family_members: [],
};

const residencyTypeOptions = [
  { value: "Postgrado Universitario", label: "Postgrado Universitario" },
  { value: "RAPCE", label: "RAPCE" },
  { value: "Asistencial", label: "Asistencial" },
];

const universityOptionsList = [
  { value: "UNEFM", label: "UNEFM" },
  { value: "UCS", label: "UCS" },
];

const levelOptionsRAPCE = [
  { value: "R1", label: "R1" },
  { value: "R2", label: "R2" },
  { value: "R3", label: "R3" },
  { value: "R4", label: "R4" },
  { value: "R5", label: "R5" },
];

const shiftOptions = [
  { value: "7/1", label: "7/1" },
  { value: "1/7", label: "1/7" },
  { value: "7/7", label: "7/7" },
];

const work_status_options = [
  { value: "Abandono", label: "Abandono" },
  { value: "Activo", label: "Activo" },
  { value: "Activo Jubilables", label: "Activo Jubilables" },
  { value: "Apoyo Institucional", label: "Apoyo Institucional" },
  { value: "Comisión de Servicio", label: "Comisión de Servicio" },
  { value: "Inactivo Jubilables", label: "Inactivo Jubilables" },
  { value: "Pensionado por Invalidez", label: "Pensionado por Invalidez" },
  { value: "Permiso Gremial", label: "Permiso Gremial" },
  { value: "Permiso No Remunerado", label: "Permiso No Remunerado" },
  { value: "Permiso por Cuido", label: "Permiso por Cuido" },
  {
    value: "Permiso por Cuido (Más de Tres Permisos)",
    label: "Permiso por Cuido (Más de Tres Permisos)",
  },
  { value: "Permiso Remunerado", label: "Permiso Remunerado" },
  { value: "Permiso Sindical", label: "Permiso Sindical" },
  { value: "Personal con 14-08", label: "Personal con 14-08" },
  { value: "Proceso Administrativo", label: "Proceso Administrativo" },
  { value: "Reposo Médico", label: "Reposo Médico" },
  { value: "Vacaciones", label: "Vacaciones" },
];

const typePersonnelOptions = [
  { value: "Médico", label: "Médico" },
  { value: "Enfermero", label: "Enfermero" },
  { value: "Administrativo", label: "Administrativo" },
  { value: "Obrero", label: "Obrero" },
];

const budgetOptions = [
  { value: "MPPS - Falcón", label: "MPPS - Falcón" },
  { value: "MPPS - CCS", label: "MPPS - CCS" },
  { value: "Gobernación", label: "Gobernación" },
];

const laborRelationshipOptions = [
  { value: "Fijo", label: "Fijo" },
  { value: "Contratado", label: "Contratado" },
];

const defaultFamilyMember = {
  ci: "",
  full_name: "",
  date_birth: "",
  sex: "M",
  relationship: "",
  study_level: "",
  current_grade: "",
};

const relationshipOptions = [
  { value: "Hijo", label: "Hijo" },
  { value: "Hija", label: "Hija" },
  { value: "Esposa", label: "Esposa" },
  { value: "Esposo", label: "Esposo" },
  { value: "Madre", label: "Madre" },
  { value: "Padre", label: "Padre" },
  { value: "Hermano", label: "Hermano" },
  { value: "Hermana", label: "Hermana" },
  { value: "Otro", label: "Otro" },
];

const studyLevelOptions = [
  { value: "NINGUNO", label: "Ninguno" },
  { value: "PREESCOLAR", label: "Preescolar" },
  { value: "PRIMARIA", label: "Primaria" },
  { value: "SECUNDARIA", label: "Secundaria" },
  { value: "BACHILLERATO", label: "Bachillerato" },
  { value: "UNIVERSITARIO", label: "Universitario" },
  { value: "POSTGRADO", label: "Postgrado" },
];

export default function PersonalActivoPage() {
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess, showInfo } = useFeedback();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [PDFmodal, setPDFmodal] = useState(false);
  const [PDFdata, setPDFdata] = useState({});
  const { user } = useAuth();
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const photoOptionsRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const photoInputRef = useRef(null);

  const [asicOptions, setAsicOptions] = useState([]);
  const [asicRelations, setAsicRelations] = useState(null);
  const [dependencyOptions, setDependencyOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [censusStatus, setCensusStatus] = useState(true);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [nominasNames, setNominasNames] = useState([]);

  const [formData, setFormData] = useState(structuredClone(defaultFormData));
  const [submitString, setSubmitString] = useState("Registrar");
  const [editingId, setEditingId] = useState(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const asicRes = await ASICAPI.getASIC();
      setAsicOptions(
        asicRes.map((item) => ({ value: item.id, label: item.name })),
      );
      const nominas = await nominaNamesAPI.get();
      const formattedNominas = nominas.map((nomina) => ({
        value: nomina.id,
        label: `${nomina.code} | ${nomina.name} `,
        ...nomina,
        namesWithoutCode: nomina.name,
      }));
      setNominasNames(formattedNominas);
    } catch (e) {
      console.error("Failed to fetch initial data", e);
      showError("Error al cargar datos iniciales");
    }
  }, []);

  const fetchASICRelations = useCallback(async (asicId, forEdit = false) => {
    if (!asicId) {
      setAsicRelations(null);
      setDependencyOptions([]);
      setUnitOptions([]);
      setDepartmentOptions([]);
      setServiceOptions([]);
      return;
    }

    try {
      const res = await ASICAPI.getASICRelations(asicId);
      setAsicRelations(res);

      const deps = res.dependencies || [];
      setDependencyOptions(deps.map((d) => ({ value: d.id, label: d.name })));

      if (forEdit) {
        setUnitOptions(
          deps
            .flatMap((d) => d.administrative_units || [])
            .map((u) => ({ value: u.id, label: u.name })),
        );
        setDepartmentOptions(
          deps
            .flatMap((d) => d.administrative_units || [])
            .flatMap((u) => u.departments || [])
            .map((dept) => ({ value: dept.id, label: dept.name })),
        );
        setServiceOptions(
          deps
            .flatMap((d) => d.administrative_units || [])
            .flatMap((u) => u.departments || [])
            .flatMap((dept) => dept.services || [])
            .map((s) => ({ value: s.id, label: s.name })),
        );
        console.log("Relations loaded for edit:", {
          deps,
          units: res.dependencies.flatMap((d) => d.administrative_units || []),
          departments: res.dependencies
            .flatMap((d) => d.administrative_units || [])
            .flatMap((u) => u.departments || []),
          services: res.dependencies
            .flatMap((d) => d.administrative_units || [])
            .flatMap((u) => u.departments || [])
            .flatMap((dept) => dept.services || []),
        });
      } else {
        setUnitOptions([]);
        setDepartmentOptions([]);
        setServiceOptions([]);
      }
    } catch (e) {
      console.error("Failed to fetch ASIC relations", e);
      showError("Error al cargar relaciones del ASIC");
    }
  }, []);

  const handleASICChange = useCallback(
    (asicId) => {
      setFormData((prev) => ({
        ...prev,
        asic_id: asicId,
        dependency_id: "",
        administrative_unit_id: "",
        department_id: "",
        service_id: "",
      }));
      fetchASICRelations(asicId);
    },
    [fetchASICRelations],
  );

  const handleDependencyChange = useCallback(
    (dependencyId) => {
      if (!asicRelations) return;

      const dependency = asicRelations.dependencies?.find(
        (d) => d.id === Number(dependencyId),
      );
      const units = dependency?.administrative_units || [];

      setFormData((prev) => ({
        ...prev,
        dependency_id: dependencyId,
        administrative_unit_id: "",
        department_id: "",
        service_id: "",
      }));

      setUnitOptions(units.map((u) => ({ value: u.id, label: u.name })));
      setDepartmentOptions([]);
      setServiceOptions([]);
    },
    [asicRelations],
  );

  const handleUnitChange = useCallback(
    (unitId) => {
      if (!asicRelations) return;

      for (const dep of asicRelations.dependencies || []) {
        const unit = dep.administrative_units?.find(
          (u) => u.id === Number(unitId),
        );
        if (unit) {
          const depts = unit.departments || [];

          const autoSelectDept = depts.length === 1;
          const autoSelectService =
            autoSelectDept && depts[0].services?.length === 1;

          setFormData((prev) => ({
            ...prev,
            administrative_unit_id: unitId,
            department_id: autoSelectDept ? depts[0].id : "",
            service_id: autoSelectService ? depts[0].services[0].id : "",
          }));

          setDepartmentOptions(
            depts.map((d) => ({ value: d.id, label: d.name })),
          );

          if (autoSelectService) {
            setServiceOptions([
              {
                value: depts[0].services[0].id,
                label: depts[0].services[0].name,
              },
            ]);
          } else {
            setServiceOptions(
              depts
                .flatMap((d) => d.services || [])
                .map((s) => ({ value: s.id, label: s.name })),
            );
          }
          break;
        }
      }
    },
    [asicRelations],
  );

  const handleDepartmentChange = useCallback(
    (departmentId) => {
      if (!asicRelations) return;

      for (const dep of asicRelations.dependencies || []) {
        for (const unit of dep.administrative_units || []) {
          const dept = unit.departments?.find(
            (d) => d.id === Number(departmentId),
          );
          if (dept) {
            const servs = dept.services || [];
            const autoSelectService =
              servs.length === 1 &&
              servs[0].name.toLowerCase() === dept.name.toLowerCase();

            setFormData((prev) => ({
              ...prev,
              department_id: departmentId,
              service_id: autoSelectService ? servs[0].id : "",
            }));

            setServiceOptions(
              servs.map((s) => ({ value: s.id, label: s.name })),
            );
            break;
          }
        }
      }
    },
    [asicRelations],
  );

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

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

  const openCamera = (forField) => {
    const videoEl = videoRef;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        setCameraStream(stream);
        setShowCameraModal(true);
        setShowPhotoOptions(false);
        setTimeout(() => {
          if (videoEl.current) videoEl.current.srcObject = stream;
        }, 100);
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
        showError("No se pudo acceder a la cámara");
      });
  };

  const stopCamera = (forField) => {
    const stream = cameraStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setShowCameraModal(false);
  };

  const capturePhoto = (forField) => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;

    if (videoEl && canvasEl) {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      const context = canvasEl.getContext("2d");
      context.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

      canvasEl.toBlob(
        (blob) => {
          const file = new File([blob], `${forField}_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setFormData((prev) => ({
            ...prev,
            [forField]: file,
            fotoChanged: true,
          }));
          stopCamera(forField);
        },
        "image/jpeg",
        0.95,
      );
    }
  };

  useEffect(() => {
    return () => {
      if (cameraStream)
        cameraStream.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  const handleFullNameBlur = useCallback((e) => {
    const value = e.target.value;
    if (value) {
      setFormData((prev) => ({ ...prev, full_name: capitalizeWords(value) }));
    }
  }, []);

  const formFields = useMemo(
    () => [
      {
        name: "photo",
        label: "Foto",
        type: "file",
        required: false,
        className: "col-span-12 row-span-2 md:col-span-2",
      },
      {
        name: "nac",
        label: "Nac",
        type: "select",
        options: [
          { value: "V", label: "V" },
          { value: "E", label: "E" },
        ],
        className: "col-span-6 md:col-span-2",
      },
      {
        name: "ci",
        label: "Cédula de Identidad",
        type: "number",
        required: true,
        className: "col-span-4 md:col-span-3",
      },
      {
        name: "full_name",
        label: "Nombre Completo",
        type: "text",
        required: true,
        className: "col-span-5",
        onBlur: handleFullNameBlur,
      },
      {
        name: "date_birth",
        label: "Fecha de Nacimiento",
        type: "date",
        required: true,
        className: "col-span-12 md:col-span-3",
      },
      {
        name: "sex",
        label: "Sexo",
        type: "select",
        options: [
          { value: "M", label: "Masculino" },
          { value: "F", label: "Femenino" },
        ],
        className: "col-span-6 md:col-span-3",
      },
      {
        name: "civil_status",
        label: "Estado Civil",
        type: "select",
        options: [
          { value: "S", label: "Soltero" },
          { value: "C", label: "Casado" },
          { value: "V", label: "Viudo" },
          { value: "D", label: "Divorciado" },
        ],
        className: "col-span-6 md:col-span-3",
      },

      {
        name: "degree_obtained",
        label: "Nivel académico",
        type: "select",
        options: [
          { value: "No Bachiller", label: "No Bachiller" },
          { value: "Bachiller", label: "Bachiller" },
          {
            value: "Técnico Superior Universitario",
            label: "Técnico Superior Universitario",
          },
          { value: "Profesional", label: "Profesional" },
          { value: "Especialista", label: "Especialista" },
          { value: "Maestría", label: "Maestría" },
          { value: "Doctorado", label: "Doctorado" },
        ],
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "undergraduate_degree",
        label: "Pregrado",
        type: "text",
        required: false,
        className: `col-span-12 md:col-span-4 $`,
      },
      {
        name: "postgraduate_degree",
        label: "Postgrado",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "address",
        label: "Dirección de Habitación",
        type: "text",
        required: false,
        className: "col-span-12",
      },
      {
        name: "email",
        label: "Correo Electrónico",
        type: "email",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "mobile_phone",
        label: "Teléfono Móvil",
        type: "phone",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "fixed_phone",
        label: "Teléfono Fijo",
        type: "phone",
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "shirt_size",
        label: "Camisa",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-2",
      },
      {
        name: "pant_size",
        label: "Pantalón",
        type: "number",
        required: false,
        className: "col-span-12 md:col-span-2",
      },
      {
        name: "shoe_size",
        label: "Zapatos",
        type: "number",
        required: false,
        className: "col-span-12 md:col-span-2",
      },
      {
        name: "asic_id",
        label: "ASIC",
        type: "select",
        options: asicOptions,
        required: false,
        className: "col-span-12 md:col-span-6",
        onChangeCustom: handleASICChange,
      },
      {
        name: "dependency_id",
        label: "Dependencia",
        type: "select",
        options: dependencyOptions,
        required: false,
        disabled: !formData.asic_id,
        className: "col-span-12 md:col-span-6 mt-0",
        onChangeCustom: handleDependencyChange,
      },
      {
        name: "administrative_unit_id",
        label: "Unidad Administrativa",
        type: "select",
        options: unitOptions,
        required: false,
        disabled: !formData.dependency_id,
        className: "col-span-12 md:col-span-4",
        onChangeCustom: handleUnitChange,
      },
      {
        name: "department_id",
        label: "Departamento",
        type: "select",
        options: departmentOptions,
        required: false,
        disabled: !formData.administrative_unit_id,
        className: "col-span-12 md:col-span-4",
        onChangeCustom: handleDepartmentChange,
      },
      {
        name: "service_id",
        label: "Servicio",
        type: "select",
        options: serviceOptions,
        required: false,
        disabled: !formData.department_id,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "payroll_dependency",
        label: "Dependencia de Nómina",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-4",
      },

      {
        name: "type_personnel_id",
        label: "Nómina",
        type: "autocomplete",
        options: nominasNames,
        required: false,
        className: "col-span-12 md:col-span-8",
      },
      {
        name: "personnel_type",
        label: "Tipo de Personal",
        type: "text",
        readOnly: true,
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "budget",
        label: "Presupuesto",
        type: "text",
        required: false,
        readOnly: true,
        className: "col-span-12 md:col-span-4",
      },

      {
        name: "laboral_relationship",
        label: "Relación Laboral",
        type: "text",
        required: false,
        readOnly: true,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "entry_date",
        label: "Fecha de Ingreso",
        type: "date",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "job_title",
        label: "Título del Cargo",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "is_resident",
        label: "Es Residente",
        type: "checkbox",
        required: false,
        className: "col-span-12 md:col-span-3",
      },
      {
        name: "residency_type",
        label: "Tipo de Residencia",
        type: "select",
        options: residencyTypeOptions,
        required: formData.is_resident,
        className: `col-span-12 md:col-span-3 ${!formData.is_resident ? "hidden" : ""}`,
        onChangeCustom: (val) => {
          setFormData((prev) => ({
            ...prev,
            residency_type: val,
            university:
              val === "Postgrado Universitario" ? prev.university : "",
            level:
              val === "Postgrado Universitario" || val === "RAPCE"
                ? prev.level
                : "",
          }));
        },
      },
      {
        name: "university",
        label: "Universidad",
        type: "select",
        options: universityOptionsList,
        required:
          formData.is_resident &&
          formData.residency_type === "Postgrado Universitario",
        className: `col-span-12 md:col-span-3 ${!(formData.is_resident && formData.residency_type === "Postgrado Universitario") ? "hidden" : ""}`,
      },
      {
        name: "level",
        label: "Nivel",
        type: "select",
        options: levelOptionsRAPCE,
        required:
          formData.is_resident &&
          (formData.residency_type === "Postgrado Universitario" ||
            formData.residency_type === "RAPCE"),
        className: `col-span-12 md:col-span-3 ${!(formData.is_resident && (formData.residency_type === "Postgrado Universitario" || formData.residency_type === "RAPCE")) ? "hidden" : ""}`,
      },

      {
        name: "job_code",
        label: "Cód. Cargo",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-2",
      },
      {
        name: "shift",
        label: "Turno",
        type: "select",
        options: shiftOptions,
        required: false,
        className: "col-span-12 md:col-span-2",
      },

      {
        name: "position_code",
        label: "Cód. Puesto",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-2",
      },
      {
        name: "grade",
        label: "Grado",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-3",
      },
      {
        name: "bank_account_number",
        label: "Número de Cuenta Bancaria",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "work_status",
        label: "Estatus Laboral",
        type: "select",
        options: work_status_options,
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "observation",
        label: "Observaciones",
        type: "textarea",
        required: false,
        className: "col-span-12",
      },
    ],
    [
      asicOptions,
      nominasNames,
      dependencyOptions,
      unitOptions,
      departmentOptions,
      serviceOptions,
      handleASICChange,
      handleDependencyChange,
      handleUnitChange,
      handleDepartmentChange,
      formData.is_resident,
      formData.residency_type,
    ],
  );

  const handleChangeValue = useCallback((e) => {
    const { name, value } = e.target;
    if (e.target.type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: e.target.checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const capitalizeWords = (str) => {
    return str.replace(/(?:^|\s|-)[a-záéíóúñü]/gi, (match) =>
      match.toUpperCase(),
    );
  };

  console.log("Form data updated:", formData);

  const handleFieldChange = useCallback((e, field) => {
    if (field?.onChangeCustom) {
      field.onChangeCustom(e.target.value);
    } else {
      const { name, value } = e.target;
      if (e.target.type === "checkbox") {
        const isChecked = e.target.checked;
        setFormData((prev) => {
          const updated = { ...prev, [name]: isChecked };
          if (name === "is_resident" && !isChecked) {
            updated.residency_type = "";
            updated.university = "";
            updated.level = "";
          }
          return updated;
        });
      } else if (e.target.type === "autocomplete") {
        const selectedOption = e.target.selectedOption;
        setFormData((prev) => {
          const updated = { ...prev, [name]: value };
          // When type_personnel_id changes, also set personnel_type
          if (name === "type_personnel_id" && selectedOption) {
            updated.personnel_type = selectedOption.type_personal || "";
            updated.laboral_relationship =
              selectedOption.laboral_relationship || "";
            updated.budget = selectedOption.source_budget || "";
          }
          return updated;
        });
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Fields that are direct columns in the DB
      const submitData = {
        status: "active",
        to_census: censusStatus,
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
        address: formData.address,
        municipality: formData.municipality,
        parish: formData.parish,
        state: formData.state,
        city: formData.city,
        asic_id: formData.asic_id,
        dependency_id: formData.dependency_id,
        administrative_unit_id: formData.administrative_unit_id,
        department_id: formData.department_id,
        service_id: formData.service_id,
        receive_pension_from_another_organization_status:
          formData.receive_pension_from_another_organization_status,
        has_authorizations: formData.has_authorizations,
        pension_survivor_status: formData.pension_survivor_status,
        suspend_payment_status: formData.suspend_payment_status,
        is_resident: formData.is_resident,
        to_census: censusStatus,
        // Everything else goes into additional_data
        additional_data: {
          payroll_dependency: formData.payroll_dependency,
          payroll_code: formData.payroll_code,
          payroll_name: formData.payroll_name,
          entry_date: formData.entry_date,
          job_title: formData.job_title,
          residency_type: formData.residency_type,
          university: formData.university,
          level: formData.level,
          job_code: formData.job_code,
          shift: formData.shift,
          bank_account_number: formData.bank_account_number,
          personnel_type: formData.personnel_type,
          budget: formData.budget,
          laboral_relationship: formData.laboral_relationship,
          position_code: formData.position_code,
          grade: formData.grade,
          work_status: formData.work_status,
          observation: formData.observation,
          degree_obtained: formData.degree_obtained,
          undergraduate_degree: formData.undergraduate_degree,
          postgraduate_degree: formData.postgraduate_degree,
          mobile_phone: formData.mobile_phone,
          fixed_phone: formData.fixed_phone,
          shirt_size: formData.shirt_size,
          pant_size: formData.pant_size,
          shoe_size: formData.shoe_size,
          family_members: formData.family_members,
        },
      };

      // Upload photo separately if changed
      if (formData.fotoChanged && formData.photo instanceof File) {
        const photoData = new FormData();
        photoData.append("photo", formData.photo);

        if (submitString === "Actualizar") {
          await activePersonnelAPI.updatePersonnelPhoto(editingId, photoData);
        }
      }

      if (submitString === "Actualizar") {
        await activePersonnelAPI.updatePersonnel(editingId, submitData);
      } else {
        await activePersonnelAPI.createPersonnel(submitData);
      }

      showSuccess(
        submitString === "Actualizar"
          ? "Registro actualizado exitosamente"
          : "Personal registrado exitosamente",
      );
      setFormData(structuredClone(defaultFormData));
      setIsModalOpen(false);
      setSubmitString("Registrar");
      setEditingId(null);
      fetchData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Error en el sistema";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este registro?")) return;
    try {
      await activePersonnelAPI.deletePersonnel(id);
      showSuccess("Registro eliminado exitosamente");
      fetchData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Error al eliminar";
      showError(errorMessage);
    }
  };

  const handleCensus = async (id) => {
    try {
      await censusAPI.createCensus({ active_personnel_id: id });
      showSuccess("Censo realizado con éxito");
      fetchData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al realizar censo";
      showError(errorMessage);
    }
  };

  const importExcel = async (e) => {
    setLoading(true);
    try {
      const file = e.target.files[0];
      const formDataFile = new FormData();
      formDataFile.append("file", file);
      const res = await activePersonnelAPI.importExcel(formDataFile);
      showSuccess(res.message);
      fetchData();
      setIsOptionsModalOpen(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Error al importar";
      showError(errorMessage);
    } finally {
      setLoading(false);
      e.target.value = ""; // Reset input
    }
  };

  const getDetailsForPDF = async (id) => {
    try {
      const res = await activePersonnelAPI.getDetailById(id);
      setPDFdata({ ...res.personnel, ...res.personnel.additional_data });

      setPDFmodal(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al obtener detalles";
      showError(errorMessage);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Cód",
        size: 60,
        enableColumnFilter: false,
        enableSorting: true,
      },
   
      {
        accessorKey: "census_status",
        header: "Nombre completo",
        filterFn: "includesString",
        enableColumnFilter: true,
        enableSorting: true,
        filterVariant: "select",
        filterSelectOptions: [ "Censado", "No censado"
        ],
        Cell: ({ cell }) => {
          // display the name and the census status badge
          const fullName = cell.row.original.full_name
          const isPhoto = cell.row.original.photo;
          const isInCensus = cell.row.original.census_status;
          return (
            <div className="flex gap-3">
              {isPhoto ? (
                <img
                  src={API_URL + "/storage/" + isPhoto}
                  alt="Profile"
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: "4px",
                    objectFit: "cover",
                  }}
                  loading="lazy"
                />
              ) : (
                <img
                  src={withoutPhoto}
                  alt="Profile"
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: "4px",
                    objectFit: "cover",
                  }}
                  loading="lazy"
                />
              )}
              <div className="flex flex-col ">
                {fullName}

                {isInCensus ? (
                  <span className="text-color2 w-min text-xs font-semibold bg-color4/30 px-2 py-1 rounded">
                    Censado
                  </span>
                ) : (
                  <span className="text-red-500 w-min text-xs bg-red-100 px-2 py-1 rounded">
                    No censado
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "ci",
        header: "CI",
        size: 100,
        filterFn: "includesString",
        enableColumnFilter: true,
        enableSorting: true,
        Cell: ({ cell }) => `${cell.row.original.nac}-${cell.getValue()}`,
      },

      {
        accessorKey: "additional_data.job_title",
        header: "Cargo",
        filterFn: "includesString",
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "asic.name",
        header: "ASIC",
        size: 120,
        filterVariant: "select",
        filterSelectOptions: asicOptions.map((a) => a.label),
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "department.name",
        header: "Departamento",
        size: 120,
        filterVariant: "select",
        enableColumnFilter: true,
        enableSorting: true,
      },

      {
        accessorKey: "type_personnel.name",
        header: "Nómina",
        size: 120,
        filterVariant: "select",
        enableColumnFilter: true,
        enableSorting: true,
        filterSelectOptions: nominasNames.map((n) => n.namesWithoutCode),
      },
      {
        accessorKey: "entry_date",
        header: "Fecha Ingreso",
        size: 120,
        enableColumnFilter: true,
        enableSorting: true,
        Cell: ({ cell }) =>
          cell.getValue()
            ? new Date(cell.getValue()).toLocaleDateString()
            : "N/A",
      },
      {
        header: "Acciones",
        accessorKey: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ cell }) => (
          <div className="flex gap-1.5">
            <button
              onClick={async () => {
                const row = cell.row.original;

                if (row.asic_id) {
                  const res = await ASICAPI.getASICRelations(row.asic_id);
                  setAsicRelations(res);

                  const deps = res.dependencies || [];
                  setDependencyOptions(
                    deps.map((d) => ({ value: d.id, label: d.name })),
                  );

                  // Filter units by selected dependency
                  const selectedDep = deps.find(
                    (d) => d.id === row.dependency_id,
                  );
                  const units = selectedDep?.administrative_units || [];
                  setUnitOptions(
                    units.map((u) => ({ value: u.id, label: u.name })),
                  );

                  // Filter departments by selected unit
                  const selectedUnit = units.find(
                    (u) => u.id === row.administrative_unit_id,
                  );
                  const depts = selectedUnit?.departments || [];
                  setDepartmentOptions(
                    depts.map((d) => ({ value: d.id, label: d.name })),
                  );

                  // Filter services by selected department
                  const selectedDept = depts.find(
                    (d) => d.id === row.department_id,
                  );
                  const services = selectedDept?.services || [];
                  setServiceOptions(
                    services.map((s) => ({ value: s.id, label: s.name })),
                  );
                }

                setFormData({
                  ...defaultFormData,
                  ...row,
                  ...(row.additional_data || {}),
                  fotoChanged: false,
                  labor_relationship:
                    row.type_personnel?.laboral_relationship || "",
                  personnel_type: row.type_personnel?.name || "",
                  budget: row.type_personnel?.source_budget || "",
                });

                setEditingId(row.id);
                setSubmitString("Actualizar");
                setIsModalOpen(true);
              }}
              className="text-blue-500 p-1.5 rounded-full hover:bg-gray-200"
              title="Editar"
            >
              <Icon icon="material-symbols:edit" width={18} height={18} />
            </button>
            {cell.row.original.status ? (
              <>
                <button
                  onClick={() => {
                    // setPDFdata({
                    //   ...cell.row.original,
                    //   ...cell.row.original.additional_data,
                    // });
                    // setPDFmodal(true);
                    getDetailsForPDF(cell.row.original.id);
                  }}
                  className="text-gray-600 p-1.5 rounded-full hover:bg-gray-200"
                  title="Ver Planilla"
                >
                  <Icon icon="proicons:pdf-2" width={18} height={18} />
                </button>
                <button
                  onClick={() => handleCensus(cell.row.original.id)}
                  className="text-color2 p-1.5 rounded-full hover:bg-gray-200"
                  title="Censar"
                >
                  <Icon icon="ci:wavy-check" width={18} height={18} />
                </button>
              </>
            ) : null}
            {user?.is_admin && (
              <button
                onClick={() => handleDelete(cell.row.original.id)}
                className="text-red-500 p-1.5 rounded-full hover:bg-gray-200"
                title="Eliminar"
              >
                <Icon
                  icon="material-symbols:delete-outline"
                  width={18}
                  height={18}
                />
              </button>
            )}
          </div>
        ),
      },
    ],
    [handleCensus, handleDelete],
  );

  const [data, setData] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await activePersonnelAPI.getPersonnel({
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sortField: sorting[0]?.id || "id",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        search: globalFilter,
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
      showError("Error al cargar los datos");
    }
    setIsLoading(false);
  }, [pagination, sorting, columnFilters, globalFilter, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const debouncedGlobalFilter = useMemo(
    () =>
      debounce((value) => {
        setGlobalFilter(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }, 300),
    [],
  );

  const renderPhotoField = (
    fieldName,
    label,
    optionsRef,
    showOptions,
    setShowOptions,
    inputRef,
  ) => (
    <div className="col-span-12 md:col-span-2 md:row-span-2 flex flex-col items-center">
      <div ref={optionsRef} className="relative">
        <div
          onClick={() => setShowOptions(!showOptions)}
          className="w-32 h-40 bg-gray-200 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors overflow-hidden"
        >
          {formData[fieldName] instanceof File ? (
            <img
              src={URL.createObjectURL(formData[fieldName])}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : formData[fieldName] ? (
            <img
              src={API_URL + "/storage/" + formData[fieldName]}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon icon="tabler:photo-up" className="w-12 h-12 text-gray-400" />
          )}
        </div>
        {showOptions && (
          <div className="absolute z-50 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200">
            <button
              type="button"
              onClick={() => openCamera(fieldName)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
            >
              <Icon icon="mdi:camera" className="w-4 h-4" />
              <span>Tomar foto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                inputRef.current?.click();
                setShowOptions(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-2 rounded-b-lg border-t"
            >
              <Icon icon="mdi:image" className="w-4 h-4" />
              <span>Subir imagen</span>
            </button>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files[0]) {
            setFormData((prev) => ({
              ...prev,
              [fieldName]: e.target.files[0],
              fotoChanged: true,
            }));
          }
        }}
      />
    </div>
  );

  const CameraModal = ({
    isOpen,
    onClose,
    onCapture,
    videoRef,
    canvasRef,
    title,
  }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="flex  flex-col items-center gap-4 p-4">
        <div className="relative w-full max-w-md bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto"
          />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCapture}
            className="px-6 py-2.5 bg-color1 text-white rounded-md hover:bg-color2 flex items-center gap-2"
          >
            <Icon icon="mdi:camera" className="w-5 h-5" />
            Capturar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );

  return (
    <>
      <title>Personal Activo - LabFalcón</title>
      <div style={{ height: 580, width: "100%" }}>
        <div className="md:flex fadeInUp justify-between items-center mb-4">
          <div>
            <h1 className="text-lg md:text-2xl font-bold mb-2 md:mb-0">
              Personal Activo
            </h1>
          </div>
          <div className="flex gap-3 z-50 relative">
            <FuturisticButton
              onClick={() => {
                if (!user?.is_admin) {
                  showInfo("Solo los administradores pueden usar esta función");
                  return;
                }
                if (submitString === "Actualizar") {
                  setSubmitString("Registrar");
                  setEditingId(null);
                  setFormData(structuredClone(defaultFormData));
                } else {
                  setAsicRelations(null);
                  setDependencyOptions([]);
                  setUnitOptions([]);
                  setDepartmentOptions([]);
                  setServiceOptions([]);
                }
                setCensusStatus(true);
                setIsModalOpen(true);
              }}
            >
              Registrar Personal
            </FuturisticButton>

            <button
              title="más opciones"
              className={`flex items-center ${
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
            if (submitString === "Actualizar") {
              setFormData(structuredClone(defaultFormData));
              setSubmitString("Registrar");
              setCensusStatus(true);
              setEditingId(null);
            }
          }}
          title={
            submitString === "Actualizar"
              ? "Actualizar Personal"
              : "Registrar Personal"
          }
          size="xl"
        >
          <form className="px-3 md:px-6 space-y-3" onSubmit={onSubmit}>
            <div className="section-datos-personales md:grid space-y-2 md:grid-cols-12 gap-4 mb-10">
              <div className="col-span-12">
                <div className="text-sm font-bold text-gray-700 pb-1">
                  Datos personales
                </div>
              </div>
              {renderPhotoField(
                "photo",
                "Foto",
                photoOptionsRef,
                showPhotoOptions,
                setShowPhotoOptions,
                photoInputRef,
              )}

              {formFields
                .filter(
                  (f) =>
                    f.name !== "photo" &&
                    f.name !== "asic_id" &&
                    f.name !== "dependency_id" &&
                    f.name !== "administrative_unit_id" &&
                    f.name !== "department_id" &&
                    f.name !== "service_id" &&
                    f.name !== "payroll_dependency" &&
                    f.name !== "payroll_code" &&
                    f.name !== "type_personnel_id" &&
                    f.name !== "entry_date" &&
                    f.name !== "job_title" &&
                    f.name !== "is_resident" &&
                    f.name !== "residency_type" &&
                    f.name !== "university" &&
                    f.name !== "level" &&
                    f.name !== "job_code" &&
                    f.name !== "shift" &&
                    f.name !== "bank_account_number" &&
                    f.name !== "personnel_type" &&
                    f.name !== "budget" &&
                    f.name !== "laboral_relationship" &&
                    f.name !== "position_code" &&
                    f.name !== "grade" &&
                    f.name !== "work_status" &&
                    f.name !== "observation",
                )
                .map((field) => (
                  <FormField
                    key={field.name}
                    {...field}
                    value={formData[field.name] ?? ""}
                    onChange={(e) => handleFieldChange(e, field)}
                  />
                ))}
            </div>

            <>
              <div className="border-t pt-3 mt-5">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-bold text-gray-700 pb-1">
                    Datos administrativos
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text text-gray-600">
                      Censar al guardar
                    </span>
                    <Switch
                      checked={censusStatus}
                      onChange={(e) => setCensusStatus(e.target.checked)}
                      size="small"
                    />
                  </div>
                </div>

                {censusStatus && (
                  <div className="space-y-4">
                    <div className="md:grid  md:grid-cols-12 gap-4">
                      {formFields
                        .filter(
                          (f) =>
                            f.name === "asic_id" ||
                            f.name === "dependency_id" ||
                            f.name === "administrative_unit_id" ||
                            f.name === "department_id" ||
                            f.name === "service_id",
                        )
                        .map((field) => (
                          <FormField
                            key={field.name}
                            {...field}
                            value={formData[field.name] ?? ""}
                            onChange={(e) => handleFieldChange(e, field)}
                          />
                        ))}
                    </div>

                    <div className="md:grid  md:grid-cols-12 gap-4 mt-4">
                      {formFields
                        .filter(
                          (f) =>
                            f.name === "payroll_dependency" ||
                            f.name === "payroll_code" ||
                            f.name === "type_personnel_id" ||
                            f.name === "entry_date" ||
                            f.name === "job_title" ||
                            f.name === "is_resident" ||
                            f.name === "residency_type" ||
                            f.name === "university" ||
                            f.name === "level" ||
                            f.name === "job_code" ||
                            f.name === "shift" ||
                            f.name === "bank_account_number" ||
                            f.name === "personnel_type" ||
                            f.name === "budget" ||
                            f.name === "laboral_relationship" ||
                            f.name === "position_code" ||
                            f.name === "grade" ||
                            f.name === "work_status" ||
                            f.name === "observation",
                        )
                        .map((field) => (
                          <FormField
                            key={field.name}
                            {...field}
                            value={formData[field.name] ?? ""}
                            onChange={(e) => handleFieldChange(e, field)}
                          />
                        ))}
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-700">
                          Carga Familiar
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              family_members: [
                                ...prev.family_members,
                                { ...defaultFamilyMember },
                              ],
                            }))
                          }
                          className="px-3 py-1.5 bg-color2 text-white text-sm rounded-md hover:bg-color3 flex items-center gap-1"
                        >
                          <Icon icon="tabler:plus" width={16} height={16} />
                          Agregar Familiar
                        </button>
                      </div>

                      {formData.family_members.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-md">
                          No hay familiares agregados
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {formData.family_members.map((member, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-md border"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-sm text-gray-600">
                                  Familiar #{index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      family_members:
                                        prev.family_members.filter(
                                          (_, i) => i !== index,
                                        ),
                                    }))
                                  }
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Eliminar"
                                >
                                  <Icon
                                    icon="tabler:trash"
                                    width={18}
                                    height={18}
                                  />
                                </button>
                              </div>
                              <div className="grid grid-cols-12 gap-2">
                                <FormField
                                  type="text"
                                  name={`family_ci_${index}`}
                                  label="Cédula"
                                  value={member.ci}
                                  onChange={(e) => {
                                    setFormData(
                                      produce((draft) => {
                                        draft.family_members[index].ci =
                                          e.target.value.toUpperCase();
                                      }),
                                    );
                                  }}
                                  className="col-span-3"
                                  sx={{
                                    "& input": { textTransform: "uppercase" },
                                  }}
                                />
                                <FormField
                                  type="text"
                                  name={`family_full_name_${index}`}
                                  label="Nombre Completo"
                                  value={member.full_name}
                                  onChange={(e) => {
                                    setFormData(
                                      produce((draft) => {
                                        draft.family_members[index].full_name =
                                          e.target.value;
                                      }),
                                    );
                                  }}
                                  className="col-span-4"
                                  sx={{
                                    "& input": { textTransform: "uppercase" },
                                  }}
                                />
                                <FormField
                                  type="date"
                                  name={`family_date_birth_${index}`}
                                  label="Fec. Nac."
                                  value={member.date_birth}
                                  onChange={(e) => {
                                    setFormData(
                                      produce((draft) => {
                                        draft.family_members[index].date_birth =
                                          e.target.value;
                                      }),
                                    );
                                  }}
                                  className="col-span-2"
                                />
                                <FormField
                                  type="select"
                                  name={`family_sex_${index}`}
                                  label="Sexo"
                                  options={[
                                    { value: "M", label: "M" },
                                    { value: "F", label: "F" },
                                  ]}
                                  value={member.sex}
                                  onChange={(e) => {
                                    setFormData(
                                      produce((draft) => {
                                        draft.family_members[index].sex =
                                          e.target.value;
                                      }),
                                    );
                                  }}
                                  className="col-span-2"
                                />
                                <FormField
                                  type="select"
                                  name={`family_relationship_${index}`}
                                  label="Parentesco"
                                  options={[
                                    { value: "", label: "Seleccionar" },
                                    ...relationshipOptions,
                                  ]}
                                  value={member.relationship}
                                  onChange={(e) => {
                                    setFormData(
                                      produce((draft) => {
                                        draft.family_members[
                                          index
                                        ].relationship = e.target.value;
                                      }),
                                    );
                                  }}
                                  className="col-span-4"
                                />
                                <FormField
                                  type="select"
                                  name={`family_study_level_${index}`}
                                  label="Nivel Estudio"
                                  options={[
                                    { value: "", label: "Seleccionar" },
                                    ...studyLevelOptions,
                                  ]}
                                  value={member.study_level}
                                  onChange={(e) => {
                                    setFormData(
                                      produce((draft) => {
                                        draft.family_members[
                                          index
                                        ].study_level = e.target.value;
                                      }),
                                    );
                                  }}
                                  className="col-span-4"
                                />
                                <FormField
                                  type="text"
                                  name={`family_current_grade_${index}`}
                                  label="Grado Actual"
                                  value={member.current_grade}
                                  onChange={(e) => {
                                    setFormData(
                                      produce((draft) => {
                                        draft.family_members[
                                          index
                                        ].current_grade =
                                          e.target.value.toUpperCase();
                                      }),
                                    );
                                  }}
                                  placeholder="Ej: 4TO GRADO"
                                  className="col-span-4"
                                  sx={{
                                    "& input": { textTransform: "uppercase" },
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-12 py-3 rounded-md font-semibold ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    submitString === "Actualizar"
                      ? "bg-color4 text-color1 hover:bg-color3"
                      : "bg-color1 text-color4 hover:bg-color3"
                  }`}
                >
                  {loading ? <CircularProgress size={20} /> : submitString}
                </button>
              </div>
            </>
          </form>
        </Modal>

        <CameraModal
          isOpen={showCameraModal}
          onClose={() => stopCamera("photo")}
          onCapture={() => capturePhoto("photo")}
          videoRef={videoRef}
          canvasRef={canvasRef}
          title="Tomar Foto"
        />

        {!isModalOpen && (
          <div
            className="ag-theme-alpine z-40 ag-grid-no-border"
            style={{ height: 500 }}
          >
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
                columnVisibility: {
                  entry_date: false,
                  "type_personnel.name": false,
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
              rowsPerPageOptions={[25, 50, 100]}
              muiTablePaginationProps={{
                rowsPerPageOptions: [25, 50, 100],
              }}
              muiSearchTextFieldProps={{
                placeholder: "Buscar",
                sx: { minWidth: "300px" },
                variant: "outlined",
              }}
            />
          </div>
        )}
      </div>

      <Modal
        title="Planilla de Personal Activo"
        isOpen={PDFmodal}
        size="xl"
        onClose={() => setPDFmodal(false)}
      >
        <PlanillaPersonalActivo data={PDFdata} />
      </Modal>

      <Modal
        isOpen={isOptionsModalOpen}
        title="Más opciones"
        size="md"
        onClose={() => setIsOptionsModalOpen(false)}
      >
        <div className="px-4 flex flex-col">
          <label
            htmlFor="importExcelPersonnel"
            className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading ? (
              <>
                <Icon
                  icon="eos-icons:loading"
                  width={20}
                  height={20}
                  className="animate-spin"
                />
                Importando...
              </>
            ) : (
              <>
                <Icon
                  icon="vscode-icons:file-type-excel"
                  width={20}
                  height={20}
                />
                Importar personal activo desde Excel
              </>
            )}
            <input
              type="file"
              name="importExcelPersonnel"
              id="importExcelPersonnel"
              className="hidden"
              disabled={loading}
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(e) => {
                if (
                  e.target.files[0] &&
                  window.confirm(
                    e.target.files[0].name +
                      " — ¿Desea importar los datos de este Excel?",
                  )
                ) {
                  importExcel(e);
                }
              }}
            />
          </label>
          {loading && (
            <div className="flex w-full items-center gap-2 p-2">
              <Icon
                icon="eos-icons:loading"
                width={24}
                height={24}
                className="animate-spin"
              />
              <span>Subiendo...</span>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
