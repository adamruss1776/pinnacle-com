export type OcrDateInput = {
  lowConfidence?: boolean;
  vehicleName?: string;
  frontGross?: string;
  backGross?: string;
  date?: string;
};

/**
 * Resolves the date field from an OCR response.
 *
 * Returns "" when the scan is low-confidence (nothing could be read from the
 * document), so the Date field shows "needs entry" rather than today's date
 * misleadingly marked as "found".
 *
 * Returns the extracted date (or today as fallback) for normal/partial scans.
 */
export function resolveOcrDate(data: OcrDateInput, today: string): string {
  const isLow =
    data.lowConfidence ?? (!data.vehicleName && !data.frontGross && !data.backGross);
  return isLow ? "" : data.date || today;
}
