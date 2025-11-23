/**
 * Generates a unique identifier.
 *
 * This function takes three parameters: a prefix, a maximum length, and a separator.
 * It generates a unique identifier with the specified prefix, length, and separator.
 *
 * @param {string} [prefix=""] The prefix to use for the identifier.
 * @param {number} [idStrLen=16] The maximum length of the identifier.
 * @param {string} [separator=""] The separator to use in the identifier.
 * @returns {string} The generated unique identifier.
 * @example
 * ```typescript
 * console.log(uniqid()); // Output: a random unique identifier
 * console.log(uniqid("prefix", 16)); // Output: a unique identifier with prefix and length 16
 * console.log(uniqid("prefix", 16, "-")); // Output: a unique identifier with prefix, length 16, and separator "-"
 * ```
 */
export function uniqid(prefix: string, idStrLen: number = 16, separator: string = ""): string {
  /**
   * Set default values for the prefix and separator if not provided.
   */
  separator = separator || "";
  prefix = prefix || "";

  /**
   * Ensure the length is a positive integer.
   */
  if (idStrLen <= 0) idStrLen = 16;
  idStrLen = Math.floor(idStrLen);

  /**
   * Start the identifier with a letter (base 36) and the prefix.
   */
  var idStr = prefix + (Math.floor(Math.random() * 25) + 10).toString(36) + separator;

  /**
   * Add a timestamp in milliseconds (base 36) to the identifier.
   */
  idStr += new Date().getTime().toString(36) + separator;

  /**
   * Complete the identifier with random, alphanumeric characters until the desired length is reached.
   */
  do {
    idStr += Math.floor(Math.random() * 35).toString(36);
  } while (idStr.length < idStrLen);

  /**
   * Return the generated unique identifier.
   */
  return idStr;
}
