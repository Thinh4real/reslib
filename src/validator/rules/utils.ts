import { isEmpty } from "@utils/isEmpty";

export const toNumber = (value: any): number => {
  if (isEmpty(value)) return NaN;
  if (typeof value === "number") return value;
  try {
    const v = Number(value);
    return isNaN(v) ? NaN : v;
  } catch {}
  return NaN;
};
