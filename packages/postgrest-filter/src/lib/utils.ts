import get from "lodash/get";
import { ValueType } from "./types";

/**
 * Check if a value is a valid ISO DateTime string
 * @param v
 * @returns
 */
export const isISODateString = (v: unknown): boolean =>
  typeof v === "string" &&
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/.test(
    v
  );

/**
 * Safely parse any value to a ValueType
 * @param v
 * @returns
 */
export const parseValue = (v: any): ValueType => {
  if (isISODateString(v)) return new Date(v);
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

/**
 *
 * @param i Ahhh gotta love typescript
 * @returns
 */
export const isNotNull = <I>(i: I | null): i is I => i !== null;

export const isURLSearchParams = (v: unknown): v is URLSearchParams =>
  Boolean((v as URLSearchParams).append);

export const sortSearchParams = (params: URLSearchParams) =>
  new URLSearchParams(
    Array.from(params.entries()).sort((a, b) => {
      const x = `${a[0]}${a[1]}`;
      const y = `${b[0]}${b[1]}`;
      return x > y ? 1 : -1;
    })
  );

/**
 * Returns all paths of an object in dot notation
 * @param obj
 * @param prev
 * @returns
 */
export const getAllPaths = (
  obj: Record<string, unknown>,
  prev = ""
): string[] => {
  const result = [];

  for (const k in obj) {
    const path = prev + (prev ? "." : "") + k;

    if (typeof obj[k] == "object") {
      result.push(...getAllPaths(obj[k] as Record<string, unknown>, path));
    } else result.push(path);
  }

  return result;
};

export const encodeObject = (obj: Record<string, unknown>): string => {
  const paths = getAllPaths(obj).sort();
  const bodyParams = new URLSearchParams();
  paths.forEach((key) => {
    const value = get(obj, key);
    bodyParams.append(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value)
    );
  });
  return sortSearchParams(bodyParams).toString();
};