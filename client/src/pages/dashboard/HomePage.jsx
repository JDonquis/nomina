import React, { useEffect, useState } from "react";
import { examsAPI } from "../../services/api";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { Icon } from "@iconify/react";
import FormField from "../../components/forms/FormField";
import { Skeleton } from "@mui/material";

const MyBar = React.memo(({ data }) => (
  <ResponsiveBar
    data={data}
    keys={["masculino", "femenino"]}
    indexBy="age_range"
    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
    padding={0.3}
    valueScale={{ type: "linear" }}
    indexScale={{ type: "band", round: true }}
    colors={{ scheme: "nivo" }}
    borderColor={{
      from: "color",
      modifiers: [["darker", 1.6]],
    }}
    axisTop={null}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: "Rango de edades",
      legendPosition: "middle",
      legendOffset: 32,
    }}
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: "Género",
      legendPosition: "middle",
      legendOffset: -40,
    }}
    labelSkipWidth={12}
    labelSkipHeight={12}
    labelTextColor={{
      from: "color",
      modifiers: [["darker", 1.6]],
    }}
    legends={[
      {
        dataFrom: "keys",
        anchor: "bottom-right",
        direction: "column",
        justify: false,
        translateX: 120,
        translateY: 0,
        itemsSpacing: 2,
        itemWidth: 100,
        itemHeight: 20,
        itemDirection: "left-to-right",
        itemOpacity: 0.85,
        symbolSize: 20,
        effects: [
          {
            on: "hover",
            style: {
              itemOpacity: 1,
            },
          },
        ],
      },
    ]}
    role="application"
    ariaLabel="Nivo bar chart demo"
    barAriaLabel={(e) =>
      e.id + ": " + e.formattedValue + " in country: " + e.indexValue
    }
  />
));
const PieChart = React.memo(({ data, inPorcentage }) => (
  <ResponsivePie
    data={data}
    innerRadius={0.5}
    margin={{ top: 30, right: 80, bottom: 50, left: 80 }}
    padAngle={0.6}
    cornerRadius={2}
    activeOuterRadiusOffset={8}
    arcLinkLabelsSkipAngle={10}
    arcLinkLabelsTextColor="#333333"
    arcLinkLabelsThickness={2}
    valueFormat={(value) => `${Number(value)}${inPorcentage ? " %" : ""}`}
    arcLinkLabelsColor={{ from: "color" }}
    arcLabelsSkipAngle={10}
    arcLabelsTextColor={{
      from: "color",
      modifiers: [["darker", 4]],
    }}
  />
));

export default function HomePage() {
  const [chartData, setChartData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("this_week");

  const [start_date, setStartDate] = useState(null);
  const [end_date, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // async function fetchChartData() {
  //   if (selectedPeriod === "range" && (!start_date || !end_date)) {
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     const res = await examsAPI.getChartData(selectedPeriod, {
  //       start_date,
  //       end_date,
  //     });
  //     setChartData(res.data);
  //   } catch (e) {
  //     console.error("Failed to fetch chart data", e);
  //   }
  //   setLoading(false);
  // }
  useEffect(() => {
    // fetchChartData();
  }, [selectedPeriod]);

  return (
    <>
      <title>Dashboard - Nómina</title>
      <div>
        <h1 className="text-lg md:text-2xl font-bold mb-4 ">Dashboard</h1>
        <div className="flex flex-col md:flex-row gap-5">
          <FormField
            name={"sex"}
            type={"select"}
            className={"w-max"}
            value={selectedPeriod}
            options={[
              { value: "today", label: "Hoy" },
              { value: "this_week", label: "Esta semana" },
              { value: "this_month", label: "Este mes" },
              { value: "this_year", label: "Este año" },
              { value: "range", label: "Rango personalizado" },
            ]}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
            }}
          />
          {selectedPeriod === "range" && (
            <div className="flex flex-col md:flex-row gap-4 ">
              <FormField
                name={"start_date"}
                type={"date"}
                label={"Fecha de inicio"}
                value={start_date}
                onChange={(e) => {
                  setStartDate(e.target.value);
                }}
              />
              <FormField
                name={"end_date"}
                type={"date"}
                label={"Fecha de fin"}
                value={end_date}
                onChange={(e) => {
                  setEndDate(e.target.value);
                }}
              />
              <button
                className="bg-color1 w-max text-white rounded-md p-2 hover:bg-color2 hover:text-white"
                onClick={fetchChartData}
              >
                Aplicar filtro
              </button>
            </div>
          )}
        </div>

        {chartData && !loading ? (
          <div className="md:grid space-y-4 grid-cols-1 md:grid-cols-4 gap-3 md:gap-6 mt-4">
            <div className="rounded-md p-4 md:p-7 neuphormism hover:shadow-none flex flex-col justify-between ">
              <p>Total Exámenes realizados</p>
              <b className=" text-gray-500 mt-auto text-right w-full ml-auto   flex justify-end items-end">
                <Icon
                  icon="hugeicons:labs"
                  className=" text-6xl block mb-2 text-color3"
                />
                <span
                  className={
                    chartData?.total.total > 999 ? "text-6xl" : `text-9xl`
                  }
                >
                  {chartData?.total.total}
                </span>
              </b>
            </div>

            <div className="rounded-md p-4 md:p-7 neuphormism hover:shadow-none flex flex-col justify-between ">
              <p>Total Pacientes atendidos</p>
              <b className=" text-gray-500 mt-auto text-right w-full ml-auto   flex justify-end items-end">
                <Icon
                  icon="mdi:patient-outline"
                  className=" text-6xl block mb-2 text-color3"
                />
                <span
                  className={
                    chartData?.analyses.total_patients > 999
                      ? "text-6xl"
                      : `text-9xl`
                  }
                >
                  {chartData?.analyses.total_patients}
                </span>
              </b>
            </div>

            <div className="rounded-md p-4 md:p-7 min-h-[300px] relative col-span-2 neuphormism hover:shadow-none">
              <p>Procedencia de pacientes</p>
              <PieChart data={chartData?.origins} />
            </div>

            <div className="rounded-md p-4 md:p-7 min-h-[300px] relative col-span-2 neuphormism hover:shadow-none">
              <p>Distribución de edades y género</p>
              <MyBar data={chartData?.analyses.ageGenderDistribution} />
            </div>

            <div className="rounded-md p-4 md:p-7 min-h-[300px] relative col-span-2 neuphormism hover:shadow-none">
              <p>Tipo de exámenes realizados</p>
              <PieChart data={chartData?.numberPerExamType} />
            </div>

            <div className="col-span-4 ">
              {Object.entries(chartData?.normalitiesTests).map(
                ([exam_key, exam_value]) => (
                  <div key={exam_key} className="mb-10">
                    <h3 className="text-lg font-bold mb-4 ">{exam_key}</h3>
                    <div className="grid md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-2 mt-4 neuphormism">
                      {Object.entries(exam_value).map(
                        ([test_key, arr_test_value]) => (
                          <div
                            key={test_key}
                            className="rounded-md p-3 xl:p-5 min-h-[300px] relative col-span-1  hover:shadow-none"
                          >
                            <h4 className="text-center">{test_key}</h4>
                            <PieChart
                              data={arr_test_value}
                              inPorcentage={true}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="rounded-md p-4 md:p-7 min-h-[300px] relative col-span-2 neuphormism hover:shadow-none">
              <p>Estado de examenes</p>
              <PieChart
                data={[
                  {
                    id: "validados",
                    label: "Validados",
                    value: chartData?.total.validated,
                  },
                  {
                    id: "Sin validar",
                    label: "Sin Validar",
                    value: chartData?.total.not_validated,
                  },
                ]}
              />
            </div>

            <div className="rounded-md p-4 md:p-7 min-h-[300px] relative col-span-2 neuphormism hover:shadow-none">
              <p>Mensaje de resultados validados</p>
              <PieChart
                data={[
                  {
                    id: "Enviado",
                    label: "Enviado",
                    value: chartData?.analyses.message_sent,
                  },
                  {
                    id: "No enviado",
                    label: "No Enviado",
                    value: chartData?.analyses.message_not_sent,
                  },
                  {
                    id: "Leído",
                    label: "Leído",
                    value: chartData?.analyses.message_read,
                  },
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="md:grid space-y-4 grid-cols-1 md:grid-cols-4 gap-3 md:gap-6 mt-4">
            <Skeleton variant="rounded" width={260} height={260} sx={{ bgcolor: 'grey.200' }} animation="wave" />
            <Skeleton variant="rounded" width={260} height={260} sx={{ bgcolor: 'grey.200' }} animation="wave" />
            <Skeleton variant="rounded" width={260} height={260} sx={{ bgcolor: 'grey.200' }} animation="wave" />
            <Skeleton variant="rounded" width={260} height={260} sx={{ bgcolor: 'grey.200' }} animation="wave" />
          </div>
        )}
      </div>
    </>
  );
}
