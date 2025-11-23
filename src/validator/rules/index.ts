import { Validator } from "../validator";

export * from "./array";
export * from "./boolean";
export * from "./date";
export * from "./default";
export * from "./enum";
export * from "./file";
export * from "./format";
export * from "./multiRules";
export * from "./numeric";
export * from "./string";
export * from "./target";

/**
 * Ensures that all validation rules are registered.
 * This function is called to guarantee that rule registration side effects have occurred.
 */
export function ensureRulesRegistered() {
  // Rules are registered as side effects when this module is imported
  return Validator.getRules();
}
