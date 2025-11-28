import { isNonNullString } from './isNonNullString';
import { extendObj } from './object';

const timeOptions = {
  hour24: {
    default: /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
    withSeconds: /^([01]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/,
    withOptionalSeconds: /^([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/,
  },
  hour12: {
    default: /^(0?[1-9]|1[0-2]):([0-5][0-9]) (A|P)M$/,
    withSeconds: /^(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (A|P)M$/,
    withOptionalSeconds:
      /^(0?[1-9]|1[0-2]):([0-5][0-9])(?::([0-5][0-9]))? (A|P)M$/,
  },
} as const;

export interface IsTimeOptions {
  format?: keyof typeof timeOptions;
  mode?: 'withSeconds' | 'default' | 'withOptionalSeconds';
}

export default function isTime(input: string, options: IsTimeOptions): boolean {
  if (!isNonNullString(input)) {
    return false;
  }
  options = extendObj({}, { format: 'hour24', mode: 'default' }, options);
  if (!options.format || !timeOptions[options.format!]) {
    options.format = 'hour24';
  }
  if (!options.mode || !timeOptions[options.format!]?.[options.mode!]) {
    options.mode = 'default';
  }
  return timeOptions[options.format!][options.mode!].test(input);
}
