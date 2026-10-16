export const SCOPE_LEVELS = [
  "dependency",
  "administrative_unit",
  "department",
  "service",
];

export const emptyTreeScope = () => {
  const granted = {};
  const revoked = {};
  SCOPE_LEVELS.forEach((level) => {
    granted[level] = [];
    revoked[level] = [];
  });
  return { granted, revoked };
};

export const scopeToOverrides = (scope) => {
  const overrides = {};
  if (!scope) return overrides;

  SCOPE_LEVELS.forEach((level) => {
    (scope.granted?.[level] || []).forEach((id) => {
      overrides[`${level}:${id}`] = true;
    });
    (scope.revoked?.[level] || []).forEach((id) => {
      overrides[`${level}:${id}`] = false;
    });
  });

  return overrides;
};

export const overridesToScope = (overrides) => {
  const scope = emptyTreeScope();

  Object.entries(overrides).forEach(([key, value]) => {
    const [level, id] = key.split(":");
    if (!SCOPE_LEVELS.includes(level)) return;
    (value ? scope.granted : scope.revoked)[level].push(Number(id));
  });

  return scope;
};

export const overridesEqual = (a, b) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
};
