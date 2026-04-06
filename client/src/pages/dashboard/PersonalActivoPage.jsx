import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { API_URL } from "../../config/env.js";
import {
  activePersonnelAPI,
  ASICAPI,
  dependenciesAPI,
  administrativeUnitsAPI,
  departmentAPI,
  servicesAPI,
  censusAPI,
  typePaySheetsAPI,
} from "../../services/api.js";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal.jsx";
import FuturisticButton from "../../components/FuturisticButton.jsx";
import FormField from "../../components/forms/FormField.jsx";
import PlanillaPersonalActivo from "../../components/PlanillaPersonalActivo.jsx";
import { CircularProgress } from "@mui/material";
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
  postgraduate_degree: "",
  home_address: "",
  email: "",
  mobile_phone: "",
  fixed_phone: "",
  shirt_size: "",
  pant_size: "",
  shoe_size: "",
  photo: "",
  id_card_photo: "",
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
  position_code: "",
  shift: "",
  bank_account_number: "",
  job_code: "",
  observation: "",
  personnel_type: "",
  budget: "",
  labor_relationship: "",
  grade: "",
  ivss_number: "",
  fotoChanged: false,
  idCardFotoChanged: false,
};

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
  const [PDFmodal, setPDFmodal] = useState(false);
  const [PDFdata, setPDFdata] = useState({});
  const { user } = useAuth();
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showIdCardPhotoOptions, setShowIdCardPhotoOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showIdCardCameraModal, setShowIdCardCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [idCardCameraStream, setIdCardCameraStream] = useState(null);
  const photoOptionsRef = useRef(null);
  const idCardPhotoOptionsRef = useRef(null);
  const videoRef = useRef(null);
  const idCardVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const idCardCanvasRef = useRef(null);
  const photoInputRef = useRef(null);
  const idCardPhotoInputRef = useRef(null);

  const [asicOptions, setAsicOptions] = useState([]);
  const [asicRelations, setAsicRelations] = useState(null);
  const [dependencyOptions, setDependencyOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [typePaySheets, setTypePaySheets] = useState([]);

  const [formData, setFormData] = useState(structuredClone(defaultFormData));
  const [familyMembers, setFamilyMembers] = useState([]);
  const [submitString, setSubmitString] = useState("Registrar");
  const [editingId, setEditingId] = useState(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const asicRes = await ASICAPI.getASIC();
      setAsicOptions(
        asicRes.map((item) => ({ value: item.id, label: item.name })),
      );
      const type_pay_sheets = await typePaySheetsAPI.getPaySheets();
      const formattedTypePaySheets = type_pay_sheets.map((type_pay_sheet) => ({
        value: type_pay_sheet.id,
        label: type_pay_sheet.name,
      }));
      setTypePaySheets(formattedTypePaySheets);
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

          const autoSelectDept =
            depts.length === 1 &&
            depts[0].name.toLowerCase() === unit.name.toLowerCase();
          const autoSelectService =
            autoSelectDept &&
            depts[0].services?.length === 1 &&
            depts[0].services[0].name.toLowerCase() ===
              depts[0].name.toLowerCase();

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
      if (
        idCardPhotoOptionsRef.current &&
        !idCardPhotoOptionsRef.current.contains(event.target)
      ) {
        setShowIdCardPhotoOptions(false);
      }
    };

    if (showPhotoOptions || showIdCardPhotoOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPhotoOptions, showIdCardPhotoOptions]);

  const openCamera = (forField) => {
    const videoEl = forField === "photo" ? videoRef : idCardVideoRef;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (forField === "photo") {
          setCameraStream(stream);
          setShowCameraModal(true);
          setShowPhotoOptions(false);
        } else {
          setIdCardCameraStream(stream);
          setShowIdCardCameraModal(true);
          setShowIdCardPhotoOptions(false);
        }
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
    const stream = forField === "photo" ? cameraStream : idCardCameraStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (forField === "photo") {
      setCameraStream(null);
      setShowCameraModal(false);
    } else {
      setIdCardCameraStream(null);
      setShowIdCardCameraModal(false);
    }
  };

  const capturePhoto = (forField) => {
    const videoEl =
      forField === "photo" ? videoRef.current : idCardVideoRef.current;
    const canvasEl =
      forField === "photo" ? canvasRef.current : idCardCanvasRef.current;

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
            [forField === "photo" ? "fotoChanged" : "idCardFotoChanged"]: true,
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
      if (idCardCameraStream)
        idCardCameraStream.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream, idCardCameraStream]);

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
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "id_card_photo",
        label: "Foto de Cédula",
        type: "file",
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "nac",
        label: "Nacionalidad",
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
        className: "col-span-6 md:col-span-4",
      },
      {
        name: "full_name",
        label: "Nombre Completo",
        type: "text",
        required: true,
        className: "col-span-12",
        onBlur: handleFullNameBlur,
      },
      {
        name: "date_birth",
        label: "Fecha de Nacimiento",
        type: "date",
        required: true,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "sex",
        label: "Sexo",
        type: "select",
        options: [
          { value: "M", label: "Masculino" },
          { value: "F", label: "Femenino" },
        ],
        className: "col-span-6 md:col-span-4",
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
        className: "col-span-6 md:col-span-4",
      },
      {
        name: "degree_obtained",
        label: "Grado Obtenido",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "postgraduate_degree",
        label: "Postgrado",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "home_address",
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
        label: "Talla de Camisa",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-2",
      },
      {
        name: "pant_size",
        label: "Talla de Pantalón",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-2",
      },
      {
        name: "shoe_size",
        label: "Talla de Zapatos",
        type: "text",
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
        className: "col-span-12 md:col-span-6",
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
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "payroll_code",
        label: "Código de Nómina",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "payroll_name",
        label: "Nombre de Nómina",
        type: "select",
        options: typePaySheets,
        required: false,
        className: "col-span-12 md:col-span-6",
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
        name: "level",
        label: "Nivel",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-3",
      },
      {
        name: "university",
        label: "Universidad",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "position_code",
        label: "Código de Posición",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "job_code",
        label: "Código del Cargo",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "shift",
        label: "Turno",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "bank_account_number",
        label: "Número de Cuenta Bancaria",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "personnel_type",
        label: "Tipo de Personal",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-6",
      },
      {
        name: "budget",
        label: "Presupuesto",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "labor_relationship",
        label: "Relación Laboral",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "grade",
        label: "Grado",
        type: "text",
        required: false,
        className: "col-span-12 md:col-span-4",
      },
      {
        name: "ivss_number",
        label: "Número IVSS",
        type: "text",
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
      dependencyOptions,
      unitOptions,
      departmentOptions,
      serviceOptions,
      handleASICChange,
      handleDependencyChange,
      handleUnitChange,
      handleDepartmentChange,
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
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleFieldChange = useCallback((e, field) => {
    if (field?.onChangeCustom) {
      field.onChangeCustom(e.target.value);
    } else {
      const { name, value } = e.target;
      if (e.target.type === "checkbox") {
        setFormData((prev) => ({ ...prev, [name]: e.target.checked }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      const fieldsToSkip = [
        "asic",
        "dependency",
        "administrativeUnit",
        "department",
        "service",
        "familyMembers",
        "censuses",
        "user",
        "created_at",
        "updated_at",
        "fotoChanged",
        "idCardFotoChanged",
        "latest_census_id",
      ];

      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        if (fieldsToSkip.includes(key)) return;

        if (
          key === "photo" &&
          submitString === "Actualizar" &&
          !formData.fotoChanged
        )
          return;
        if (
          key === "id_card_photo" &&
          submitString === "Actualizar" &&
          !formData.idCardFotoChanged
        )
          return;

        if (value instanceof File) {
          submitData.append(key, value);
        } else if (typeof value === "boolean") {
          submitData.append(key, value ? "1" : "0");
        } else if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          typeof value !== "object"
        ) {
          submitData.append(key, value);
        }
      });

      familyMembers.forEach((member, index) => {
        submitData.append(`family_members[${index}][ci]`, member.ci);
        submitData.append(
          `family_members[${index}][full_name]`,
          member.full_name,
        );
        submitData.append(
          `family_members[${index}][date_birth]`,
          member.date_birth,
        );
        submitData.append(`family_members[${index}][sex]`, member.sex);
        submitData.append(
          `family_members[${index}][relationship]`,
          member.relationship,
        );
        submitData.append(
          `family_members[${index}][study_level]`,
          member.study_level,
        );
        submitData.append(
          `family_members[${index}][current_grade]`,
          member.current_grade,
        );
      });

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
      setFamilyMembers([]);
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
        size: 90,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ cell }) =>
          cell.getValue() ? (
            <img
              src={API_URL + "/storage/" + cell.getValue()}
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
        Cell: ({ cell }) => `${cell.row.original.nac}-${cell.getValue()}`,
      },
      {
        accessorKey: "job_title",
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
        accessorKey: "status",
        header: "Estatus",
        size: 100,
        filterVariant: "select",
        filterSelectOptions: [
          { text: "Activo", value: 1 },
          { text: "Inactivo", value: 0 },
        ],
        enableColumnFilter: true,
        enableSorting: true,
        Cell: ({ cell }) =>
          cell.getValue() ? (
            <span className="text-color2 text-xs font-semibold bg-color4/30 px-2 py-1 rounded">
              Activo
            </span>
          ) : (
            <span className="text-red-500 text-xs bg-red-100 px-2 py-1 rounded">
              Inactivo
            </span>
          ),
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
                setFormData({
                  ...defaultFormData,
                  ...row,
                  fotoChanged: false,
                  idCardFotoChanged: false,
                });
                setFamilyMembers(row.family_members || []);
                setEditingId(row.id);
                setSubmitString("Actualizar");
                setIsModalOpen(true);
                if (row.asic_id) {
                  await fetchASICRelations(row.asic_id);
                }
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
                    setPDFdata(cell.row.original);
                    setPDFmodal(true);
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
    <div className="col-span-12 md:col-span-4 flex flex-col items-center">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
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
              [fieldName === "photo" ? "fotoChanged" : "idCardFotoChanged"]:
                true,
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
      <div className="flex flex-col items-center gap-4 p-4">
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
                }
                setAsicRelations(null);
                setDependencyOptions([]);
                setUnitOptions([]);
                setDepartmentOptions([]);
                setServiceOptions([]);
                setFamilyMembers([]);
                setIsModalOpen(true);
              }}
            >
              Registrar Personal
            </FuturisticButton>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setFormData(structuredClone(defaultFormData));
            setFamilyMembers([]);
            setSubmitString("Registrar");
            setEditingId(null);
          }}
          title={
            submitString === "Actualizar"
              ? "Actualizar Personal"
              : "Registrar Personal"
          }
          size="xl"
        >
          <form className="px-3 md:px-6 space-y-4" onSubmit={onSubmit}>
            <div className="md:grid space-y-3 md:grid-cols-12 gap-4">
              {renderPhotoField(
                "photo",
                "Foto",
                photoOptionsRef,
                showPhotoOptions,
                setShowPhotoOptions,
                photoInputRef,
              )}
              {renderPhotoField(
                "id_card_photo",
                "Foto Cédula",
                idCardPhotoOptionsRef,
                showIdCardPhotoOptions,
                setShowIdCardPhotoOptions,
                idCardPhotoInputRef,
              )}

              {formFields
                .filter((f) => f.name !== "photo" && f.name !== "id_card_photo")
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
                <h3 className="font-semibold text-gray-700">Familiares</h3>
                <button
                  type="button"
                  onClick={() =>
                    setFamilyMembers([
                      ...familyMembers,
                      { ...defaultFamilyMember },
                    ])
                  }
                  className="px-3 py-1.5 bg-color2 text-white text-sm rounded-md hover:bg-color3 flex items-center gap-1"
                >
                  <Icon icon="tabler:plus" width={16} height={16} />
                  Agregar Familiar
                </button>
              </div>

              {familyMembers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-md">
                  No hay familiares agregados
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {familyMembers.map((member, index) => (
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
                            setFamilyMembers(
                              familyMembers.filter((_, i) => i !== index),
                            )
                          }
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Eliminar"
                        >
                          <Icon icon="tabler:trash" width={18} height={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-12 gap-2">
                        <FormField
                          type="text"
                          name={`family_ci_${index}`}
                          label="Cédula"
                          value={member.ci}
                          onChange={(e) => {
                            const updated = [...familyMembers];
                            updated[index].ci = e.target.value.toUpperCase();
                            setFamilyMembers(updated);
                          }}
                          className="col-span-3"
                          sx={{ "& input": { textTransform: "uppercase" } }}
                        />
                        <FormField
                          type="text"
                          name={`family_full_name_${index}`}
                          label="Nombre Completo"
                          value={member.full_name}
                          onChange={(e) => {
                            const updated = [...familyMembers];
                            updated[index].full_name = e.target.value;
                            setFamilyMembers(updated);
                          }}
                          className="col-span-5"
                          sx={{ "& input": { textTransform: "uppercase" } }}
                        />
                        <FormField
                          type="date"
                          name={`family_date_birth_${index}`}
                          label="Fec. Nac."
                          value={member.date_birth}
                          onChange={(e) => {
                            const updated = [...familyMembers];
                            updated[index].date_birth = e.target.value;
                            setFamilyMembers(updated);
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
                            const updated = [...familyMembers];
                            updated[index].sex = e.target.value;
                            setFamilyMembers(updated);
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
                            const updated = [...familyMembers];
                            updated[index].relationship = e.target.value;
                            setFamilyMembers(updated);
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
                            const updated = [...familyMembers];
                            updated[index].study_level = e.target.value;
                            setFamilyMembers(updated);
                          }}
                          className="col-span-4"
                        />
                        <FormField
                          type="text"
                          name={`family_current_grade_${index}`}
                          label="Grado Actual"
                          value={member.current_grade}
                          onChange={(e) => {
                            const updated = [...familyMembers];
                            updated[index].current_grade =
                              e.target.value.toUpperCase();
                            setFamilyMembers(updated);
                          }}
                          placeholder="Ej: 4TO GRADO"
                          className="col-span-4"
                          sx={{ "& input": { textTransform: "uppercase" } }}
                        />
                      </div>
                    </div>
                  ))}
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
        <CameraModal
          isOpen={showIdCardCameraModal}
          onClose={() => stopCamera("id_card_photo")}
          onCapture={() => capturePhoto("id_card_photo")}
          videoRef={idCardVideoRef}
          canvasRef={idCardCanvasRef}
          title="Tomar Foto de Cédula"
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
                columnVisibility: { entry_date: false },
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
    </>
  );
}
