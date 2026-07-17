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

  const resolveDisplayValue = (key, value) => {
    if (value === null || value === undefined || value === "") {
      return "No especificado";
    }

    if (key === "asic_id") return asicMap[String(value)] || String(value);
    if (key === "dependency_id") return dependencyMap[String(value)] || String(value);
    if (key === "administrative_unit_id") return unitMap[String(value)] || String(value);
    if (key === "department_id") return departmentMap[String(value)] || String(value);
    if (key === "service_id") return serviceMap[String(value)] || String(value);
    if (key === "type_personnel_id") return typePersonnelMap[String(value)] || String(value);
    if (key === "job_id") return jobMap[String(value)] || String(value);
    if (key === "additional_data.family_members" || key === "family_members") {
      return formatFamilyMembers(value);
    }

    return normalizeDetailValue(value);
  };

  const addEntriesFromObject = (source, prefix = "") => {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (["additional_data", "photo", "created_at", "updated_at", "id"].includes(key)) {
        return;
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        return;
      }

      const entryKey = prefix ? `${prefix}.${key}` : key;
      entries.push({
        key: entryKey,
        label: formatDetailLabel(entryKey),
        value: resolveDisplayValue(entryKey, value),
      });
    });
  };

  addEntriesFromObject(payload);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return;
      }

      const entryKey = `additional_data.${key}`;
      entries.push({
        key: entryKey,
        label: `${formatDetailLabel(key)} (datos adicionales)`,
        value: resolveDisplayValue(entryKey, value),
      });
    });
  }

  return {
    moduleName: additionalData ? "Personal Activo" : "Fe de Vida",
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
        size: 150,
        enableColumnFilter: true,
        filterVariant: "select",

        filterSelectOptions: [
          "Creacion de Censo",
          "Actualizacion de Censo",
          "Eliminacion de Censo",
          "Creacion de registro",
          "Actualizacion de registro",
          "Eliminación de registro",
          "Repositorio exportado",
          "Repositorio importado",
        ],
        enableSorting: true,
      },
      {
        accessorKey: "auditable_id",
        header: "Cód del trabajador afectado",
        size: 250,
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
        title="Detalles"
      >
        <div className="flex flex-col justify-center">
          <h1 className="text-xl font-bold mb-2 text-gray-300 col-span-2 text-center uppercase">
            {formData.action}
          </h1>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {detailView.moduleName}
                </h2>
                <p className="text-sm text-gray-500">
                  Los campos en verde indican que cambiaron en este movimiento.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600">
                {detailView.entries.length} campos
              </span>
            </div>

            {detailView.entries.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {detailView.entries.map(({ key, label, value }) => {
                  const isChanged =
                    Boolean(detailView.changedFields[key]) ||
                    Boolean(detailView.changedFields[`additional_data.${key}`]) ||
                    Boolean(detailView.changedFields[key.replace(/^additional_data\./, "")]);

                  return (
                    <div
                      key={key}
                      className={`rounded-md border p-3 ${
                        isChanged
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {label}
                      </div>
                      <div
                        className={`mt-1 break-words text-sm font-medium ${
                          isChanged ? "text-emerald-700" : "text-gray-800"
                        }`}
                      >
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                No hay información disponible para este movimiento.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </LocalizationProvider>
  );
}
