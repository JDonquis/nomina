import { useState, useEffect } from "react";
import { syncAPI } from "../../services/api";
import { Icon } from "@iconify/react";

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [resolving, setResolving] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchLastSync();
    fetchHistory();
  }, []);

  const fetchLastSync = async () => {
    try {
      const response = await syncAPI.lastSync();
      setLastSync(response.last_sync);
    } catch (error) {
      console.error("Error fetching last sync:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await syncAPI.history();
      setHistory(response.history || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await syncAPI.export();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `sync_export_${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      fetchLastSync();
      fetchHistory();
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Error al exportar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setImportResult(null);
    setConflicts([]);

    try {
      const response = await syncAPI.import(file);
      setImportResult(response.result);

      if (response.result?.conflicts?.length > 0) {
        setConflicts(response.result.conflicts);
      }

      fetchLastSync();
      fetchHistory();
    } catch (error) {
      console.error("Error importing:", error);
      alert("Error al importar: " + error.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleResolve = async (syncId, table, action) => {
    setResolving(true);
    try {
      const conflict = conflicts.find((c) => c.sync_id === syncId);
      await syncAPI.resolve([
        {
          sync_id: syncId,
          table,
          action,
          data: action === "use_local" ? conflict?.local : undefined,
        },
      ]);
      setConflicts((prev) => prev.filter((c) => c.sync_id !== syncId));
    } catch (error) {
      console.error("Error resolving conflict:", error);
      alert("Error al resolver conflicto: " + error.message);
    } finally {
      setResolving(false);
    }
  };

  const handleResolveAll = async (action) => {
    setResolving(true);
    try {
      const resolutions = conflicts.map((conflict) => ({
        sync_id: conflict.sync_id,
        table: conflict.table,
        action,
        data: action === "use_local" ? conflict.local : undefined,
      }));
      await syncAPI.resolve(resolutions);
      setConflicts([]);
    } catch (error) {
      console.error("Error resolving all conflicts:", error);
      alert("Error al resolver conflictos: " + error.message);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Sincronización de Datos
        </h1>
        <p className="text-gray-600">
          Exporta e importa datos para mantener bases de datos sincronizadas
        </p>
      </div>

      {lastSync && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-600">
            Última sincronización:{" "}
            <span className="font-medium">
              {new Date(lastSync.created_at).toLocaleString()}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Dirección:{" "}
            <span className="font-medium capitalize">{lastSync.direction}</span>
          </p>
          <p className="text-sm text-gray-600">
            Estado:{" "}
            <span
              className={`font-medium ${
                lastSync.status === "completed" ? "text-green-600" : "text-red-600"
              }`}
            >
              {lastSync.status === "completed" ? "Completada" : "Fallida"}
            </span>
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon icon="mdi:export" className="text-green-600" />
            Exportar Datos
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Descarga un archivo JSON con todos los datos del sistema. Este archivo
            se puede importar en otra instalación del sistema.
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icon icon="eos-icons:loading" className="animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Icon icon="mdi:download" />
                Exportar a JSON
              </>
            )}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon icon="mdi:import" className="text-blue-600" />
            Importar Datos
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Selecciona un archivo JSON previamente exportado para importar los
            datos. Los conflictos se mostrarán para su revisión.
          </p>
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={loading}
              className="hidden"
            />
            <div className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Icon icon="eos-icons:loading" className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Icon icon="mdi:upload" />
                  Seleccionar archivo JSON
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      {importResult && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Resultado de Importación</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {importResult.new?.length || 0}
              </p>
              <p className="text-gray-600">Nuevos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {importResult.updated?.length || 0}
              </p>
              <p className="text-gray-600">Actualizados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {importResult.conflicts?.length || 0}
              </p>
              <p className="text-gray-600">Conflictos</p>
            </div>
          </div>
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="mdi:alert" className="text-orange-500" />
              Conflictos Detectados ({conflicts.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleResolveAll("keep_hosting")}
                disabled={resolving}
                className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              >
                Mantener Hosting
              </button>
              <button
                onClick={() => handleResolveAll("use_local")}
                disabled={resolving}
                className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded"
              >
                Usar Local
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Tabla</th>
                  <th className="px-4 py-2 text-left">Sync ID</th>
                  <th className="px-4 py-2 text-left">Local</th>
                  <th className="px-4 py-2 text-left">Hosting</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map((conflict, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2 font-medium">{conflict.table}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {conflict.sync_id?.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-2">
                      <pre className="text-xs bg-blue-50 p-2 rounded max-w-xs overflow-x-auto">
                        {JSON.stringify(conflict.local, null, 2)?.substring(0, 100)}...
                      </pre>
                    </td>
                    <td className="px-4 py-2">
                      <pre className="text-xs bg-green-50 p-2 rounded max-w-xs overflow-x-auto">
                        {JSON.stringify(conflict.hosting, null, 2)?.substring(0, 100)}...
                      </pre>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            handleResolve(conflict.sync_id, conflict.table, "keep_hosting")
                          }
                          disabled={resolving}
                          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                        >
                          Hosting
                        </button>
                        <button
                          onClick={() =>
                            handleResolve(conflict.sync_id, conflict.table, "use_local")
                          }
                          disabled={resolving}
                          className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 rounded"
                        >
                          Local
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Historial de Sincronización</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Dirección</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-right">Registros</th>
                  <th className="px-4 py-2 text-right">Conflictos</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 capitalize">
                      {item.direction === "export" ? "Exportación" : "Importación"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.status === "completed" ? "Completada" : "Fallida"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {item.records_exported || item.records_imported || 0}
                    </td>
                    <td className="px-4 py-2 text-right">{item.conflicts_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
