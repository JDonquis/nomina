import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  activitiesAPI,
  asicAPI,
  typePaySheetsAPI,
  usersAPI,
} from "../../services/api.js";
import { MaterialReactTable } from "material-react-table";
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
  activity: "",
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

export default function MovimientosPage() {
  const [administrativeLocations, setAdministrativeLocations] = useState([]);
  const [typePaySheets, setTypePaySheets] = useState([]);
  const [users, setUsers] = useState([]);
  const [detailModal, setDetailModal] = useState(false);
  const [PDFdata, setPDFdata] = useState({});

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
      }, 300),
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
        accessorKey: "activity",
        header: "Actividad",
        size: 150,
        enableColumnFilter: true,
        filterVariant: "select",

        filterSelectOptions: [
          //       case CENSUS_CREATED = 'Creacion de Censo';
          // case CENSUS_UPDATED = 'Actualizacion de Censo';
          // case CENSUS_DELETED = 'Eliminacion de Censo';
          // case PAYSHEET_CREATED = 'Creacion de registro';
          // case PAYSHEET_UPDATED = 'Actualizacion de registro';
          // case PAYSHEET_DELETED = 'Eliminación de registro';
          // case REPOSITORY_EXPORT = 'Repositorio exportado';
          // case REPOSITORY_IMPORT = 'Repositorio importado'
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
        accessorKey: "pay_sheet.id",
        header: "Cód del trabajador afectado",
        size: 250,
        enableColumnFilter: true,
        enableSorting: true,
      },

      // {
      //   accessorKey: "id",
      //   header: "Cód",
      //   size: 60,
      //   enableColumnFilter: true,
      //   enableSorting: true,
      // },
      // {
      //   accessorKey: "pay_sheet.photo",
      //   header: "Foto",
      //   size: 110,
      //   filterFn: "includesString",
      //   enableColumnFilter: true,
      //   enableSorting: true,
      //   Cell: ({ cell }) =>
      //     cell.getValue() ? (
      //       <img
      //         src={API_URL + "/storage/" + cell.getValue()}
      //         alt="Profile"
      //         style={{
      //           width: "50px",
      //           height: "50px",
      //           borderRadius: "4px",
      //           objectFit: "cover",
      //         }}
      //         // This ensures the image is loaded before the print dialog opens
      //         loading="lazy"
      //       />
      //     ) : (
      //       <img
      //         src={withoutPhoto}
      //         alt="Profile"
      //         style={{
      //           width: "50px",
      //           height: "50px",
      //           borderRadius: "4px",
      //           objectFit: "cover",
      //         }}
      //         // This ensures the image is loaded before the print dialog opens
      //         loading="lazy"
      //       />
      //     ),
      // },
      // {
      //   accessorKey: "pay_sheet.full_name",
      //   header: "Nombre completo",
      //   size: 110,
      //   filterFn: "includesString",
      //   enableColumnFilter: true,
      //   enableSorting: true,
      // },
      // {
      //   accessorKey: "pay_sheet.ci",
      //   header: "CI",
      //   size: 100,
      //   filterFn: "includesString",
      //   enableColumnFilter: true,
      //   enableSorting: true,
      // },

      // //   {
      // //     accessorKey: "pay_sheet.email",
      // //     header: "Correo Electrónico",
      // //     size: 200,
      // //   },
      // {
      //   accessorKey: "pay_sheet.phone_number",
      //   header: "Teléfono",
      //   size: 100,
      // },
      // {
      //   accessorKey: "city",
      //   header: "Ciudad",
      //   size: 100,
      //   filterVariant: "select",
      //   filterSelectOptions: cities.map((city) => city.label),
      //   enableColumnFilter: true,
      //   enableSorting: true,
      // },

      // {
      //   accessorKey: "pay_sheet.created_at",
      //   header: "Fecha",
      //   size: 155,
      //   enableColumnFilter: true,
      //   filterVariant: "date-range",
      //   enableSorting: true,
      //   Cell: ({ cell }) => {
      //     const dateString = cell.getValue();

      //     // Safety check in case the value is null or undefined
      //     if (!dateString) return "N/A";

      //     return new Date(dateString).toLocaleString(navigator.language, {
      //       dateStyle: "medium",
      //       timeStyle: "short",
      //     });
      //   },
      //   // Optional: make the column look nicer
      //   muiTableBodyCellProps: {
      //     sx: { whiteSpace: "nowrap" },
      //   },
      // },
      // {
      //   header: "Censado por",
      //   accessorKey: "user.full_name",
      //   size: 100,
      //   enableColumnFilter: true,
      //   filterVariant: "select",
      //   filterSelectOptions: users.map((user) => user.full_name),
      //   enableSorting: true,
      // },
      // {
      //   header: "Cargo del Censador",
      //   accessorKey: "user.charge",
      //   size: 100,
      //   filterFn: "includesString",
      //   enableColumnFilter: true,
      //   enableSorting: true,
      // },
      // {
      //   header: "Ubicación administrativa",
      //   accessorKey: "administrative_location.name",
      //   size: 100,
      //   filterVariant: "select",
      //   filterSelectOptions: administrativeLocations.map(
      //     (location) => location.label,
      //   ),
      //   enableColumnFilter: true,
      //   enableSorting: true,
      // },
      // {
      //   header: "Tipo de Pensión",
      //   accessorKey: "type_pension",
      //   size: 100,
      //   filterVariant: "select",
      //   filterSelectOptions: ["Jubilación", "Incapacidad", "Sobrevivencia"],
      //   enableColumnFilter: true,
      //   enableSorting: true,
      // },
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
                  setDetailModal(true);
                  setFormData({
                    ...cell.row.original.pay_sheet,
                    activity: cell.row.original.activity,
                    to_census:
                      cell.row.original.activity === "Creacion de Censo"
                        ? true
                        : false,
                  });
                  console.log(cell.row.original);
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
      setData(res.data);
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
          {/* {PDFdata.activity == "Creación de registro" || PDFdata.activity == "Actualización de registro" ? 
           
          } */}
          <h1 className="text-xl font-bold mb-2 text-gray-300 col-span-2 text-center uppercase ">
            {formData.activity}
          </h1>
          <form
            className={`px-12 space-y-5 md:space-y-0 gap-7 w-full relative`}
          >
            <div className="space-y-3 z-10 md:sticky top-0 h-max mb-24">
              <h2 className="text-xl font-bold mb-2 col-span-2  ">
                Datos personales
              </h2>

              <div className="grid grid-cols-12 gap-4">
                {patientFormFields.map((field, index) => {
                  if (field.name == "photo") {
                    // return (
                    //   <div
                    //     key={field.name + "_" + field.label + index}
                    //     className="mb-5 col-span-12 flex justify-center  pb-4 mx-auto relative"
                    //   >
                    //     <div
                    //       ref={photoOptionsRef}
                    //       className="mx-auto text-gray-600 text-sm"
                    //     >
                    //       <div
                    //         onClick={() =>
                    //           setShowPhotoOptions(!showPhotoOptions)
                    //         }
                    //         className="bg-gray-200 mt-1 rounded-md w-36 h-44 flex items-center justify-center cursor-pointer hover:bg-gray-400 duration-150"
                    //       >
                    //         {formData.photo ? null : (
                    //           <Icon
                    //             icon="tabler:photo-up"
                    //             className="w-20 h-20 text-gray-300"
                    //           />
                    //         )}
                    //         {(formData.photo && submitString === "Registrar") ||
                    //         formData.fotoChanged ? (
                    //           <img
                    //             src={URL.createObjectURL(formData.photo)}
                    //             alt="preview"
                    //             className="w-full h-full object-cover rounded-md"
                    //             width={144}
                    //             height={176}
                    //             loading="lazy"
                    //           />
                    //         ) : null}
                    //         {formData.photo &&
                    //         submitString === "Actualizar" &&
                    //         !formData.fotoChanged ? (
                    //           <img
                    //             src={API_URL + "/storage/" + formData.photo}
                    //             alt="preview"
                    //             className="w-full h-full object-cover rounded-md"
                    //             width={144}
                    //             height={176}
                    //             loading="lazy"
                    //           />
                    //         ) : null}
                    //       </div>
                    //       {/* Photo Options Menu */}
                    //       {showPhotoOptions && (
                    //         <div className="absolute z-50 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                    //           <button
                    //             type="button"
                    //             onClick={openCamera}
                    //             className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 rounded-t-lg"
                    //           >
                    //             <Icon
                    //               icon="mdi:camera"
                    //               className="w-5 h-5 text-color1"
                    //             />
                    //             <span>Tomar foto</span>
                    //           </button>
                    //           <button
                    //             type="button"
                    //             onClick={() => {
                    //               galleryInputRef.current?.click();
                    //               setShowPhotoOptions(false);
                    //             }}
                    //             className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 rounded-b-lg border-t border-gray-200"
                    //           >
                    //             <Icon
                    //               icon="mdi:image"
                    //               className="w-5 h-5 text-color1"
                    //             />
                    //             <span>Subir desde galería</span>
                    //           </button>
                    //         </div>
                    //       )}
                    //     </div>
                    //     {/* Gallery Input */}
                    //     <input
                    //       ref={galleryInputRef}
                    //       type="file"
                    //       name="photo-gallery"
                    //       className="hidden"
                    //       accept="image/*"
                    //       onChange={(e) => {
                    //         if (e.target.files[0]) {
                    //           setFormData({
                    //             ...formData,
                    //             photo: e.target.files[0],
                    //             fotoChanged:
                    //               submitString === "Actualizar" ? true : false,
                    //           });
                    //         }
                    //       }}
                    //     />
                    //   </div>
                    // );
                  } else {
                    return (
                      <>
                        {field.name == "type_pension" && (
                          <>
                            {formData.to_census && (
                              <div className="col-span-12 flex items-center">
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
                            <div className="col-span-12 flex items-center">
                              <h2 className="text-xl min-w-56 mt-3 font-bold mb-2">
                                Pensión sobrevivencia
                              </h2>
                              <hr className="w-full h-0.5 flex-auto bg-gray-300" />
                            </div>
                            <div className="col-span-12">
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
                            readOnly={true}
                          />
                        ) : null}
                      </>
                    );
                  }
                })}
              </div>
            </div>

            <div className="col-span-12">
              <div className="flex justify-end space-x-4 pt-4"></div>
            </div>
          </form>
        </div>
      </Modal>
    </LocalizationProvider>
  );
}
