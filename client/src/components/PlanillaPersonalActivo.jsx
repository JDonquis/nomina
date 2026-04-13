import React, { forwardRef, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Icon } from "@iconify/react";
import FuturisticButton from "./FuturisticButton";
import cintillo from "../assets/cintillo.jpeg";
import withoutPhoto from "../assets/withoutPhoto.webp";
import { API_URL } from "../config/env.js";

const calculateAge = (birthDate) => {
  if (!birthDate) return "N/A";
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

const civilStatusMap = {
  S: "Soltero",
  C: "Casado",
  V: "Viudo",
  D: "Divorciado",
};

const PrintablePersonalActivo = forwardRef((props, ref) => {
  const { data } = props;
  const familyMembers = data?.family_members || [];

  console.log("Datos del personal activo:", data);

  return (
    <div
      ref={ref}
      className="w-full mx-auto bg-white relative"
      style={{
        padding: "10mm",
        width: "210mm",
        minHeight: "297mm",
      }}
    >
      <header className="my-2 mb-0 relative flex flex-col justify-center items-center py-3">
        <img
          src={cintillo}
          alt=""
          className="w-full h-auto"
          width={1120}
          height={140}
          loading="eager"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <h3 className="text-center flex font-bold gap-3 my-3 mt-4 text-color1 text-lg">
          FICHA DE PERSONAL ACTIVO
          <span className="text-xs text-dark bg-gray-200 px-2 py-1 rounded">{data.audit_logs[data.audit_logs.length - 1].id}</span>
        </h3>
        <h4 className="text-center font-bold gap-3 -mt-2 text-gray-600 text-sm">
          OFICINA DE RECURSOS HUMANOS
        </h4>
      </header>

      <div className="flex mt-4">
        <div className="flex flex-col">
          <div className="flex justify-center items-center">
            {data.status ? (
              <div className="min-h-6 items-center flex justify-center bg-color2 rounded-tl-md w-full text-center px-2">
                <p className="text-white font-bold text-xs">ACTIVO</p>
              </div>
            ) : (
              <div className="bg-dark min-h-6 items-center flex justify-center rounded-tl-md w-full text-center px-2">
                <p className="text-white/75 text-xs">INACTIVO</p>
              </div>
            )}
          </div>
          <img
            src={data.photo ? API_URL + "/storage/" + data.photo : withoutPhoto}
            alt="Foto"
            style={{
              width: 100,
              height: 110,
              borderRadius: "0 0 0 6px",
              objectFit: "cover",
            }}
            loading="lazy"
            onError={(e) => {
              e.target.src = withoutPhoto;
            }}
          />
        </div>

        <div className="flex-1 ">
          <div className="grid grid-cols-12 text-xs gap-px bg-gray-300 border border-gray-300">
            <div className="col-span-1 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Nac</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{data.nac}</p>
              </div>
            </div>
            <div className="col-span-2 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Cédula</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{data.ci}</p>
              </div>
            </div>
            <div className="col-span-6 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Nombres y Apellidos</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{data.full_name}</p>
              </div>
            </div>
            <div className="col-span-2 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Fec. Nac.</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">
                  {data.date_birth?.replaceAll("-", "/") || "N/A"}
                </p>
              </div>
            </div>
            <div className="col-span-1 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Edad</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{calculateAge(data.date_birth)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 text-xs gap-px bg-gray-300 border border-gray-300 mt-0.5">
            <div className="col-span-1 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Sexo</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{data.sex}</p>
              </div>
            </div>
            <div className="col-span-2 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Edo. Civil</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">
                  {civilStatusMap[data.civil_status] || data.civil_status}
                </p>
              </div>
            </div>
            <div className="col-span-6 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Correo Electrónico</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold text-xs">{data.email || "N/A"}</p>
              </div>
            </div>
            <div className="col-span-3 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Teléfono Móvil</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{data.mobile_phone || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 text-xs gap-px bg-gray-300 border border-gray-300 mt-0.5">
            <div className="col-span-9 bg-white">
              <div className="px-2 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">
                  Dirección de Habitación
                </p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{data.address || "N/A"}</p>
              </div>
            </div>
            <div className="col-span-1 bg-white">
              <div className="px-1 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Camisa</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{data.shirt_size || "N/A"}</p>
              </div>
            </div>
            <div className="col-span-1 bg-white">
              <div className="px-0.5 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Pantalón</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{data.pant_size || "N/A"}</p>
              </div>
            </div>
            <div className="col-span-1 bg-white">
              <div className="px-1 py-0.5 bg-gray-100">
                <p className="font-medium text-gray-600">Zapato</p>
              </div>
              <div className="px-2 py-1">
                <p className="font-semibold">{data.shoe_size || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    

      <div className="grid grid-cols-12 text-xs gap-px bg-gray-300 border border-gray-300 mt-0.5">
        <div className="col-span-4 bg-white">
          <div className="px-2 py-0.5 bg-gray-100">
            <p className="font-medium text-gray-600">Nivel académico</p>
          </div>
          <div className="px-2 py-1">
            <p className="font-semibold">{data.degree_obtained || "N/A"}</p>
          </div>
        </div>
        <div className="col-span-4 bg-white">
          <div className="px-2 py-0.5 bg-gray-100">
            <p className="font-medium text-gray-600">Pregrado</p>
          </div>
          <div className="px-2 py-1">
            <p className="font-semibold">
              {data.undergraduate_degree || "N/A"}
            </p>
          </div>
        </div>
        <div className="col-span-4 bg-white">
          <div className="px-2 py-0.5 bg-gray-100">
            <p className="font-medium text-gray-600">Postgrado</p>
          </div>
          <div className="px-2 py-1">
            <p className="font-semibold">{data.postgraduate_degree || "N/A"}</p>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="bg-color1 text-white text-xs font-bold px-3 py-1 rounded-t">
          I. DATOS ADMINISTRATIVOS
        </div>
        <div className="grid grid-cols-12 text-xs gap-px bg-gray-300 border border-gray-300">
          <div className="col-span-6 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">ASIC</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">
                {data.asic.name || "N/A"}
              </p>
            </div>
          </div>
           <div className="col-span-6 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">Dependencia</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">
                {data.dependency?.name || "N/A"}
              </p>
            </div>
          </div>
          <div className="col-span-4 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">Unidad Administrativa</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">
                {data.administrative_unit?.name || "N/A"}
              </p>
            </div>
          </div>

          <div className="col-span-4 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">Departamento</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">{data.department?.name || "N/A"}</p>
            </div>
          </div>
          <div className="col-span-4 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">Servicio</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">{data.service?.name || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 text-xs gap-px bg-gray-300 border border-gray-300 mt-px">
          <div className="col-span-4 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600"> Nómina</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">
                <span className="font-semibold">
                  {data.type_personnel.code}
                </span>{" "}
                | {data.type_personnel.name || "N/A"}
              </p>
            </div>
          </div>
          <div className="col-span-4 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">
                Cód. Cargo / Título del Cargo
              </p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">
                {data.job_code} | {data.job_title || "N/A"}
              </p>
            </div>
          </div>

          <div className="col-span-4 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">Fecha Ingreso</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">
                {data.entry_date?.replaceAll("-", "/") || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 text-xs gap-px bg-gray-300 border border-gray-300 mt-px">
          <div className="col-span-2 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">Cód. puesto</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">{data.position_code || "N/A"}</p>
            </div>
          </div>

          <div className="col-span-2 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">Turno</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">{data.shift || "N/A"}</p>
            </div>
          </div>
          <div className="col-span-3 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">Grado</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">{data.grade || "N/A"}</p>
            </div>
          </div>
          <div className="col-span-5 bg-white">
            <div className="px-2 py-0.5 bg-gray-100">
              <p className="font-medium text-gray-600">Nº Cuenta de Banco</p>
            </div>
            <div className="px-2 py-1">
              <p className="font-semibold">
                {data.bank_account_number || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="bg-color2 text-white text-xs font-bold px-3 py-1 rounded-t">
          II. CARGA FAMILIAR
        </div>
        <div className="bg-gray-300 border border-gray-300">
          <div className="grid grid-cols-12 text-xs gap-px bg-gray-400 ">
            <div className="col-span-2 bg-gray-200 px-2 py-1">
              <p className="font-semibold text-center">Cédula</p>
            </div>
            <div className="col-span-5 bg-gray-200 px-2 py-1">
              <p className="font-semibold text-center">Nombres y Apellidos</p>
            </div>
            <div className="col-span-2 bg-gray-200 px-2 py-1">
              <p className="font-semibold text-center">Fecha Nac.</p>
            </div>
            <div className="col-span-1 bg-gray-200 px-2 py-1">
              <p className="font-semibold text-center">Sexo</p>
            </div>
            <div className="col-span-2 bg-gray-200 px-2 py-1">
              <p className="font-semibold text-center">Parentesco</p>
            </div>
          </div>
          {familyMembers.length === 0 ? (
            <div className="grid grid-cols-12 text-xs gap-px bg-white">
              <div className="col-span-12 bg-white px-2 py-2 text-center text-gray-500">
                Sin carga familiar registrada
              </div>
            </div>
          ) : (
            familyMembers.map((member, index) => (
              <div key={index} className="grid grid-cols-12 text-xs gap-px">
                <div className="col-span-2 bg-white px-2 py-1">
                  <p className="font-semibold text-center">
                    {member.ci || "N/A"}
                  </p>
                </div>
                <div className="col-span-5 bg-white px-2 py-1">
                  <p className="font-semibold">{member.full_name || "N/A"}</p>
                </div>
                <div className="col-span-2 bg-white px-2 py-1">
                  <p className="font-semibold text-center">
                    {member.date_birth?.replaceAll("-", "/") || "N/A"}
                  </p>
                </div>
                <div className="col-span-1 bg-white px-2 py-1">
                  <p className="font-semibold text-center">
                    {member.sex || "N/A"}
                  </p>
                </div>
                <div className="col-span-2 bg-white px-2 py-1">
                  <p className="font-semibold text-center">
                    {member.relationship || "N/A"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="bg-gray-300  text-xs font-bold px-3 py-1 rounded-t">
          III. OBSERVACIONES
        </div>
        <div
          className=" p-2 bg-white border border-t-0 border-gray-300 text-xs"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {data.observation || "Sin observaciones"}
        </div>
      </div>

      <div className="grid grid-cols-2 mt-4 gap-4">
        <div>
          <div className="bg-gray-200 text-xs font-semibold px-3 py-1 rounded-t">
            Firma del Trabajador
          </div>
          <div className="border border-t-0 border-gray-300 w-full h-24"></div>
        </div>
        <div>
          <div className="bg-gray-200 text-xs font-semibold px-3 py-1 rounded-t">
            Huellas Dactilares
          </div>
          <div className="grid grid-cols-2 border border-t-0 border-gray-300">
            <div className="h-24 flex flex-col items-center justify-end pb-1">
              <div className=" w-10 h-12 rounded-b"></div>
              <p className="text-xs text-gray-500 mt-1">Pulg. Izq.</p>
            </div>
            <div className="h-24 flex flex-col items-center justify-end pb-1 border-l border-gray-300">
              <div className=" w-10 h-12 rounded-b"></div>
              <p className="text-xs text-gray-500 mt-1">Pulg. Der.</p>
            </div>
          </div>
        </div>
      </div>
        {props.data && (
        <>
          <div className="bg-gray-200 mt-3 py-0.5 text-center">
            <p>Funcionario responsable del censo</p>
          </div>
          <div className=" flex justify-between items-center">
            <p>{props.data?.audit_logs[props.data?.audit_logs.length - 1]?.user?.full_name}</p>
            <p className="text-xs mt-1">
              Censado el{" "}
              {new Date(props.data?.updated_at).toLocaleString(
                navigator.language,
                {
                  dateStyle: "medium",
                  timeStyle: "short",
                }
              )}
            </p>
            <p>{props.data?.audit_logs[props.data?.audit_logs.length - 1]?.user?.charge}</p>
          </div>
        </>
      )}
    </div>
  );
});

const PlanillaPersonalActivo = (props) => {
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `PersonalActivo_${props.data?.full_name}_${props.data?.ci}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      body { font-family: Arial, sans-serif; color: black; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    `,
  });

  return (
    <div>
      {props.data?.status && (
        <div className="flex justify-center mb-4">
          <FuturisticButton
            onClick={handlePrint}
            className="flex gap-2 text-xl mx-auto py-1 px-2"
          >
            <Icon
              icon="material-symbols:download-rounded"
              className="w-6 min-h-7 text-gray-700 mr-3 inline"
            />
            <span>Descargar / Imprimir</span>
          </FuturisticButton>
        </div>
      )}
      {props.data && (
        <PrintablePersonalActivo data={props.data} ref={componentRef} />
      )}
    </div>
  );
};

export default PlanillaPersonalActivo;
