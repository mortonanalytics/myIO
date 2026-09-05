import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SCHEMA_PATH = path.join(__dirname, "../myio-schema.json");

let schemaCache = null;

export function loadSchema(schemaPath = DEFAULT_SCHEMA_PATH) {
  if (!schemaCache || schemaCache.path !== schemaPath) {
    schemaCache = {
      path: schemaPath,
      schema: JSON.parse(fs.readFileSync(schemaPath, "utf8"))
    };
  }
  return schemaCache.schema;
}

function levenshtein(a, b) {
  const left = String(a);
  const right = String(b);
  const dp = Array.from({ length: left.length + 1 }, function() {
    return Array(right.length + 1).fill(0);
  });
  for (let i = 0; i <= left.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[left.length][right.length];
}

function suggest(value, choices) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("value") && choices.includes("y_var")) return "y_var";
  if (normalized.includes("column") && choices.includes("x_var")) return "x_var";
  if (normalized.includes("group") && choices.includes("group")) return "group";
  const prefixMatch = choices.find(function(choice) {
    return String(choice).toLowerCase().startsWith(normalized);
  });
  if (prefixMatch) return prefixMatch;
  const ranked = choices
    .map(function(choice) {
      return { choice, distance: levenshtein(value, choice) };
    })
    .sort(function(a, b) {
      return a.distance - b.distance || a.choice.localeCompare(b.choice);
    });
  return ranked.length ? ranked[0].choice : null;
}

function error(code, field, message, suggestion = null) {
  const result = { code, field, message };
  if (suggestion) result.suggestion = suggestion;
  return result;
}

function isNumericColumn(kind) {
  if (Array.isArray(kind)) {
    return kind.some(isNumericColumn);
  }
  const normalized = String(kind || "").toLowerCase();
  return [
    "numeric", "integer", "double", "number", "float", "int", "real"
  ].some(function(token) {
    return normalized.includes(token);
  });
}

function normalizeColumns(columns) {
  if (!columns) return null;
  if (typeof columns === "string") {
    try {
      return normalizeColumns(JSON.parse(columns));
    } catch {
      return null;
    }
  }
  if (Array.isArray(columns)) {
    const normalized = Object.create(null);
    for (const item of columns) {
      if (typeof item === "string") {
        normalized[item] = "unknown";
      } else if (item && item.name) {
        normalized[item.name] = item.type || "unknown";
      }
    }
    return normalized;
  }
  if (typeof columns !== "object") return null;
  return columns;
}

function normalizeArgs(args) {
  if (!args) return {};
  if (typeof args === "string") {
    try {
      return normalizeArgs(JSON.parse(args));
    } catch {
      try {
        return normalizeArgs(JSON.parse(args.replaceAll("'", "\"")));
      } catch {
        return { [args]: true };
      }
    }
  }
  if (typeof args !== "object" || Array.isArray(args)) return {};
  return args;
}

function normalizeMapping(mapping) {
  if (!mapping) return {};
  if (typeof mapping === "string") {
    try {
      return normalizeMapping(JSON.parse(mapping));
    } catch {
      return {};
    }
  }
  if (typeof mapping !== "object" || Array.isArray(mapping)) return {};
  return mapping;
}

function allowedMappingKeys(typeSchema) {
  const keys = new Set(typeSchema.required_mappings || []);
  for (const key of Object.keys(typeSchema.data_contract || {})) keys.add(key);
  for (const key of ["group", "label", "low_x", "high_x", "total"]) keys.add(key);
  return Array.from(keys).sort();
}

export function listChartTypes() {
  return Object.keys(loadSchema().types);
}

export function getChartSchema(type) {
  const schema = loadSchema();
  if (type == null) return schema.types;
  return Object.hasOwn(schema.types, type) ? schema.types[type] : null;
}

export function validateSpec(spec) {
  const schema = loadSchema();
  const payload = spec || {};
  const errors = [];
  const type = payload.type;
  const typeSchema = typeof type === "string" ? getChartSchema(type) : null;
  if (!typeSchema) {
    errors.push(error(
      "UNKNOWN_TYPE",
      "type",
      `Unknown chart type '${type}'.`,
      suggest(type || "", Object.keys(schema.types))
    ));
    return { valid: false, errors };
  }

  const mapping = normalizeMapping(payload.mapping);
  const transform = payload.transform || "identity";
  if (!typeSchema.valid_transforms.includes(transform)) {
    errors.push(error(
      "INVALID_TRANSFORM",
      "transform",
      `Transform '${transform}' is not valid for chart type '${type}'.`,
      typeSchema.valid_transforms[0] || "identity"
    ));
  }

  const allowedKeys = allowedMappingKeys(typeSchema);
  for (const field of typeSchema.required_mappings || []) {
    if (!Object.hasOwn(mapping, field)) {
      errors.push(error(
        "MISSING_MAPPING",
        field,
        `Missing required mapping '${field}' for chart type '${type}'.`
      ));
    }
  }
  const mappedColumns = Object.create(null);
  for (const field of Object.keys(mapping)) {
    if (!allowedKeys.includes(field)) {
      errors.push(error(
        "UNKNOWN_MAPPING_KEY",
        field,
        `Unknown mapping key '${field}' for chart type '${type}'.`,
        suggest(field, allowedKeys)
      ));
    }
    const names = type === "parallel" && field === "dimensions" && Array.isArray(mapping[field])
      ? mapping[field] : [mapping[field]];
    if (!names.length || !names.every((name) => typeof name === "string" && name.trim())) {
      errors.push(error(
        "INVALID_MAPPING", field,
        `Mapping '${field}' must contain nonempty column names.`
      ));
    } else {
      mappedColumns[field] = names;
    }
  }

  const columns = normalizeColumns(payload.columns);
  if (columns) {
    for (const [field, names] of Object.entries(mappedColumns)) {
      for (const columnName of names) {
        if (!Object.hasOwn(columns, columnName)) {
          errors.push(error(
            "MISSING_COLUMN",
            field,
            `Mapped column '${columnName}' for '${field}' is not present in columns.`,
            suggest(columnName, Object.keys(columns))
          ));
        }
      }
    }
    for (const field of typeSchema.numeric_fields || []) {
      const columnName = mapping[field];
      if (typeof columnName === "string" && Object.hasOwn(columns, columnName) &&
          !isNumericColumn(columns[columnName])) {
        errors.push(error(
          "NON_NUMERIC_COLUMN",
          field,
          `Mapped column '${columnName}' for '${field}' must be numeric.`
        ));
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function listFunctions() {
  return Object.keys(loadSchema().function_signatures);
}

export function getFunctionSignature(fn) {
  const schema = loadSchema();
  if (fn == null) return schema.function_signatures;
  return Object.hasOwn(schema.function_signatures, fn) ? schema.function_signatures[fn] : null;
}

export function validateCall(call) {
  const schema = loadSchema();
  const payload = call || {};
  const fn = payload.fn;
  const signature = typeof fn === "string" ? getFunctionSignature(fn) : null;
  const errors = [];
  if (!signature) {
    errors.push(error(
      "UNKNOWN_FUNCTION",
      "fn",
      `Unknown function '${fn}'.`,
      suggest(fn || "", Object.keys(schema.function_signatures))
    ));
    return { valid: false, errors };
  }
  const args = normalizeArgs(payload.args);
  for (const arg of Object.keys(args)) {
    if (!signature.includes(arg) && arg !== "...") {
      errors.push(error(
        "UNKNOWN_ARGUMENT",
        arg,
        `Unknown argument '${arg}' for function '${fn}'.`,
        suggest(arg, signature)
      ));
    }
  }
  return { valid: errors.length === 0, errors };
}
