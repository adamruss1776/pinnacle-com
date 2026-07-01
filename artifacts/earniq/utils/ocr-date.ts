export type OcrDateInput = {
  lowConfidence?: boolean;
  vehicleName?: string;
  frontGross?: string;
  backGross?: string;
  date?: string;
  dateCertain?: boolean;
};

/**
 * Resolves the date field from an OCR response.
 *
 * Returns "" when the scan is low-confidence (nothing could be read from the
 * document), so the Date field shows "needs entry" rather than today's date
 * misleadingly marked as "found".
 *
 * Returns "" when dateCertain is false, meaning the AI found a date but could
 * not confirm it is the deal/sale date (e.g. a print date or expiry date).
 *
 * Returns the extracted date (or today as fallback) for normal/partial scans
 * where the date is confirmed as the sale date.
 */
export function resolveOcrDate(data: OcrDateInput, today: string): string {
  const isLow =
    data.lowConfidence ?? (!data.vehicleName && !data.frontGross && !data.backGross);
  if (isLow) return "";
  if (data.dateCertain === false) return "";
  return data.date || today;
}
