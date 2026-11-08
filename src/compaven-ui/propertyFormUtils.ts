export const isValidEurString = (eurStr: string): boolean => {
  const trimmed = eurStr.trim();
  if (!trimmed) return false;
  const regex = /^\d+(\.\d{1,2})?$/;
  if (!regex.test(trimmed)) return false;
  const num = parseFloat(trimmed);
  if (!Number.isFinite(num) || num < 0) return false;
  return true;
};

export const parseEurStrict = (eurStr: string): number | null => {
  const trimmed = eurStr.trim();
  if (!trimmed) return null;
  const regex = /^\d+(\.\d{1,2})?$/;
  if (!regex.test(trimmed)) return NaN;
  const num = parseFloat(trimmed);
  if (!Number.isFinite(num) || num < 0) return NaN;
  return Math.round(num * 100);
};
