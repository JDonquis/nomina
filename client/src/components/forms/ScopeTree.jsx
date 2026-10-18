import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CircularProgress, FormHelperText } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  scopeToOverrides,
  overridesToScope,
  overridesEqual,
} from "./scopeLevels";

const LEVEL_META = {
  dependency: {
    label: "Dependencia",
    icon: "mdi:hospital-building",
  },
  administrative_unit: {
    label: "Unidad Administrativa",
    icon: "mdi:office-building-outline",
  },
  department: {
    label: "Departamento",
    icon: "mdi:home-city-outline",
  },
  service: {
    label: "Servicio",
    icon: "mdi:stethoscope",
  },
};

const buildTree = (asicRelations) => {
  if (!asicRelations) return null;

  const nodes = {};
  const rootKeys = [];

  (asicRelations.dependencies || []).forEach((dep) => {
    const depKey = `dependency:${dep.id}`;
    nodes[depKey] = {
      level: "dependency",
      id: dep.id,
      name: dep.name,
      parentKey: null,
      childKeys: [],
    };
    rootKeys.push(depKey);

    (dep.administrative_units || []).forEach((unit) => {
      const unitKey = `administrative_unit:${unit.id}`;
      nodes[unitKey] = {
        level: "administrative_unit",
        id: unit.id,
        name: unit.name,
        parentKey: depKey,
        childKeys: [],
      };
      nodes[depKey].childKeys.push(unitKey);

      (unit.departments || []).forEach((dept) => {
        const deptKey = `department:${dept.id}`;
        nodes[deptKey] = {
          level: "department",
          id: dept.id,
          name: dept.name,
          parentKey: unitKey,
          childKeys: [],
        };
        nodes[unitKey].childKeys.push(deptKey);

        (dept.services || []).forEach((service) => {
          const serviceKey = `service:${service.id}`;
          nodes[serviceKey] = {
            level: "service",
            id: service.id,
            name: service.name,
            parentKey: deptKey,
            childKeys: [],
          };
          nodes[deptKey].childKeys.push(serviceKey);
        });
      });
    });
  });

  return { nodes, rootKeys };
};

export default function ScopeTree({
  asics = [],
  asicRelations = null,
  asicId = "",
  accessScope = null,
  onAsicChange,
  onScopeChange,
  disabled = false,
  error,
  loading = false,
}) {
  const [overrides, setOverrides] = useState(() =>
    scopeToOverrides(accessScope),
  );
  const [expanded, setExpanded] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [asicOpen, setAsicOpen] = useState(true);

  const tree = useMemo(() => buildTree(asicRelations), [asicRelations]);

  // Al cambiar de ASIC se colapsa el árbol.
  useEffect(() => {
    setExpanded({});
    setAsicOpen(true);
  }, [asicId]);

  // Sincroniza con el alcance recibido (por ejemplo, al convertir un alcance
  // legacy a árbol). No colapsa ni pisa cambios locales idénticos.
  useEffect(() => {
    setOverrides((prev) => {
      const incoming = scopeToOverrides(accessScope);
      return overridesEqual(prev, incoming) ? prev : incoming;
    });
  }, [accessScope]);

  const effective = useCallback(
    (key) => {
      if (!tree || !tree.nodes[key]) return true;

      const chain = [];
      let current = key;
      while (current) {
        chain.push(current);
        current = tree.nodes[current]?.parentKey;
      }
      chain.reverse();

      let state = true;
      chain.forEach((k) => {
        if (overrides[k] !== undefined) state = overrides[k];
      });

      return state;
    },
    [tree, overrides],
  );

  const collectDescendants = useCallback(
    (key) => {
      if (!tree || !tree.nodes[key]) return [];
      const result = [];
      const stack = [...tree.nodes[key].childKeys];
      while (stack.length) {
        const current = stack.pop();
        result.push(current);
        stack.push(...(tree.nodes[current]?.childKeys || []));
      }
      return result;
    },
    [tree],
  );

  const applyOverrides = useCallback(
    (next) => {
      setOverrides(next);
      onScopeChange?.(overridesToScope(next));
    },
    [onScopeChange],
  );

  const handleToggle = useCallback(
    (key, checked) => {
      if (!tree || !tree.nodes[key]) return;

      const next = { ...overrides };
      collectDescendants(key).forEach((k) => delete next[k]);

      let inherited = true;
      let parent = tree.nodes[key].parentKey;
      const ancestors = [];
      while (parent) {
        ancestors.push(parent);
        parent = tree.nodes[parent]?.parentKey;
      }
      ancestors.reverse();
      ancestors.forEach((k) => {
        if (next[k] !== undefined) inherited = next[k];
      });

      if (checked === inherited) {
        delete next[key];
      } else {
        next[key] = checked;
      }

      applyOverrides(next);
    },
    [tree, overrides, collectDescendants, applyOverrides],
  );

  const toggleExpanded = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleAsicToggle = (id, checked) => {
    if (disabled) return;
    onAsicChange?.(checked ? id : null);
  };

  const handleSelectAll = () => {
    if (disabled || !tree) return;
    applyOverrides({});
  };

  const handleDeselectAll = () => {
    if (disabled || !tree) return;
    const next = {};
    tree.rootKeys.forEach((key) => {
      next[key] = false;
    });
    applyOverrides(next);
  };

  const term = searchTerm.trim().toLowerCase();

  const matchesSearch = useCallback(
    (key) => {
      if (!term || !tree) return true;
      const node = tree.nodes[key];
      if (!node) return false;
      if (node.name?.toLowerCase().includes(term)) return true;
      return node.childKeys.some((childKey) => matchesSearch(childKey));
    },
    [term, tree],
  );

  const stats = useMemo(() => {
    if (!tree) return { total: 0, checked: 0 };
    const keys = Object.keys(tree.nodes);
    return {
      total: keys.length,
      checked: keys.filter((key) => effective(key)).length,
    };
  }, [tree, effective]);

  const renderNode = (key) => {
    const node = tree.nodes[key];

    if (term && !matchesSearch(key)) return null;

    const checked = effective(key);
    const isOpen = !!expanded[key] || (term && checked);
    const meta = LEVEL_META[node.level];

    const visibleChildren = term
      ? node.childKeys.filter((childKey) => matchesSearch(childKey))
      : node.childKeys;

    return (
      <div key={key}>
        <div
          className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
            checked
              ? "bg-gray-50 hover:bg-gray-100"
              : "bg-gray-100/60 opacity-80 hover:opacity-100"
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {node.childKeys.length > 0 ? (
              <button
                type="button"
                onClick={() => toggleExpanded(key)}
                className="p-0.5 text-gray-400 hover:text-color1"
              >
                <Icon
                  icon={isOpen ? "mdi:chevron-down" : "mdi:chevron-right"}
                  width={18}
                  height={18}
                />
              </button>
            ) : (
              <span className="w-[22px]" />
            )}

            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => handleToggle(key, e.target.checked)}
                className="w-4 h-4 rounded accent-color2 cursor-pointer shrink-0"
              />
              <Icon
                icon={meta.icon}
                className={`text-[18px] shrink-0 ${
                  checked ? "text-color1" : "text-gray-400"
                }`}
              />
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-sm truncate ${
                    checked
                      ? "text-gray-700 font-medium"
                      : "text-gray-400 line-through"
                  }`}
                >
                  {node.name}
                </span>
                <span className="text-[11px] text-gray-400">{meta.label}</span>
              </div>
            </label>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
              checked
                ? "bg-color2/10 text-color2"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {checked ? "Habilitado" : "Excluido"}
          </span>
        </div>

        {isOpen && visibleChildren.length > 0 && (
          <div className="ml-3 border-l border-gray-200 pl-2 flex flex-col gap-1.5 mt-1.5">
            {visibleChildren.map((childKey) => renderNode(childKey))}
          </div>
        )}
      </div>
    );
  };

  const hasAsic = asics.some((asic) => Number(asicId) === Number(asic.value));

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-color1">
            <Icon icon="mdi:account-tree" className="text-[20px]" />
            <h3 className="font-semibold text-base text-gray-800">
              Alcance Territorial y Dependencias
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configura a qué ASIC y dependencias tendrá acceso el usuario para
            gestionar personal, asistencia y fe de vida.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-color3/20 text-color1 text-xs font-semibold self-start sm:self-auto">
          <Icon icon="mdi:domain" className="text-[16px]" />
          {stats.checked} de {stats.total} seleccionados
        </span>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 bg-gray-50 p-2 rounded-xl">
        <div className="relative w-full md:w-80">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            placeholder="Buscar ASIC o dependencia..."
            className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none shadow-sm border border-gray-200 disabled:opacity-60"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled || !tree}
            className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg text-color1 text-xs font-medium border border-gray-200 transition-colors disabled:opacity-50"
          >
            Seleccionar todos
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={disabled || !tree}
            className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg text-gray-500 text-xs font-medium border border-gray-200 transition-colors disabled:opacity-50"
          >
            Desmarcar todos
          </button>
        </div>
      </div>

      {/* Tarjeta del árbol */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex flex-col gap-3">
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <CircularProgress size={16} /> Cargando dependencias...
          </div>
        )}

        {asics.map((asic) => {
          const checked = Number(asicId) === Number(asic.value);
          return (
            <div key={asic.value}>
              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-xl gap-3">
                <div className="flex items-start gap-2">
                  {checked ? (
                    <button
                      type="button"
                      onClick={() => setAsicOpen((prev) => !prev)}
                      className="text-gray-400 hover:text-color1 mt-0.5"
                    >
                      <Icon
                        icon={asicOpen ? "mdi:chevron-down" : "mdi:chevron-right"}
                        width={22}
                        height={22}
                      />
                    </button>
                  ) : (
                    <span className="w-[22px]" />
                  )}

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={(e) =>
                            handleAsicToggle(asic.value, e.target.checked)
                          }
                          className="w-4 h-4 rounded accent-color2 cursor-pointer"
                        />
                        <span className="font-semibold text-sm text-gray-800">
                          {asic.label}
                        </span>
                      </label>
                      <span className="px-2 py-0.5 rounded-full bg-color1/10 text-color1 text-[10px] font-semibold">
                        ASIC
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Marca un ASIC para dar acceso completo. Desmarca solo las
                      dependencias que no deba supervisar este funcionario.
                    </p>
                  </div>
                </div>

                {checked && tree && (
                  <span className="shrink-0 text-[11px] font-semibold text-color2 bg-gray-100 px-2.5 py-1 rounded-full">
                    {stats.checked} / {stats.total} dependencias
                  </span>
                )}
              </div>

              {checked && tree && asicOpen && (
                <div className="pl-4 sm:pl-7 pr-1 flex flex-col gap-1.5 max-h-80 overflow-y-auto mt-2">
                  {tree.rootKeys.map((key) => renderNode(key))}
                </div>
              )}
            </div>
          );
        })}

        {!hasAsic && (
          <FormHelperText className="!mt-0 !mx-0 text-xs text-gray-500">
            <Icon icon="mdi:information-outline" className="mr-1 align-middle" />
            Sin ASIC seleccionado el usuario tendrá acceso a todos los ASIC.
          </FormHelperText>
        )}
      </div>

      {error && (
        <FormHelperText error className="!mt-0">
          {error}
        </FormHelperText>
      )}
    </div>
  );
}
