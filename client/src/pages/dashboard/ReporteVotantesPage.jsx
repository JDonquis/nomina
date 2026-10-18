import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { Icon } from "@iconify/react";

import FormField from "../../components/forms/FormField.jsx";
import { voterRecordsAPI } from "../../services/api.js";
import { useFeedback } from "../../context/FeedbackContext.jsx";
import consultaLogo from "../../assets/consultaPopular2026.svg";

const CENTER_GROUPS = {
  asic: "ASIC",
  hospital: "Hospitales",
  health_secretariat: "Secretaría de Salud",
};

export default function ReporteVotantesPage() {
  const { showError } = useFeedback();
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [ci, setCi] = useState("");
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    document.title = "Reporte de votantes - Salud Estado Falcón";

    let isMounted = true;

    voterRecordsAPI
      .getCenters()
      .then((res) => {
        if (!isMounted) return;

        const asics = (res.asics || []).map((asic) => ({
          kind: "asic",
          id: asic.id,
          label: asic.name,
          group: CENTER_GROUPS.asic,
        }));

        const hospitals = (res.hospitals || []).map((hospital) => ({
          kind: "hospital",
          id: hospital.id,
          label: hospital.name,
          group: CENTER_GROUPS.hospital,
        }));

        const healthSecretariat = (res.health_secretariat || []).map(
          (dependency) => ({
            kind: "health_secretariat",
            id: dependency.id ?? null,
            label: dependency.name,
            group: CENTER_GROUPS.health_secretariat,
          }),
        );

        setCenters([...asics, ...hospitals, ...healthSecretariat]);
      })
      .catch((error) => {
        showError(
          error.message || "No se pudieron cargar los centros de adscripción.",
        );
      })
      .finally(() => {
        if (isMounted) setLoadingCenters(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showError]);

  const groupedCenters = useMemo(
    () =>
      centers.reduce((groups, option) => {
        if (!groups[option.group]) groups[option.group] = [];
        groups[option.group].push(option);
        return groups;
      }, {}),
    [centers],
  );

  const options = useMemo(
    () => Object.values(groupedCenters).flat(),
    [groupedCenters],
  );

  const handleCiChange = useCallback((event) => {
    setCi(event.target.value.replace(/\D/g, "").slice(0, 10));
  }, []);

  const resetForm = useCallback(() => {
    setCi("");
    setSelectedCenter(null);
    setRegistered(false);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!ci.trim()) {
        showError("Debe ingresar la cédula.");
        return;
      }

      if (!selectedCenter) {
        showError("Debe seleccionar la dependencia.");
        return;
      }

      setSubmitting(true);

      try {
        await voterRecordsAPI.register({
          ci,
          center_type: selectedCenter.kind,
          center_id: selectedCenter.id,
        });

        setRegistered(true);
      } catch (error) {
        showError(error.message || "No se pudo registrar el voto.");
      } finally {
        setSubmitting(false);
      }
    },
    [ci, selectedCenter, showError],
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-color4 via-white to-color4 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-color1 px-6 py-5 text-center">
            <img
              src={consultaLogo}
              alt="Consulta Popular Nacional 2026"
              className="w-48 md:w-56 mx-auto"
            />
          </div>

          <div className="px-6 md:px-10 py-8">
            <h1 className="text-xl md:text-2xl font-bold text-color1 text-center leading-tight">
              Reporte de votantes Salud Estado Falcón
            </h1>
            <p className="text-sm text-gray-500 text-center mt-2">
              Consulta Popular Nacional 2026
            </p>

            {registered ? (
              <div className="mt-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon
                    icon="mdi:check-bold"
                    width={44}
                    height={44}
                    className="text-green-600"
                  />
                </div>
                <h2 className="text-xl font-bold text-color1 mt-4">
                  ¡Voto registrado!
                </h2>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  Gracias por participar en la Consulta Popular Nacional 2026.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-6 px-8 py-3 rounded-xl bg-color2 text-white font-semibold hover:bg-color1 transition-colors"
                >
                  Registrar otro voto
                </button>
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <FormField
                  type="text"
                  name="ci"
                  label="Cédula"
                  value={ci}
                  onChange={handleCiChange}
                  required
                  placeholder="Ej: 12345678"
                  inputProps={{ inputMode: "numeric", maxLength: 10 }}
                />

                <Autocomplete
                  options={options}
                  groupBy={(option) => option.group}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.kind === value.kind &&
                    option.id === value.id &&
                    option.label === value.label
                  }
                  value={selectedCenter}
                  onChange={(_, newValue) => setSelectedCenter(newValue)}
                  loading={loadingCenters}
                  noOptionsText="No se encontraron centros"
                  loadingText="Cargando centros..."
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Dependencia"
                      placeholder="Buscar ASIC, hospital o secretaría..."
                      required
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingCenters ? (
                              <CircularProgress color="inherit" size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-lg transition-colors ${
                    submitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-color2 hover:bg-color1"
                  }`}
                >
                  {submitting ? (
                    <CircularProgress size={22} className="text-white" />
                  ) : (
                    <Icon icon="mdi:vote" width={24} height={24} />
                  )}
                  {submitting ? "Registrando..." : "Ya voté"}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Solo se permite un registro por cédula.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
