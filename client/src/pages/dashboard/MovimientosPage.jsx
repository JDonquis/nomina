import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  activitiesAPI,
  ASICAPI,
  jobsAPI,
  nominaNamesAPI,
  usersAPI,
} from "../../services/api.js";
import { MaterialReactTable } from "material-react-table";
import { useTableVisibility } from "../../hooks/useTablePersistence.js";
import { API_URL } from "../../config/env.js";
import withoutPhoto from "../../assets/withoutPhoto.webp";
import { Icon } from "@iconify/react";
import { cities } from "../../constants/cities.js";
import municipalitiesWithParishes from "../../constants/municipalitiesWithParishes";
import typePensions from "../../constants/type_pensions";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale"; // Para español
import PrintPage from "../../components/planilla.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/forms/FormField.jsx";
import debounce from "lodash.debounce";

const defaultFormData = {
  action: "",
  to_census: false,
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

const formatDetailLabel = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());

// Etiquetas en español para los campos del detalle.
const FIELD_LABELS = {
  nac: "Nacionalidad",
  ci: "Cédula de Identidad",
  full_name: "Nombres y Apellidos",
  date_birth: "Fecha de Nacimiento",
  sex: "Sexo",
  civil_status: "Estado Civil",
  address: "Dirección",
  email: "Correo Electrónico",
  phone_number: "Teléfono",
  mobile_phone: "Teléfono Móvil",
  fixed_phone: "Teléfono Fijo",
  municipality: "Municipio",
  parish: "Parroquia",
  state: "Estado",
  city: "Ciudad",
  status: "Estado del registro",
  work_status: "Estatus Laboral",

  asic_id: "ASIC",
  dependency_id: "Dependencia",
  administrative_unit_id: "Unidad Administrativa",
  department_id: "Departamento",
  service_id: "Servicio",
  administrative_location_id: "Ubicación Administrativa",

  type_personnel_id: "Nómina / Tipo de Personal",
  type_pay_sheet_id: "Nómina",
  job_id: "Cargo",
  job_title: "Título del Cargo",
  job_code: "Código de Cargo",
  position_code: "Código de Puesto",
  grade: "Grado",
  shift: "Turno",
  entry_date: "Fecha de Ingreso",
  labor_relationship: "Relación Laboral",
  laboral_relationship: "Relación Laboral",
  payroll_dependency: "Dependencia de Nómina",
  payroll_budget: "Presupuesto",
  payroll_code: "Código de Nómina",
  payroll_name: "Nombre de Nómina",
  budget: "Presupuesto",
  bank_account_number: "Número de Cuenta Bancaria",
  type_pension: "Tipo de Pensión",
  last_charge: "Último Cargo",

  degree_obtained: "Nivel Académico",
  undergraduate_degree: "Pregrado",
  pregraduate_degree: "Pregrado",
  postgraduate_degree: "Postgrado",

  is_resident: "Es Residente",
  residency_type: "Tipo de Residencia",
  hospital: "Hospital",
  university: "Universidad",
  level: "Nivel",

  family_members: "Carga Familiar",

  receive_pension_from_another_organization_status:
    "Recibe Pensión de Otra Organización",
  another_organization_name: "Organización de la que recibe pensión",
  has_authorizations: "Tiene Autorizaciones",
  pension_survivor_status: "Pensión por Sobrevivencia",
  fullname_causative: "Nombre del Causante",
  age_causative: "Edad del Causante",
  parent_causative: "Parentesco con el Causante",
  sex_causative: "Sexo del Causante",
  ci_causative: "Cédula del Causante",
  decease_date: "Fecha de Fallecimiento",
  suspend_payment_status: "Pago Suspendido",
  last_payment: "Último Pago",

  shirt_size: "Talla de Camisa",
  pant_size: "Talla de Pantalón",
  shoe_size: "Talla de Zapatos",

  observation: "Observaciones",
};

// Traducción de valores tipo enumeración.
const VALUE_MAPS = {
  sex: { M: "Masculino", F: "Femenino" },
  civil_status: { S: "Soltero", C: "Casado", V: "Viudo", D: "Divorciado" },
  status: { active: "Activo", inactive: "Inactivo" },
  type_pension: {
    Jubilacion: "Jubilación",
    Pension: "Pensión",
    Sobrevivencia: "Sobrevivencia",
  },
};

// Etiquetas amigables para las actividades.
const ACTION_LABELS = {
  create: "Registro creado",
  update: "Registro actualizado",
  delete: "Registro eliminado",
  census: "Censo registrado",
  create_and_census: "Registro creado y censado",
  update_and_census: "Registro actualizado y censado",
  import_excel: "Importación desde Excel",
  import_excel_create: "Importado desde Excel (nuevo)",
  import_excel_update: "Importado desde Excel (actualizado)",
  "Creacion de Censo": "Creación de censo",
  "Actualizacion de Censo": "Actualización de censo",
  "Eliminacion de Censo": "Eliminación de censo",
  "Creacion de registro": "Registro creado",
  "Actualizacion de registro": "Registro actualizado",
  "Eliminación de registro": "Registro eliminado",
  "Repositorio exportado": "Repositorio exportado",
  "Repositorio importado": "Repositorio importado",
};

const actionLabel = (action) =>
  ACTION_LABELS[action] || formatDetailLabel(action || "");

const actionBadgeClass = (action) => {
  if (!action) return "bg-gray-100 text-gray-700";
  if (action.includes("delete") || action.includes("Eliminacion")) {
    return "bg-red-100 text-red-700";
  }
  if (action.includes("census") || action.includes("Censo")) {
    return "bg-indigo-100 text-indigo-700";
  }
  if (action.includes("create") || action.includes("Creacion") || action.includes("import_excel_create")) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (action.includes("update") || action.includes("Actualizacion") || action.includes("import_excel")) {
    return "bg-blue-100 text-blue-700";
  }
  return "bg-gray-100 text-gray-700";
};

const fieldLabel = (key) => FIELD_LABELS[key] || formatDetailLabel(key);

// Secciones del detalle, en orden de presentación.
const DETAIL_SECTIONS = [
  {
    id: "personales",
    title: "Datos Personales",
    icon: "mdi:account-outline",
    keys: [
      "photo",
      "nac",
      "ci",
      "full_name",
      "date_birth",
      "sex",
      "civil_status",
      "email",
      "phone_number",
      "mobile_phone",
      "fixed_phone",
      "address",
      "municipality",
      "parish",
      "state",
      "city",
    ],
  },
  {
    id: "ubicacion",
    title: "Ubicación y Estructura",
    icon: "mdi:office-building-outline",
    keys: [
      "asic_id",
      "dependency_id",
      "administrative_unit_id",
      "department_id",
      "service_id",
      "administrative_location_id",
    ],
  },
  {
    id: "laborales",
    title: "Datos Laborales y de Nómina",
    icon: "mdi:briefcase-outline",
    keys: [
      "type_personnel_id",
      "type_pay_sheet_id",
      "work_status",
      "job_id",
      "job_title",
      "job_code",
      "position_code",
      "grade",
      "shift",
      "entry_date",
      "labor_relationship",
      "laboral_relationship",
      "payroll_dependency",
      "payroll_budget",
      "budget",
      "payroll_code",
      "payroll_name",
      "bank_account_number",
      "type_pension",
      "last_charge",
    ],
  },
  {
    id: "academicos",
    title: "Formación Académica",
    icon: "mdi:school-outline",
    keys: [
      "degree_obtained",
      "undergraduate_degree",
      "pregraduate_degree",
      "postgraduate_degree",
    ],
  },
  {
    id: "residencia",
    title: "Residencia",
    icon: "mdi:home-outline",
    keys: ["is_resident", "residency_type", "hospital", "university", "level"],
  },
  {
    id: "dotacion",
    title: "Dotación / Tallas",
    icon: "mdi:tshirt-crew-outline",
    keys: ["shirt_size", "pant_size", "shoe_size"],
  },
  {
    id: "familia",
    title: "Carga Familiar",
    icon: "mdi:account-group-outline",
    keys: ["family_members"],
  },
  {
    id: "pension",
    title: "Pensión / Sobrevivencia",
    icon: "mdi:cash-multiple",
    keys: [
      "receive_pension_from_another_organization_status",
      "another_organization_name",
      "has_authorizations",
      "pension_survivor_status",
      "fullname_causative",
      "age_causative",
      "parent_causative",
      "sex_causative",
      "ci_causative",
      "decease_date",
      "suspend_payment_status",
      "last_payment",
    ],
  },
];

// Campos que no se muestran en el detalle (técnicos o redundantes).
const DETAIL_SKIP_KEYS = [
  "additional_data",
  "photo",
  "id",
  "sync_id",
  "created_at",
  "updated_at",
  "census_date",
  "census_status",
  "action",
  "to_census",
  "type_personnel",
  "asic",
  "dependency",
  "administrative_unit",
  "department",
  "service",
  "user",
  "latest_census_id",
];

const normalizeDetailValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "No especificado";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (Array.isArray(value)) {
    if (!value.length) return "Sin datos";
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return JSON.stringify(item);
        }
        return String(item);
      })
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const formatFamilyMembers = (value) => {
  if (!Array.isArray(value) || !value.length) {
    return "Sin datos";
  }

  return value
    .map((member, index) => {
      if (!member || typeof member !== "object") {
        return `${index + 1}. ${normalizeDetailValue(member)}`;
      }

      const parts = [];
      if (member.full_name) parts.push(member.full_name);
      if (member.relationship) parts.push(`(${member.relationship})`);
      if (member.ci) parts.push(`CI: ${member.ci}`);

      return `${index + 1}. ${parts.join(" ") || "Familiar"}`;
    })
    .join(" • ");
};

const areValuesEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => areValuesEqual(item, b[index]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => areValuesEqual(a[key], b[key]));
  }

  return JSON.stringify(a) === JSON.stringify(b);
};

const collectChangedFields = (oldValues, newValues, prefix = "") => {
  const changes = {};
  const keys = new Set([
    ...(oldValues ? Object.keys(oldValues) : []),
    ...(newValues ? Object.keys(newValues) : []),
  ]);

  keys.forEach((key) => {
    const oldValue = oldValues?.[key];
    const newValue = newValues?.[key];
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (
      oldValue &&
      newValue &&
      typeof oldValue === "object" &&
      typeof newValue === "object" &&
      !Array.isArray(oldValue) &&
      !Array.isArray(newValue)
    ) {
      Object.assign(changes, collectChangedFields(oldValue, newValue, currentPath));
      return;
    }

    if (!areValuesEqual(oldValue, newValue)) {
      changes[currentPath] = true;
    }
  });

  return changes;
};

const buildDetailViewModel = async (activityRow = {}) => {
  const payload =
    activityRow?.new_values && typeof activityRow.new_values === "object"
      ? activityRow.new_values
      : activityRow?.pay_sheet && typeof activityRow.pay_sheet === "object"
        ? activityRow.pay_sheet
        : {};

  const oldValues =
    activityRow?.old_values && typeof activityRow.old_values === "object"
      ? activityRow.old_values
      : {};

  const additionalData =
    payload?.additional_data && typeof payload.additional_data === "object"
      ? payload.additional_data
      : null;

  const entries = [];

  const asicLookup = payload?.asic_id
    ? await ASICAPI.getASICRelations(payload.asic_id)
    : null;

  const dependencyMap = Object.fromEntries(
    (asicLookup?.dependencies || []).map((dep) => [String(dep.id), dep.name]),
  );
  const unitMap = Object.fromEntries(
    (asicLookup?.dependencies || []).flatMap((dep) =>
      (dep.administrative_units || []).map((unit) => [String(unit.id), unit.name]),
    ),
  );
  const departmentMap = Object.fromEntries(
    (asicLookup?.dependencies || []).flatMap((dep) =>
      (dep.administrative_units || []).flatMap((unit) =>
        (unit.departments || []).map((department) => [String(department.id), department.name]),
      ),
    ),
  );
  const serviceMap = Object.fromEntries(
    (asicLookup?.dependencies || []).flatMap((dep) =>
      (dep.administrative_units || []).flatMap((unit) =>
        (unit.departments || []).flatMap((department) =>
          (department.services || []).map((service) => [String(service.id), service.name]),
        ),
      ),
    ),
  );

  const typePersonnelList = payload?.type_personnel_id
    ? await nominaNamesAPI.get()
    : [];
  const typePersonnelMap = Object.fromEntries(
    typePersonnelList.map((typePersonnel) => [String(typePersonnel.id), typePersonnel.name]),
  );

  const jobsResponse = additionalData?.job_id || payload?.job_id
    ? await jobsAPI.getJobs()
    : null;
  const jobMap = Object.fromEntries(
    (jobsResponse?.job_positions || jobsResponse || []).map((job) => [
      String(job.id),
      job.title || job.name || job.position || job.label || "",
    ]),
  );

  const asicList = await ASICAPI.getASIC();
  const asicMap = Object.fromEntries(
    asicList.map((asic) => [String(asic.id), asic.name]),
  );

  const workerName = payload?.full_name || null;
  const workerCi = payload?.ci
    ? `${payload?.nac ? `${payload.nac}-` : ""}${payload.ci}`
    : null;

  const resolveDisplayValue = (rawKey, value) => {
    if (value === null || value === undefined || value === "") {
      return "No especificado";
    }

    if (typeof value === "boolean") {
      return value ? "Sí" : "No";
    }

    if (rawKey === "asic_id") return asicMap[String(value)] || String(value);
    if (rawKey === "dependency_id") return dependencyMap[String(value)] || String(value);
    if (rawKey === "administrative_unit_id") return unitMap[String(value)] || String(value);
    if (rawKey === "department_id") return departmentMap[String(value)] || String(value);
    if (rawKey === "service_id") return serviceMap[String(value)] || String(value);
    if (rawKey === "type_personnel_id") return typePersonnelMap[String(value)] || String(value);
    if (rawKey === "job_id") return jobMap[String(value)] || String(value);
    if (rawKey === "family_members" || rawKey === "familyMembers") {
      return formatFamilyMembers(value);
    }

    if (VALUE_MAPS[rawKey] && VALUE_MAPS[rawKey][value] !== undefined) {
      return VALUE_MAPS[rawKey][value];
    }

    return normalizeDetailValue(value);
  };

  const addEntriesFromObject = (source) => {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (DETAIL_SKIP_KEYS.includes(key)) {
        return;
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        return;
      }

      entries.push({
        key,
        rawKey: key,
        label: fieldLabel(key),
        value: resolveDisplayValue(key, value),
      });
    });
  };

  addEntriesFromObject(payload);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      if (DETAIL_SKIP_KEYS.includes(key)) {
        return;
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        return;
      }

      entries.push({
        key: `additional_data.${key}`,
        rawKey: key,
        label: fieldLabel(key),
        value: resolveDisplayValue(key, value),
      });
    });
  }

  return {
    moduleName: additionalData ? "Personal Activo" : "Fe de Vida",
    workerName,
    workerCi,
    action: activityRow?.action || null,
    entries,
    changedFields: collectChangedFields(oldValues, payload),
  };
};

export default function MovimientosPage() {
  const [columnVisibility, setColumnVisibility] = useTableVisibility(
    "movimientos_columns",
    {
      "pay_sheet.phone_number": false,
      "user.charge": false,
    },
  );
  const [administrativeLocations, setAdministrativeLocations] = useState([]);
  const [typePaySheets, setTypePaySheets] = useState([]);
  const [users, setUsers] = useState([]);
  const [detailModal, setDetailModal] = useState(false);
  const [PDFdata, setPDFdata] = useState({});
  const [detailView, setDetailView] = useState({
    moduleName: "Fe de Vida",
    workerName: null,
    workerCi: null,
    action: null,
    entries: [],
    changedFields: {},
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const administrative_locations = await ASICAPI.getASIC();
      // Transform API response to match select component format { value, label }
      const formattedLocations = administrative_locations.map((location) => ({
        value: location.id,
        label: location.name,
      }));
      setAdministrativeLocations(formattedLocations);

      const type_pay_sheets = await nominaNamesAPI.getPaySheets();
      const formattedTypePaySheets = type_pay_sheets.map((type_pay_sheet) => ({
        value: type_pay_sheet.id,
        label: type_pay_sheet.name,
      }));
      setTypePaySheets(formattedTypePaySheets);

      const usersRes = await usersAPI.getAllUsers();
      setUsers(usersRes.users);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  }, []);
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const debouncedGlobalFilter = useMemo(
    () =>
      debounce((value) => {
        setGlobalFilter(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to first page
      }, 0),
    [],
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "created_at",
        header: "Fecha",
        size: 155,
        enableColumnFilter: true,
        filterVariant: "date",
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
      },
      {
        accessorKey: "user.full_name",
        header: "Realizado por",
        size: 150,
        enableColumnFilter: true,
        filterVariant: "select",
        filterSelectOptions: users.map((user) => user.full_name),
        enableSorting: true,
      },
      {
        accessorKey: "auditable.status",
        header: "Módulo",
        size: 150,
        enableColumnFilter: true,
        filterVariant: "select",
        filterSelectOptions: ["activo", "inactivo"],
        Cell: ({ cell }) =>
          cell.getValue() == "active" ? (
            <p className="flex gap-1">
              <Icon
                className="text-color2"
                icon="streamline-plump:office-worker-remix"
                width={20}
                height={20}
              />{" "}
              Personal Activo
            </p>
          ) : (
            <p className="flex gap-1">
              {" "}
              <Icon
                className="text-color1"
                icon="fluent-emoji-high-contrast:old-man"
                width={18}
                height={17}
              />{" "}
              Fe de vida{" "}
            </p>
          ),
      },
      {
        accessorKey: "action",
        header: "Actividad",
        size: 190,
        enableColumnFilter: true,
        filterVariant: "select",
        filterSelectOptions: Object.values(ACTION_LABELS),
        enableSorting: true,
        Cell: ({ cell }) => {
          const action = cell.getValue();
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${actionBadgeClass(
                action,
              )}`}
            >
              {actionLabel(action)}
            </span>
          );
        },
      },
      {
        accessorKey: "auditable.full_name",
        header: "Trabajador afectado",
        size: 220,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ cell }) =>
          cell.getValue() || `Cód. ${cell.row.original?.auditable_id ?? "N/D"}`,
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
                onClick={async () => {
                  const detailViewModel = await buildDetailViewModel(cell.row.original);
                  setDetailView(detailViewModel);
                  setDetailModal(true);
                  setFormData({
                    ...defaultFormData,
                    ...(cell.row.original.pay_sheet || {}),
                    ...(cell.row.original.new_values || {}),
                    ...(cell.row.original.new_values?.additional_data || {}),
                    action: cell.row.original.action,
                    to_census:
                      cell.row.original.action === "Creacion de Censo"
                        ? true
                        : false,
                  });
                }}
                className="text-0 p-1 rounded-full text-gray-700 hover:bg-gray-300 hover:underline"
                title="Ver detalles"
              >
                <Icon icon="mdi:eye" width={20} height={20} />
                {/* <Icon icon="proicons:pdf-2" width={20} height={20} /> */}
              </button>
            </div>
          );
        },
      },
    ],
    [users, administrativeLocations, PDFdata],
  );

  const [data, setData] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Server-side state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

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
  // Move useMemo outside the map - process all test sections at once

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await activitiesAPI.getActivities({
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
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
      console.log({ res });
      setData(res.activities.data);
      setRowCount(res.total);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
    setIsLoading(false);
  }, [pagination, sorting, columnFilters, globalFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedSections = useMemo(() => {
    const byKey = new Map();
    detailView.entries.forEach((entry) => {
      const existing = byKey.get(entry.rawKey);
      const isMeaningful = entry.value !== "No especificado";

      if (!existing || (existing.value === "No especificado" && isMeaningful)) {
        byKey.set(entry.rawKey, entry);
      }
    });

    const used = new Set();
    const sections = DETAIL_SECTIONS.map((section) => {
      const items = section.keys.map((key) => byKey.get(key)).filter(Boolean);
      items.forEach((item) => used.add(item.rawKey));
      return { ...section, items };
    }).filter((section) => section.items.length > 0);

    const others = [...byKey.values()].filter((entry) => !used.has(entry.rawKey));
    if (others.length) {
      sections.push({
        id: "otros",
        title: "Otros Datos",
        icon: "mdi:information-outline",
        items: others,
      });
    }

    return sections;
  }, [detailView.entries]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <title>Movimientos</title>
      <div>
        <h1 className="text-lg md:text-2xl font-bold mb-4 ">Movimientos</h1>

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
              "pay_sheet.phone_number": false,
              "user.charge": false,
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
      </div>
      <Modal
        size="xl"
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="Detalle del movimiento"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-color1/5 to-transparent p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-color1/10 text-color1">
                  <Icon icon="mdi:clipboard-text-clock-outline" width={22} height={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {actionLabel(detailView.action)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {detailView.workerName || "Trabajador"}
                    {detailView.workerCi ? ` · C.I. ${detailView.workerCi}` : ""}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-color1/10 px-3 py-1 text-xs font-semibold text-color1">
                {detailView.moduleName}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Icon icon="mdi:information-outline" width={16} height={16} />
              Los campos resaltados en verde cambiaron en este movimiento.
            </div>
          </div>

          {groupedSections.length > 0 ? (
            <div className="flex flex-col gap-4">
              {groupedSections.map((section) => (
                <div
                  key={section.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
                    <Icon
                      icon={section.icon}
                      width={18}
                      height={18}
                      className="text-color1"
                    />
                    <h3 className="text-sm font-semibold text-gray-700">
                      {section.title}
                    </h3>
                    <span className="ml-auto text-xs text-gray-400">
                      {section.items.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((item) => {
                      const isChanged = Boolean(
                        detailView.changedFields[item.key] ||
                          detailView.changedFields[item.rawKey] ||
                          detailView.changedFields[`additional_data.${item.rawKey}`],
                      );

                      return (
                        <div
                          key={item.key}
                          className={`px-4 py-3 ${
                            isChanged ? "bg-emerald-50" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              {item.label}
                            </p>
                            {isChanged && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                modificado
                              </span>
                            )}
                          </div>
                          <p
                            className={`mt-1 break-words text-sm ${
                              isChanged
                                ? "font-semibold text-emerald-800"
                                : "text-gray-800"
                            }`}
                          >
                            {item.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              No hay información disponible para este movimiento.
            </div>
          )}
        </div>
      </Modal>
    </LocalizationProvider>
  );
}
