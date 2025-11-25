import { isEmpty } from '@utils/isEmpty';

export const toNumber = (value: any): number => {
  if (isEmpty(value)) return NaN;
  if (typeof value === 'number') return value;
  try {
    const v = Number(value);
    return isNaN(v) ? NaN : v;
    // eslint-disable-next-line no-empty
  } catch {}
  return NaN;
};
