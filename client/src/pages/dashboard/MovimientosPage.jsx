import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  activitiesAPI,
  asicAPI,
  typePaySheetsAPI,
  usersAPI,
} from "../../services/api.js";
import { MaterialReactTable } from "material-react-table";
import { API_URL } from "../../config/env.js";
import withoutPhoto from "../../assets/withoutPhoto.png";
import { Icon } from "@iconify/react";
import { cities } from "../../constants/cities.js";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale"; // Para español
import PrintPage from "../../components/planilla.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/forms/FormField.jsx";

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


  const columns = useMemo(
    () => [

      {
        accessorKey: "created_at",
        header: "Fecha",
        size: 155,
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
      },
      {
        accessorKey: "user.full_name",
        header: "Realizado por",
        size: 150,
        enableColumnFilter: true,
        enableSorting: true,
   
      },
      {
        accessorKey: "activity",
        header: "Actividad",
        size: 150,
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "id_affected",
        header: "Cód afectado",
        size: 150,
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
                  setPDFdata({
                    ...cell.row.original,
                    ...cell.row.original.pay_sheet,
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
  // Move useMemo outside the map - process all test sections at once

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    console.log({ columnFilters });

    try {
      const res = await activitiesAPI.getActivities({
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
      console.log({res})
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
        <h1 className="text-lg md:text-2xl font-bold mb-4 ">
          Movimientos
        </h1>

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
          <p>{JSON.stringify(PDFdata, null, 2)}</p>
        </div>
      </Modal>
    </LocalizationProvider>
  );
}
