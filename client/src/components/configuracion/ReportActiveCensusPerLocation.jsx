import React, { forwardRef, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Icon } from "@iconify/react";
import secretaria_logo from "../../assets/secretaria_logo.webp";
import cintilloCorto from "../../assets/cintilloCorto.webp";

import FuturisticButton from "../FuturisticButton";
const year = new Date().getFullYear();

const PrintableContent = forwardRef((props, ref) => {
  console.log({ props });

  // Desestructuración para un código más limpio
  const { asicName, dependencyName, unitName, departmentName, serviceName } =
    props.data.dataType;

  // Filtrar los niveles existentes para renderizarlos limpiamente
  const levels = [
    asicName,
    dependencyName,
    unitName,
    departmentName,
    serviceName,
  ].filter(Boolean);

  return (
    <div
      ref={ref}
      className="w-full mx-auto bg-white relative p-[3mm]"
      style={{ paddingTop: "0mm !important" }}
    >
      {/* Header Corregido y Centrado */}
      <header className="my-2 mb-4 relative flex  justify-between py-4 pb-4">
        {/* Logo Izquierdo */}
        <div className="w-40 flex ">
          <img
            src={cintilloCorto}
            alt="Ministerio de Salud"
            className="h-min max-w-full object-contain"
            width={160}
            loading="eager"
          />
        </div>

        {/* Contenedor Central Perfectamente Alineado */}
        <div className="flex-1 text-center px-4 w-full">
          <h3 className="font-bold text-lg tracking-wide text-color1 uppercase">
            Personal Activo
          </h3>
          <h3 className="font-bold text-base  text-color1">CENSO {year}</h3>

          {/* Diseño optimizado para los niveles de la estructura */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 my-3 max-w-2xl mx-auto w-full">
            {levels.map((level, index) => (
              <React.Fragment key={index}>
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-md text-xs font-semibold border border-gray-200 shadow-sm whitespace-nowrap">
                  {level}
                </span>
                {index < levels.length - 1 && (
                  <Icon
                    icon="tabler:chevron-right"
                    className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <h4 className="font-bold text-xs tracking-wider text-gray-500 uppercase mt-2">
            Oficina de Recursos Humanos
          </h4>
          <p className="text-[11px] text-gray-400 mt-1">
            Generado el {new Date().toLocaleDateString()} a las{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Logo Derecho */}
        <div className="w-40 flex justify-end">
          <img
            src={secretaria_logo}
            alt="Secretaría de Salud"
            className="h-14 w-auto object-contain"
            width={56}
            loading="eager"
          />
        </div>
      </header>

      {/* Tabla Estilizada */}
      <table className="min-w-full border-collapse border border-gray-300 text-left text-sm rounded-md overflow-hidden">
        <thead>
          <tr className="bg-gray-50 text-gray-700 border-b border-gray-300">
            <th className="py-2 px-3 font-semibold border-r border-gray-300">
              Nombre completo
            </th>
            <th className="py-2 px-3 font-semibold border-r border-gray-300">
              C.I
            </th>
            {props.data.type === "Estado Falcón" && (
              <th className="py-2 px-3 font-semibold border-r border-gray-300">
                ASIC
              </th>
            )}

            <th className="py-2 px-3 font-semibold border-r border-gray-300">
              Cargo
            </th>
            <th className="py-2 px-3 font-semibold border-r">Nómina</th>
            <th className="py-2 px-3 font-semibold border-r border-gray-300">
              Status laboral
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 text-gray-800">
          {props.data.data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50/50">
              <td className="py-2 px-3 border-r border-gray-200">
                {item.full_name}
              </td>
              <td className="py-2 px-3 border-r border-gray-200">{item.ci}</td>
              {props.data.type === "Estado Falcón" && (
                <td className="py-2 px-3 border-r border-gray-200">
                  {item.asic.name.replace("ASIC", "")}
                </td>
              )}
              <td className="py-2 px-3 border-r border-gray-200">
                {item.additional_data.job_title}
              </td>
              <td className="py-2 px-3 border-r">
                {item.additional_data.personnel_type}
              </td>
              <td className="py-2 px-3">{item.additional_data.work_status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sección de Firma */}
      {props.data.type !== "Estado Falcón" && (
        <div className="mt-12 text-center max-w-xs mx-auto border-t border-gray-400 pt-2">
          <p className="text-xs font-semibold text-gray-700 uppercase">
            Firma del jefe{" "}
            {props.data.type === "ASIC" ||
            props.data.type === "Servicio" ||
            props.data.type === "Departamento"
              ? "del"
              : "de la"}{" "}
            <span className="font-bold">{props.data.type}</span>
          </p>
        </div>
      )}
      {props.data.type == "Estado Falcón" && (
        <>
          <div className="mt-12 text-center max-w-xs mx-auto border-t border-gray-400 pt-2">
            <p className="text-xs font-semibold text-gray-700 uppercase">
              Realizado
            </p>
          </div>
          <div className="mt-12 text-center max-w-xs mx-auto border-t border-gray-400 pt-2">
            <p className="text-xs font-semibold text-gray-700 uppercase">
              Revisado
            </p>
          </div>
          <div className="mt-12 text-center max-w-xs mx-auto border-t border-gray-400 pt-2">
            <p className="text-xs font-semibold text-gray-700 uppercase">
              Confirmado
            </p>
          </div>
        </>
      )}
    </div>
  );
});

const PrintPage = (props) => {
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Reporte_${props.year}`,
    pageStyle: `
      @page {
        size: legal landscape;
        margin: 4mm;
      }
      body {
        font-family: Arial, sans-serif;
        color: black;
        background-color: white;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    `,
  });

  return (
    <div>
      {props.data ? (
        <div className="flex justify-center mb-4">
          <FuturisticButton
            onClick={handlePrint}
            title="Imprimir"
            className="flex gap-2 text-xl mx-auto py-1 px-2"
          >
            <Icon
              icon="material-symbols:download-rounded"
              className="w-6 min-h-7 text-gray-700 mr-3 inline"
            />
            <span>Descargar / Imprimir</span>
          </FuturisticButton>
        </div>
      ) : null}
      {props.data && (
        <PrintableContent
          data={props.data}
          year={props.year}
          ref={componentRef}
          className=""
          size="A4"
        />
      )}
    </div>
  );
};

export default PrintPage;
