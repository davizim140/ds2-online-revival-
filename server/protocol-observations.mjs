const REQUIRED_COLUMNS = [
  "capture_id",
  "action",
  "local_timestamp",
  "evidence_label",
  "outcome",
];

function parseCsvLine(line) {
  const fields = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        value += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"' && value.length === 0) {
      quoted = true;
    } else if (char === ",") {
      fields.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error("CSV row contains an unterminated quoted field");
  fields.push(value);
  return fields;
}

export function validateObservationsCsv(csv) {
  if (typeof csv !== "string" || csv.trim() === "") {
    return { valid: false, errors: ["CSV is empty"], rowsChecked: 0 };
  }

  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim() !== "");
  let headers;
  try {
    headers = parseCsvLine(lines[0]);
  } catch (error) {
    return { valid: false, errors: [error.message], rowsChecked: 0 };
  }

  const errors = [];
  for (const column of REQUIRED_COLUMNS) {
    if (!headers.includes(column)) errors.push(`Missing required column: ${column}`);
  }
  if (new Set(headers).size !== headers.length) errors.push("CSV contains duplicate column names");
  if (errors.length) return { valid: false, errors, rowsChecked: 0 };

  const index = Object.fromEntries(headers.map((name, i) => [name, i]));
  let rowsChecked = 0;
  for (let lineNumber = 2; lineNumber <= lines.length; lineNumber++) {
    let values;
    try {
      values = parseCsvLine(lines[lineNumber - 1]);
    } catch (error) {
      errors.push(`Line ${lineNumber}: ${error.message}`);
      continue;
    }
    if (values.length !== headers.length) {
      errors.push(`Line ${lineNumber}: expected ${headers.length} columns, found ${values.length}`);
      continue;
    }
    rowsChecked++;
    const get = name => values[index[name]].trim();
    for (const column of REQUIRED_COLUMNS) {
      if (!get(column)) errors.push(`Line ${lineNumber}: ${column} is required`);
    }
    if (get("local_timestamp") && Number.isNaN(Date.parse(get("local_timestamp")))) {
      errors.push(`Line ${lineNumber}: local_timestamp must be a parseable date/time`);
    }
    if (get("evidence_label") && !["observed", "correlated", "hypothesis", "rejected"].includes(get("evidence_label"))) {
      errors.push(`Line ${lineNumber}: evidence_label is not recognized`);
    }
    if (headers.includes("destination_port") && get("destination_port")) {
      const port = Number(get("destination_port"));
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        errors.push(`Line ${lineNumber}: destination_port must be between 1 and 65535`);
      }
    }
    if (headers.includes("transport") && get("transport") &&
        !["TCP", "UDP"].includes(get("transport").toUpperCase())) {
      errors.push(`Line ${lineNumber}: transport must be TCP or UDP`);
    }
  }
  return { valid: errors.length === 0, errors, rowsChecked };
}
