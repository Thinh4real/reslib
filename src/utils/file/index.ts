/**
 * Extracts the file extension from a provided string (filename or file path).
 *
 * @param filePath - The file path or filename string to extract extension from
 * @param options - Configuration options for the extraction
 * @param withoutDot - If true, returns extension without the dot prefix (default: false)
 * @returns The file extension with or without dot, or empty string if no extension found
 *
 * @example
 * ```typescript
 * getFileExtension('document.pdf') // Returns '.pdf'
 * getFileExtension('document.pdf', { withoutDot: true }) // Returns 'pdf'
 * getFileExtension('/path/to/file.txt') // Returns '.txt'
 * getFileExtension('file') // Returns ''
 * getFileExtension('archive.tar.gz') // Returns '.gz'
 * ```
 */
export function getFileExtension(filePath: string, withoutDot: boolean = false): string {
  // Handle empty or invalid input
  if (!filePath || typeof filePath !== "string") {
    return "";
  }
  // Remove any trailing whitespace
  const trimmedPath = filePath.trim();
  // Handle empty string after trimming
  if (trimmedPath === "") {
    return "";
  }
  // Extract just the filename from the path
  const fileName = trimmedPath.split("/").pop() || trimmedPath.split("\\").pop() || trimmedPath;
  // Find the last dot in the filename
  const lastDotIndex = fileName.lastIndexOf(".");
  // No extension found if:
  // - No dot exists
  // - Dot is at the beginning (hidden file like .gitignore)
  // - Dot is at the end
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }
  // Extract extension
  const extension = fileName.substring(lastDotIndex);
  // Return with or without dot based on options
  return withoutDot ? extension.substring(1) : extension;
}
