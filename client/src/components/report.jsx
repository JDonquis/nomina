import React, { forwardRef, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Icon } from "@iconify/react";
import secretaria_logo from "../assets/secretaria_logo.webp";
import cintilloCorto from "../assets/cintilloCorto.webp";

import FuturisticButton from "./FuturisticButton";

const PrintableContent = forwardRef((props, ref) => {
  const { data, year } = props;
  const { asics, days } = data;
  return (
    <div
      ref={ref}
      className="w-full mx-auto bg-white relative"
      style={{
        padding: "3mm",
        width: "320mm",
        paddingTop: "0mm !important",
      }}
    >
      <header
        style={{
          marginBlock: "12px !important",
          marginBottom: "12px !important",
        }}
        className="my-2  mb-0 relative flex  justify-between items-center py-4"
      >
        <img
          src={cintilloCorto}
          alt=""
          className="w-36 h-auto"
          width={288}
          loading="eager"
        />
        <div className="-ml-10">
          <h3 className="text-center font-bold  gap-3 my-3  mt-4 text-color1">
            REPORTE DE CENSADOS POR CADA ASIC DURANTE EL PERIODO DE CENSO {year}
          </h3>
          <h4 className="text-center font-bold  gap-3 my-3  -mt-3 text-gray-600">
            OFICINA DE RECURSOS HUMANOS
          </h4>
        </div>
        <img
          src={secretaria_logo}
          alt=""
          className="w-12 h-auto"
          width={48}
          loading="eager"
        />
      </header>

      <table className="border text-left rounded-md w-full">
        <thead>
          <tr>
            <th rowSpan={2} className="px-2 p-1" style={{ width: "300px" }}>
              ASIC
            </th>

            <th
              className=" bg-gray-200 text-center px-2 p-1 "
              colSpan={days.length}
            >
              DIA
            </th>
            <th className=" bg-gray-50  px-2 p-1 text-right" rowSpan={2}>
              TOTAL
            </th>
          </tr>

          <tr className="bg-gray-100 text-sm ">
            {days.map((day) => (
              <th className="p-1 px-2 w-[37px] font-semibold" key={day.id}>
                {day.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="">
          {asics.map((asic) => (
            <tr key={asic.id} className="odd:bg-white even:bg-gray-50">
              <td className="p-1 px-2 border-r text-sm">{asic.name}</td>

              {days.map((day) => (
                <td
                  className="p-1 px-2 w-[37px] text-right border-r"
                  key={day.id}
                >
                  {asic.censadosPorDia[day.id] ?? "-"}
                </td>
              ))}
              <td className="p-1 px-2 text-right">
                {Object.values(asic.censadosPorDia).reduce((a, b) => a + b, 0)}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-100 text-sm text-right font-bold">
            <td
              colSpan={days.length + 1}
              className="p-1 px-2 border-r text-left text-sm "
            >
              TOTAL
            </td>
            <td className="p-1 px-2 text-right">
              {asics.reduce((total, asic) => {
                const asicTotal = Object.values(asic.censadosPorDia).reduce(
                  (a, b) => a + b,
                  0,
                );
                return total + asicTotal;
              }, 0)}
            </td>
          </tr>
        </tbody>
      </table>
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
      }
      /* ⭐ MISSING: Force print background colors */
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
            className="flex gap-2 text-xl mx-auto py-1 px-2 "
          >
            <Icon
              icon="material-symbols:download-rounded"
              className="w-6 min-h-7 text-gray-700  mr-3 inline "
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
