import React, { forwardRef, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Icon } from "@iconify/react";
import secretaria_logo from "../../assets/secretaria_logo.webp";
import cintilloCorto from "../../assets/cintilloCorto.webp";

import FuturisticButton from "../FuturisticButton";
const year = new Date().getFullYear();

const PrintableContent = forwardRef((props, ref) => {
  console.log({ props });
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
        <div className="flex-1 text-center px-4 w-full min-w-[300px]">
          <h3 className="font-bold text-lg tracking-wide text-color1 uppercase">
            Tipos de Personal Activo
          </h3>
          <h3 className="font-bold text-base  text-color1">CENSO {year}</h3>

          <h4 className="font-bold text-xs tracking-wider text-gray-500 uppercase mt-2">
            Oficina de Recursos Humanos
          </h4>
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

      <ol className="">
        {Object.entries(props.data.data).map(([job, amount], i) => (
          <li key={job} className="border-b border-gray-200 py-1">
            <span className="text-xs text-gray-400">{i + 1}.</span> {job} :{" "}
            <b>{amount}</b>
          </li>
        ))}
      </ol>
    </div>
  );
});

const PersonnelsReport = (props) => {
  console.log(props.data);
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Reporte_Cargos_${props.year}`,
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

export default PersonnelsReport;
