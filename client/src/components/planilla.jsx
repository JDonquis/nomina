import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Icon } from "@iconify/react";
import SecretrariaLogo from "../assets/secretaria_logo.png";
import withoutPhoto from "../assets/withoutPhoto.png";

import FuturisticButton from "./FuturisticButton";
import cintillo from "../assets/cintillo.jpeg";
import { API_URL } from "../config/env.js";

const calculateAge = (birthDate) => {
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
  ) {
    age--;
  }

  return age;
};

const PrintableContent = forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      className="w-full mx-auto bg-white relative"
      style={{
        padding: "10mm",
        width: "210mm",
        height: "297mm",
        paddingTop: "0mm !important",
      }}
    >
      <header
        style={{
          marginBlock: "30px !important",
          marginBottom: "30px !important",
        }}
        className="my-2  mb-0 relative flex flex-col justify-center items-center py-4"
      >
        <img src={cintillo} alt="" className="w-full h-auto" />

        <h3 className="text-center font-bold  gap-3 my-3  mt-4 text-color1">
          PLANILLA DEL CENSO DE FE DE VIDA DEL PERSONAL JUBILADO Y PENSIONADO
        </h3>
        <h4 className="text-center font-bold  gap-3 my-3  -mt-3 text-gray-600">
          OFICINA DE RECURSOS HUMANOS
        </h4>
      </header>
      <div className="flex mt-5">
        <div>
          <div className="flex justify-center items-center">
            {props.data.status ? (
              <div className="min-h-7 items-center flex justify-center bg-color2 rounded-tl-md w-full text-center">
                <p className="text-white font-bold">CENSADO</p>
              </div>
            ) : (
              <div className="bg-dark min-h-7 items-center flex justify-center  rounded-tl-md w-full text-center">
                <p className="text-white/75 text-sm ">NO CENSADO</p>
              </div>
            )}
          </div>
          <img
            src={ props.data.photo ? API_URL + "/storage/" + props.data.photo : withoutPhoto}
            alt="Profile"
            style={{
              width: "124px",
              height: "136px",
              borderRadius: "0  0px 0px 6px",
              objectFit: "cover",
            }}
            // This ensures the image is loaded before the print dialog opens
            loading="lazy"
          />
        </div>
        <div>
          <div className="grid grid-cols-12 text-sm">
            <div className="col-span-2">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Nacionalidad</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.nac}</p>
              </div>
            </div>
            <div className="col-span-3">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Cédula</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.ci}</p>
              </div>
            </div>
            <div className="col-span-6">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Nombres y Apellidos</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.full_name}</p>
              </div>
            </div>
            <div className="col-span-1">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Sexo</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.sex}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 text-sm">
            <div className="col-span-5">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Tipo de personal</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">
                  {props.data.type_pay_sheet.type_personal}
                </p>
              </div>
            </div>
            <div className="col-span-7">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Ubicación administrativa</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">
                  {props.data.administrative_location?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 text-sm">
            <div className="col-span-2">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Fecha_nac</p>
              </div>
              <div className="px-3 min-h-7 text-xs flex items-center pt-0.5">
                <p className="font-semibold">{props.data.date_birth.replaceAll("-", "/")}</p>
              </div>
            </div>

            <div className="col-span-1">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Edad</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">
                  {calculateAge(props.data.date_birth)}
                </p>
              </div>
            </div>
            <div className="col-span-2">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Ciudad</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.city}</p>
              </div>
            </div>
            <div className="col-span-3">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Estado</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.state}</p>
              </div>
            </div>

            <div className="col-span-4">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>N°. Tel_Movil</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.phone_number}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-center font-bold  gap-3 mb-2  mt-4">
        Datos de la Pension
      </h3>

      <div className="grid grid-cols-12 text-sm">
        <div className="col-span-4">
          <div className="px-3 min-h-7 flex items-center bg-gray-200">
            <p>Tipo de Pensión</p>
          </div>
          <div className="px-3 min-h-7 flex items-center pt-0.5">
            <p className="font-semibold">{props.data.type_pension}</p>
          </div>
        </div>
        <div className="col-span-4">
          <div className="px-3 min-h-7 flex items-center bg-gray-200">
            <p>Último Cargó</p>
          </div>
          <div className="px-3 min-h-7 flex items-center pt-0.5">
            <p className="font-semibold">{props.data.last_charge}</p>
          </div>
        </div>
        <div className="col-span-4">
          <div className="px-3 min-h-7 flex items-center bg-gray-200">
            <p>Estado Civil</p>
          </div>
          <div className="px-3 min-h-7 flex items-center pt-0.5">
            <p className="font-semibold">{props.data.civil_status}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 text-sm">
        <div className="col-span-4">
          <div className="px-3 min-h-7 flex items-center bg-gray-200">
            <p>Nro. Hijos Menores</p>
          </div>
          <div className="px-3 min-h-7 flex items-center pt-0.5">
            <p className="font-semibold">{props.data.minor_child_nro}</p>
          </div>
        </div>
        <div className="col-span-4">
          <div className="px-3 min-h-7 flex items-center bg-gray-200">
            <p>Nro. Hijos Discapacitados</p>
          </div>
          <div className="px-3 min-h-7 flex items-center pt-0.5">
            <p className="font-semibold">{props.data.disabled_child_nro}</p>
          </div>
        </div>
        <div className="col-span-4">
          <div className="px-3 min-h-7 flex items-center bg-gray-200">
            <p>Recibe Pensión de Otra Org.</p>
          </div>
          <div className="px-3 min-h-7 flex items-center pt-0.5">
            <p className="font-semibold">
              {props.data.receive_pension_from_another_organization_status
                ? "Sí"
                : "No"}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 text-sm">
        <div className="col-span-4">
          <div className="px-3 min-h-7 flex items-center bg-gray-200">
            <p>Nombre de la Otra Org.</p>
          </div>
          <div className="px-3 min-h-7 flex items-center pt-0.5">
            <p className="font-semibold">
              {props.data.another_organization_name}
            </p>
          </div>
        </div>
        <div className="col-span-4">
          <div className="px-3 min-h-7 flex items-center bg-gray-200">
            <p>Tiene Autorizaciones</p>
          </div>
          <div className="px-3 min-h-7 flex items-center pt-0.5">
            <p className="font-semibold">
              {props.data.has_authorizations ? "Sí" : "No"}
            </p>
          </div>
        </div>
        <div className="col-span-4">
          <div className="px-3 min-h-7 flex items-center bg-gray-200">
            <p>Nombre de la Nómina</p>
          </div>
          <div className="px-3 min-h-7 flex items-center pt-0.5">
            <p className="font-semibold text-xs">
              {props.data.type_pay_sheet.name}
            </p>
          </div>
        </div>
      </div>

      {props.data.pension_survivor_status ? (
        <>
          <h3 className="text-center font-bold  gap-3 mb-2  mt-4">
            Pensión Sobrevivencia
          </h3>
          <div className="grid grid-cols-12 text-sm">
            <div className="col-span-4">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Nombre Completo del Causante</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.fullname_causative}</p>
              </div>
            </div>
            <div className="col-span-4">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Edad del Causante</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.age_causative}</p>
              </div>
            </div>
            <div className="col-span-4">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Parentesco con el Causante</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.parent_causative}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 text-sm">
            <div className="col-span-4">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Sexo del Causante</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.sex_causative}</p>
              </div>
            </div>
            <div className="col-span-4">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>C.I del Causante</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.ci_causative}</p>
              </div>
            </div>
            <div className="col-span-4">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Fecha de Fallecimiento</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.decease_date}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 text-sm">
            <div className="col-span-8">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Suspender Pago</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">
                  {props.data.suspend_payment_status ? "Sí" : "No"}
                </p>
              </div>
            </div>
            <div className="col-span-4">
              <div className="px-3 min-h-7 flex items-center bg-gray-200">
                <p>Último Pago</p>
              </div>
              <div className="px-3 min-h-7 flex items-center pt-0.5">
                <p className="font-semibold">{props.data.last_payment}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-center font-bold  gap-3 mb-2  mt-4">
            Pensión Sobrevivencia
          </h3>
          <p className="text-center font-semibold text-sm">No aplica</p>
        </>
      )}

      <div className="grid grid-cols-2">
        <div className="col-span-1">
          <h4 className="text-left pl-3 font-semibold bg-gray-200  gap-3 mb-2  mt-4">
            Firma del jubilado o pensionado
          </h4>
          <div className="border border-gray-300 w-full h-28"></div>
        </div>
        <div className="col-span-1">
          <h4 className="pr-3 text-right font-semibold bg-gray-200  gap-3 mb-2  mt-4">
            Huellas dactilares del jubilado o pensionado
          </h4>
          <div className="grid grid-cols-2">
            <div className="border border-gray-300 w-full h-28">
              <p className="text-center text-xs  pt-2">Pulgar izquierdo</p>
            </div>
            <div className="border border-gray-300 w-full h-28">
              <p className="text-center text-xs  pt-2">Pulgar Derecho</p>
            </div>
          </div>
        </div>
      </div>

      {props.data.latest_census && (
        <>
          <div className="bg-gray-200 mt-3 py-0.5 text-center">
            <p>Funcionario responsable del censo</p>
          </div>
          <div className="flex justify-between">
            <p>{props.data.latest_census?.user?.full_name}</p>
            <p>{props.data.latest_census?.user?.charge}</p>
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
    documentTitle: `Planilla_${props.data.full_name}_${props.data.ci}_${props.data.latest_census?.created_at}`,
    pageStyle: `
      @page {
        size: A4;
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
  console.log(props.data)

  return (
    <div>
  
        {props.data.status ? (
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
      {props.data  && (
        <PrintableContent
          data={props.data}
          ref={componentRef}
          className=""
          size="A4"
        />
      )}
    </div>
  );
};

export default PrintPage;
