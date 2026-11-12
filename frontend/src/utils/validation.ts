/** Bangladesh NID: 10, 13, or 17 digits */
export const NID_PATTERN = /^\d{10}$|^\d{13}$|^\d{17}$/;

export function isValidNid(value: string): boolean {
  return NID_PATTERN.test(value.trim());
}
