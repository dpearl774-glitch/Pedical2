/**
 * WHO Child Growth Standards: Complete Inpatient Diagnostic Reference
 * Values derived from official WHO Child Growth Standards (2006/2009 update)
 * Includes:
 * 1. Weight-for-Length / Height (45 cm - 110 cm) - WFL/WFH (Primary SAM Diagnostic Standard)
 * 2. Weight-for-Age (0 to 60 months) - WFA (Underweight)
 * 3. Length / Height-for-Age (0 to 60 months) - LFA/HFA (Stunting)
 */

export interface WHOPoint {
  x: number;      // lengthCm or ageMonths
  sd3neg: number; // -3 SD
  sd2neg: number; // -2 SD
  sd1neg: number; // -1 SD
  median: number; // Median (0 SD)
  sd1: number;    // +1 SD
  sd2: number;    // +2 SD
  sd3: number;    // +3 SD
}

export type WHOLengthPoint = WHOPoint & { lengthCm: number };
export type WHOAgePoint = WHOPoint & { ageMonths: number };

// ---------------------------------------------------------------------------
// 1. Weight-for-Length / Height (45.0 - 110.0 cm)
// ---------------------------------------------------------------------------
export const WHO_BOYS_WFL: WHOLengthPoint[] = [
  { x: 45.0, lengthCm: 45.0, sd3neg: 1.9, sd2neg: 2.0, sd1neg: 2.2, median: 2.4, sd1: 2.7, sd2: 3.0, sd3: 3.3 },
  { x: 46.0, lengthCm: 46.0, sd3neg: 2.0, sd2neg: 2.2, sd1neg: 2.4, median: 2.6, sd1: 2.9, sd2: 3.2, sd3: 3.5 },
  { x: 47.0, lengthCm: 47.0, sd3neg: 2.1, sd2neg: 2.3, sd1neg: 2.5, median: 2.8, sd1: 3.1, sd2: 3.4, sd3: 3.8 },
  { x: 48.0, lengthCm: 48.0, sd3neg: 2.3, sd2neg: 2.5, sd1neg: 2.7, median: 3.0, sd1: 3.3, sd2: 3.6, sd3: 4.0 },
  { x: 49.0, lengthCm: 49.0, sd3neg: 2.4, sd2neg: 2.6, sd1neg: 2.9, median: 3.1, sd1: 3.5, sd2: 3.9, sd3: 4.3 },
  { x: 50.0, lengthCm: 50.0, sd3neg: 2.6, sd2neg: 2.8, sd1neg: 3.0, median: 3.3, sd1: 3.7, sd2: 4.1, sd3: 4.5 },
  { x: 51.0, lengthCm: 51.0, sd3neg: 2.7, sd2neg: 3.0, sd1neg: 3.2, median: 3.5, sd1: 3.9, sd2: 4.3, sd3: 4.8 },
  { x: 52.0, lengthCm: 52.0, sd3neg: 2.9, sd2neg: 3.2, sd1neg: 3.5, median: 3.8, sd1: 4.2, sd2: 4.6, sd3: 5.1 },
  { x: 53.0, lengthCm: 53.0, sd3neg: 3.1, sd2neg: 3.4, sd1neg: 3.7, median: 4.0, sd1: 4.4, sd2: 4.9, sd3: 5.4 },
  { x: 54.0, lengthCm: 54.0, sd3neg: 3.3, sd2neg: 3.6, sd1neg: 3.9, median: 4.3, sd1: 4.7, sd2: 5.2, sd3: 5.7 },
  { x: 55.0, lengthCm: 55.0, sd3neg: 3.6, sd2neg: 3.8, sd1neg: 4.2, median: 4.5, sd1: 5.0, sd2: 5.5, sd3: 6.1 },
  { x: 56.0, lengthCm: 56.0, sd3neg: 3.8, sd2neg: 4.1, sd1neg: 4.4, median: 4.8, sd1: 5.3, sd2: 5.8, sd3: 6.4 },
  { x: 57.0, lengthCm: 57.0, sd3neg: 4.1, sd2neg: 4.3, sd1neg: 4.7, median: 5.1, sd1: 5.6, sd2: 6.1, sd3: 6.7 },
  { x: 58.0, lengthCm: 58.0, sd3neg: 4.3, sd2neg: 4.6, sd1neg: 5.0, median: 5.4, sd1: 5.9, sd2: 6.5, sd3: 7.1 },
  { x: 59.0, lengthCm: 59.0, sd3neg: 4.6, sd2neg: 4.9, sd1neg: 5.3, median: 5.7, sd1: 6.2, sd2: 6.8, sd3: 7.5 },
  { x: 60.0, lengthCm: 60.0, sd3neg: 4.8, sd2neg: 5.1, sd1neg: 5.5, median: 6.0, sd1: 6.5, sd2: 7.1, sd3: 7.8 },
  { x: 61.0, lengthCm: 61.0, sd3neg: 5.0, sd2neg: 5.4, sd1neg: 5.8, median: 6.3, sd1: 6.8, sd2: 7.5, sd3: 8.2 },
  { x: 62.0, lengthCm: 62.0, sd3neg: 5.3, sd2neg: 5.6, sd1neg: 6.1, median: 6.6, sd1: 7.1, sd2: 7.8, sd3: 8.5 },
  { x: 63.0, lengthCm: 63.0, sd3neg: 5.5, sd2neg: 5.9, sd1neg: 6.3, median: 6.8, sd1: 7.4, sd2: 8.1, sd3: 8.9 },
  { x: 64.0, lengthCm: 64.0, sd3neg: 5.7, sd2neg: 6.1, sd1neg: 6.6, median: 7.1, sd1: 7.7, sd2: 8.4, sd3: 9.2 },
  { x: 65.0, lengthCm: 65.0, sd3neg: 5.9, sd2neg: 6.3, sd1neg: 6.8, median: 7.4, sd1: 8.0, sd2: 8.7, sd3: 9.5 },
  { x: 66.0, lengthCm: 66.0, sd3neg: 6.1, sd2neg: 6.5, sd1neg: 7.1, median: 7.6, sd1: 8.3, sd2: 9.0, sd3: 9.8 },
  { x: 67.0, lengthCm: 67.0, sd3neg: 6.3, sd2neg: 6.7, sd1neg: 7.3, median: 7.9, sd1: 8.5, sd2: 9.3, sd3: 10.1 },
  { x: 68.0, lengthCm: 68.0, sd3neg: 6.5, sd2neg: 7.0, sd1neg: 7.5, median: 8.1, sd1: 8.8, sd2: 9.6, sd3: 10.4 },
  { x: 69.0, lengthCm: 69.0, sd3neg: 6.7, sd2neg: 7.2, sd1neg: 7.8, median: 8.4, sd1: 9.1, sd2: 9.8, sd3: 10.7 },
  { x: 70.0, lengthCm: 70.0, sd3neg: 6.9, sd2neg: 7.4, sd1neg: 8.0, median: 8.6, sd1: 9.3, sd2: 10.1, sd3: 11.0 },
  { x: 71.0, lengthCm: 71.0, sd3neg: 7.1, sd2neg: 7.6, sd1neg: 8.2, median: 8.8, sd1: 9.5, sd2: 10.4, sd3: 11.3 },
  { x: 72.0, lengthCm: 72.0, sd3neg: 7.2, sd2neg: 7.8, sd1neg: 8.4, median: 9.0, sd1: 9.8, sd2: 10.6, sd3: 11.5 },
  { x: 73.0, lengthCm: 73.0, sd3neg: 7.4, sd2neg: 7.9, sd1neg: 8.6, median: 9.2, sd1: 10.0, sd2: 10.8, sd3: 11.8 },
  { x: 74.0, lengthCm: 74.0, sd3neg: 7.6, sd2neg: 8.1, sd1neg: 8.8, median: 9.4, sd1: 10.2, sd2: 11.1, sd3: 12.0 },
  { x: 75.0, lengthCm: 75.0, sd3neg: 7.7, sd2neg: 8.3, sd1neg: 8.9, median: 9.6, sd1: 10.4, sd2: 11.3, sd3: 12.3 },
  { x: 76.0, lengthCm: 76.0, sd3neg: 7.9, sd2neg: 8.5, sd1neg: 9.1, median: 9.8, sd1: 10.6, sd2: 11.5, sd3: 12.5 },
  { x: 77.0, lengthCm: 77.0, sd3neg: 8.1, sd2neg: 8.6, sd1neg: 9.3, median: 10.0, sd1: 10.8, sd2: 11.7, sd3: 12.7 },
  { x: 78.0, lengthCm: 78.0, sd3neg: 8.2, sd2neg: 8.8, sd1neg: 9.5, median: 10.2, sd1: 11.0, sd2: 11.9, sd3: 13.0 },
  { x: 79.0, lengthCm: 79.0, sd3neg: 8.4, sd2neg: 9.0, sd1neg: 9.7, median: 10.4, sd1: 11.2, sd2: 12.2, sd3: 13.2 },
  { x: 80.0, lengthCm: 80.0, sd3neg: 8.6, sd2neg: 9.2, sd1neg: 9.8, median: 10.6, sd1: 11.4, sd2: 12.4, sd3: 13.4 },
  { x: 82.0, lengthCm: 82.0, sd3neg: 8.9, sd2neg: 9.5, sd1neg: 10.2, median: 11.0, sd1: 11.8, sd2: 12.8, sd3: 13.9 },
  { x: 84.0, lengthCm: 84.0, sd3neg: 9.3, sd2neg: 9.9, sd1neg: 10.6, median: 11.4, sd1: 12.3, sd2: 13.3, sd3: 14.4 },
  { x: 86.0, lengthCm: 86.0, sd3neg: 9.7, sd2neg: 10.3, sd1neg: 11.0, median: 11.8, sd1: 12.7, sd2: 13.8, sd3: 15.0 },
  { x: 88.0, lengthCm: 88.0, sd3neg: 10.1, sd2neg: 10.7, sd1neg: 11.5, median: 12.3, sd1: 13.2, sd2: 14.3, sd3: 15.5 },
  { x: 90.0, lengthCm: 90.0, sd3neg: 10.5, sd2neg: 11.1, sd1neg: 11.9, median: 12.7, sd1: 13.7, sd2: 14.8, sd3: 16.1 },
  { x: 92.0, lengthCm: 92.0, sd3neg: 10.9, sd2neg: 11.6, sd1neg: 12.4, median: 13.2, sd1: 14.2, sd2: 15.4, sd3: 16.7 },
  { x: 94.0, lengthCm: 94.0, sd3neg: 11.3, sd2neg: 12.0, sd1neg: 12.8, median: 13.7, sd1: 14.7, sd2: 15.9, sd3: 17.3 },
  { x: 96.0, lengthCm: 96.0, sd3neg: 11.7, sd2neg: 12.4, sd1neg: 13.3, median: 14.2, sd1: 15.3, sd2: 16.5, sd3: 17.9 },
  { x: 98.0, lengthCm: 98.0, sd3neg: 12.1, sd2neg: 12.9, sd1neg: 13.8, median: 14.7, sd1: 15.8, sd2: 17.1, sd3: 18.6 },
  { x: 100.0, lengthCm: 100.0, sd3neg: 12.6, sd2neg: 13.4, sd1neg: 14.3, median: 15.3, sd1: 16.4, sd2: 17.7, sd3: 19.3 },
  { x: 105.0, lengthCm: 105.0, sd3neg: 13.7, sd2neg: 14.6, sd1neg: 15.6, median: 16.7, sd1: 18.0, sd2: 19.4, sd3: 21.1 },
  { x: 110.0, lengthCm: 110.0, sd3neg: 14.9, sd2neg: 15.9, sd1neg: 17.0, median: 18.2, sd1: 19.6, sd2: 21.2, sd3: 23.0 },
];

export const WHO_GIRLS_WFL: WHOLengthPoint[] = [
  { x: 45.0, lengthCm: 45.0, sd3neg: 1.8, sd2neg: 2.0, sd1neg: 2.1, median: 2.4, sd1: 2.6, sd2: 2.9, sd3: 3.2 },
  { x: 46.0, lengthCm: 46.0, sd3neg: 2.0, sd2neg: 2.1, sd1neg: 2.3, median: 2.5, sd1: 2.8, sd2: 3.1, sd3: 3.4 },
  { x: 47.0, lengthCm: 47.0, sd3neg: 2.1, sd2neg: 2.3, sd1neg: 2.5, median: 2.7, sd1: 3.0, sd2: 3.3, sd3: 3.6 },
  { x: 48.0, lengthCm: 48.0, sd3neg: 2.2, sd2neg: 2.4, sd1neg: 2.6, median: 2.9, sd1: 3.2, sd2: 3.5, sd3: 3.9 },
  { x: 49.0, lengthCm: 49.0, sd3neg: 2.4, sd2neg: 2.6, sd1neg: 2.8, median: 3.1, sd1: 3.4, sd2: 3.7, sd3: 4.1 },
  { x: 50.0, lengthCm: 50.0, sd3neg: 2.5, sd2neg: 2.7, sd1neg: 3.0, median: 3.3, sd1: 3.6, sd2: 4.0, sd3: 4.4 },
  { x: 51.0, lengthCm: 51.0, sd3neg: 2.7, sd2neg: 2.9, sd1neg: 3.2, median: 3.5, sd1: 3.8, sd2: 4.2, sd3: 4.7 },
  { x: 52.0, lengthCm: 52.0, sd3neg: 2.9, sd2neg: 3.1, sd1neg: 3.4, median: 3.7, sd1: 4.1, sd2: 4.5, sd3: 5.0 },
  { x: 53.0, lengthCm: 53.0, sd3neg: 3.1, sd2neg: 3.3, sd1neg: 3.6, median: 4.0, sd1: 4.4, sd2: 4.8, sd3: 5.3 },
  { x: 54.0, lengthCm: 54.0, sd3neg: 3.3, sd2neg: 3.5, sd1neg: 3.9, median: 4.2, sd1: 4.6, sd2: 5.1, sd3: 5.6 },
  { x: 55.0, lengthCm: 55.0, sd3neg: 3.5, sd2neg: 3.8, sd1neg: 4.1, median: 4.5, sd1: 4.9, sd2: 5.4, sd3: 6.0 },
  { x: 56.0, lengthCm: 56.0, sd3neg: 3.7, sd2neg: 4.0, sd1neg: 4.3, median: 4.7, sd1: 5.2, sd2: 5.7, sd3: 6.3 },
  { x: 57.0, lengthCm: 57.0, sd3neg: 4.0, sd2neg: 4.2, sd1neg: 4.6, median: 5.0, sd1: 5.5, sd2: 6.0, sd3: 6.6 },
  { x: 58.0, lengthCm: 58.0, sd3neg: 4.2, sd2neg: 4.5, sd1neg: 4.8, median: 5.3, sd1: 5.8, sd2: 6.3, sd3: 7.0 },
  { x: 59.0, lengthCm: 59.0, sd3neg: 4.4, sd2neg: 4.7, sd1neg: 5.1, median: 5.5, sd1: 6.1, sd2: 6.6, sd3: 7.3 },
  { x: 60.0, lengthCm: 60.0, sd3neg: 4.6, sd2neg: 4.9, sd1neg: 5.3, median: 5.8, sd1: 6.3, sd2: 6.9, sd3: 7.6 },
  { x: 61.0, lengthCm: 61.0, sd3neg: 4.8, sd2neg: 5.2, sd1neg: 5.6, median: 6.0, sd1: 6.6, sd2: 7.2, sd3: 8.0 },
  { x: 62.0, lengthCm: 62.0, sd3neg: 5.1, sd2neg: 5.4, sd1neg: 5.8, median: 6.3, sd1: 6.9, sd2: 7.5, sd3: 8.3 },
  { x: 63.0, lengthCm: 63.0, sd3neg: 5.3, sd2neg: 5.6, sd1neg: 6.0, median: 6.5, sd1: 7.1, sd2: 7.8, sd3: 8.6 },
  { x: 64.0, lengthCm: 64.0, sd3neg: 5.5, sd2neg: 5.8, sd1neg: 6.3, median: 6.8, sd1: 7.4, sd2: 8.1, sd3: 8.9 },
  { x: 65.0, lengthCm: 65.0, sd3neg: 5.7, sd2neg: 6.0, sd1neg: 6.5, median: 7.0, sd1: 7.6, sd2: 8.4, sd3: 9.2 },
  { x: 66.0, lengthCm: 66.0, sd3neg: 5.8, sd2neg: 6.2, sd1neg: 6.7, median: 7.2, sd1: 7.9, sd2: 8.6, sd3: 9.5 },
  { x: 67.0, lengthCm: 67.0, sd3neg: 6.0, sd2neg: 6.4, sd1neg: 6.9, median: 7.4, sd1: 8.1, sd2: 8.9, sd3: 9.8 },
  { x: 68.0, lengthCm: 68.0, sd3neg: 6.2, sd2neg: 6.6, sd1neg: 7.1, median: 7.7, sd1: 8.4, sd2: 9.1, sd3: 10.0 },
  { x: 69.0, lengthCm: 69.0, sd3neg: 6.4, sd2neg: 6.8, sd1neg: 7.3, median: 7.9, sd1: 8.6, sd2: 9.4, sd3: 10.3 },
  { x: 70.0, lengthCm: 70.0, sd3neg: 6.5, sd2neg: 7.0, sd1neg: 7.5, median: 8.1, sd1: 8.8, sd2: 9.6, sd3: 10.6 },
  { x: 71.0, lengthCm: 71.0, sd3neg: 6.7, sd2neg: 7.2, sd1neg: 7.7, median: 8.3, sd1: 9.0, sd2: 9.9, sd3: 10.8 },
  { x: 72.0, lengthCm: 72.0, sd3neg: 6.9, sd2neg: 7.3, sd1neg: 7.9, median: 8.5, sd1: 9.3, sd2: 10.1, sd3: 11.1 },
  { x: 73.0, lengthCm: 73.0, sd3neg: 7.0, sd2neg: 7.5, sd1neg: 8.1, median: 8.7, sd1: 9.5, sd2: 10.3, sd3: 11.3 },
  { x: 74.0, lengthCm: 74.0, sd3neg: 7.2, sd2neg: 7.7, sd1neg: 8.3, median: 8.9, sd1: 9.7, sd2: 10.6, sd3: 11.6 },
  { x: 75.0, lengthCm: 75.0, sd3neg: 7.3, sd2neg: 7.9, sd1neg: 8.5, median: 9.1, sd1: 9.9, sd2: 10.8, sd3: 11.8 },
  { x: 76.0, lengthCm: 76.0, sd3neg: 7.5, sd2neg: 8.0, sd1neg: 8.6, median: 9.3, sd1: 10.1, sd2: 11.0, sd3: 12.1 },
  { x: 77.0, lengthCm: 77.0, sd3neg: 7.7, sd2neg: 8.2, sd1neg: 8.8, median: 9.5, sd1: 10.3, sd2: 11.3, sd3: 12.3 },
  { x: 78.0, lengthCm: 78.0, sd3neg: 7.8, sd2neg: 8.4, sd1neg: 9.0, median: 9.7, sd1: 10.5, sd2: 11.5, sd3: 12.6 },
  { x: 79.0, lengthCm: 79.0, sd3neg: 8.0, sd2neg: 8.5, sd1neg: 9.2, median: 9.9, sd1: 10.7, sd2: 11.7, sd3: 12.8 },
  { x: 80.0, lengthCm: 80.0, sd3neg: 8.1, sd2neg: 8.7, sd1neg: 9.3, median: 10.1, sd1: 10.9, sd2: 11.9, sd3: 13.0 },
  { x: 82.0, lengthCm: 82.0, sd3neg: 8.5, sd2neg: 9.0, sd1neg: 9.7, median: 10.5, sd1: 11.3, sd2: 12.4, sd3: 13.5 },
  { x: 84.0, lengthCm: 84.0, sd3neg: 8.8, sd2neg: 9.4, sd1neg: 10.1, median: 10.9, sd1: 11.8, sd2: 12.8, sd3: 14.1 },
  { x: 86.0, lengthCm: 86.0, sd3neg: 9.2, sd2neg: 9.8, sd1neg: 10.5, median: 11.3, sd1: 12.2, sd2: 13.3, sd3: 14.6 },
  { x: 88.0, lengthCm: 88.0, sd3neg: 9.6, sd2neg: 10.2, sd1neg: 10.9, median: 11.7, sd1: 12.7, sd2: 13.9, sd3: 15.2 },
  { x: 90.0, lengthCm: 90.0, sd3neg: 10.0, sd2neg: 10.6, sd1neg: 11.4, median: 12.2, sd1: 13.2, sd2: 14.4, sd3: 15.8 },
  { x: 92.0, lengthCm: 92.0, sd3neg: 10.4, sd2neg: 11.0, sd1neg: 11.8, median: 12.7, sd1: 13.7, sd2: 15.0, sd3: 16.4 },
  { x: 94.0, lengthCm: 94.0, sd3neg: 10.8, sd2neg: 11.5, sd1neg: 12.3, median: 13.2, sd1: 14.3, sd2: 15.6, sd3: 17.1 },
  { x: 96.0, lengthCm: 96.0, sd3neg: 11.2, sd2neg: 11.9, sd1neg: 12.8, median: 13.7, sd1: 14.8, sd2: 16.2, sd3: 17.8 },
  { x: 98.0, lengthCm: 98.0, sd3neg: 11.6, sd2neg: 12.4, sd1neg: 13.3, median: 14.2, sd1: 15.4, sd2: 16.8, sd3: 18.5 },
  { x: 100.0, lengthCm: 100.0, sd3neg: 12.1, sd2neg: 12.8, sd1neg: 13.8, median: 14.8, sd1: 16.0, sd2: 17.5, sd3: 19.3 },
  { x: 105.0, lengthCm: 105.0, sd3neg: 13.2, sd2neg: 14.0, sd1neg: 15.1, median: 16.2, sd1: 17.5, sd2: 19.2, sd3: 21.2 },
  { x: 110.0, lengthCm: 110.0, sd3neg: 14.4, sd2neg: 15.3, sd1neg: 16.5, median: 17.7, sd1: 19.2, sd2: 21.0, sd3: 23.2 },
];

// ---------------------------------------------------------------------------
// 2. Weight-for-Age (0 to 60 months)
// ---------------------------------------------------------------------------
export const WHO_BOYS_WFA: WHOAgePoint[] = [
  { x: 0, ageMonths: 0, sd3neg: 2.1, sd2neg: 2.5, sd1neg: 2.9, median: 3.3, sd1: 3.9, sd2: 4.4, sd3: 5.0 },
  { x: 1, ageMonths: 1, sd3neg: 2.9, sd2neg: 3.4, sd1neg: 3.9, median: 4.5, sd1: 5.1, sd2: 5.8, sd3: 6.6 },
  { x: 2, ageMonths: 2, sd3neg: 3.8, sd2neg: 4.3, sd1neg: 4.9, median: 5.6, sd1: 6.3, sd2: 7.1, sd3: 8.0 },
  { x: 3, ageMonths: 3, sd3neg: 4.4, sd2neg: 5.0, sd1neg: 5.7, median: 6.4, sd1: 7.2, sd2: 8.0, sd3: 9.0 },
  { x: 4, ageMonths: 4, sd3neg: 4.9, sd2neg: 5.6, sd1neg: 6.2, median: 7.0, sd1: 7.8, sd2: 8.7, sd3: 9.7 },
  { x: 5, ageMonths: 5, sd3neg: 5.3, sd2neg: 6.0, sd1neg: 6.7, median: 7.5, sd1: 8.4, sd2: 9.3, sd3: 10.4 },
  { x: 6, ageMonths: 6, sd3neg: 5.7, sd2neg: 6.4, sd1neg: 7.1, median: 7.9, sd1: 8.8, sd2: 9.8, sd3: 10.9 },
  { x: 9, ageMonths: 9, sd3neg: 6.4, sd2neg: 7.2, sd1neg: 8.0, median: 8.9, sd1: 9.9, sd2: 11.0, sd3: 12.3 },
  { x: 12, ageMonths: 12, sd3neg: 6.9, sd2neg: 7.7, sd1neg: 8.6, median: 9.6, sd1: 10.8, sd2: 12.0, sd3: 13.3 },
  { x: 18, ageMonths: 18, sd3neg: 7.8, sd2neg: 8.8, sd1neg: 9.8, median: 10.9, sd1: 12.2, sd2: 13.7, sd3: 15.3 },
  { x: 24, ageMonths: 24, sd3neg: 8.6, sd2neg: 9.7, sd1neg: 10.8, median: 12.2, sd1: 13.6, sd2: 15.3, sd3: 17.1 },
  { x: 30, ageMonths: 30, sd3neg: 9.4, sd2neg: 10.5, sd1neg: 11.8, median: 13.3, sd1: 15.0, sd2: 16.9, sd3: 19.0 },
  { x: 36, ageMonths: 36, sd3neg: 10.0, sd2neg: 11.3, sd1neg: 12.7, median: 14.3, sd1: 16.2, sd2: 18.3, sd3: 20.7 },
  { x: 42, ageMonths: 42, sd3neg: 10.7, sd2neg: 12.0, sd1neg: 13.6, median: 15.3, sd1: 17.4, sd2: 19.7, sd3: 22.4 },
  { x: 48, ageMonths: 48, sd3neg: 11.3, sd2neg: 12.7, sd1neg: 14.4, median: 16.3, sd1: 18.6, sd2: 21.2, sd3: 24.2 },
  { x: 54, ageMonths: 54, sd3neg: 11.9, sd2neg: 13.4, sd1neg: 15.2, median: 17.3, sd1: 19.8, sd2: 22.7, sd3: 26.0 },
  { x: 60, ageMonths: 60, sd3neg: 12.4, sd2neg: 14.1, sd1neg: 16.0, median: 18.3, sd1: 21.0, sd2: 24.2, sd3: 27.9 },
];

export const WHO_GIRLS_WFA: WHOAgePoint[] = [
  { x: 0, ageMonths: 0, sd3neg: 2.0, sd2neg: 2.4, sd1neg: 2.8, median: 3.2, sd1: 3.7, sd2: 4.2, sd3: 4.8 },
  { x: 1, ageMonths: 1, sd3neg: 2.7, sd2neg: 3.2, sd1neg: 3.6, median: 4.2, sd1: 4.8, sd2: 5.5, sd3: 6.2 },
  { x: 2, ageMonths: 2, sd3neg: 3.4, sd2neg: 3.9, sd1neg: 4.5, median: 5.1, sd1: 5.8, sd2: 6.6, sd3: 7.5 },
  { x: 3, ageMonths: 3, sd3neg: 4.0, sd2neg: 4.5, sd1neg: 5.2, median: 5.8, sd1: 6.6, sd2: 7.5, sd3: 8.5 },
  { x: 4, ageMonths: 4, sd3neg: 4.4, sd2neg: 5.0, sd1neg: 5.7, median: 6.4, sd1: 7.3, sd2: 8.2, sd3: 9.3 },
  { x: 5, ageMonths: 5, sd3neg: 4.8, sd2neg: 5.4, sd1neg: 6.1, median: 6.9, sd1: 7.8, sd2: 8.8, sd3: 10.0 },
  { x: 6, ageMonths: 6, sd3neg: 5.1, sd2neg: 5.7, sd1neg: 6.5, median: 7.3, sd1: 8.2, sd2: 9.3, sd3: 10.6 },
  { x: 9, ageMonths: 9, sd3neg: 5.8, sd2neg: 6.5, sd1neg: 7.3, median: 8.2, sd1: 9.3, sd2: 10.5, sd3: 11.9 },
  { x: 12, ageMonths: 12, sd3neg: 6.3, sd2neg: 7.0, sd1neg: 7.9, median: 8.9, sd1: 10.1, sd2: 11.5, sd3: 13.1 },
  { x: 18, ageMonths: 18, sd3neg: 7.2, sd2neg: 8.1, sd1neg: 9.1, median: 10.2, sd1: 11.6, sd2: 13.2, sd3: 15.0 },
  { x: 24, ageMonths: 24, sd3neg: 8.1, sd2neg: 9.0, sd1neg: 10.2, median: 11.5, sd1: 13.0, sd2: 14.8, sd3: 17.0 },
  { x: 30, ageMonths: 30, sd3neg: 8.9, sd2neg: 10.0, sd1neg: 11.2, median: 12.7, sd1: 14.4, sd2: 16.5, sd3: 19.0 },
  { x: 36, ageMonths: 36, sd3neg: 9.6, sd2neg: 10.8, sd1neg: 12.2, median: 13.9, sd1: 15.8, sd2: 18.1, sd3: 20.9 },
  { x: 42, ageMonths: 42, sd3neg: 10.3, sd2neg: 11.6, sd1neg: 13.1, median: 15.0, sd1: 17.1, sd2: 19.7, sd3: 22.8 },
  { x: 48, ageMonths: 48, sd3neg: 10.9, sd2neg: 12.3, sd1neg: 14.0, median: 16.1, sd1: 18.5, sd2: 21.3, sd3: 24.8 },
  { x: 54, ageMonths: 54, sd3neg: 11.5, sd2neg: 13.0, sd1neg: 14.9, median: 17.2, sd1: 19.8, sd2: 23.0, sd3: 26.8 },
  { x: 60, ageMonths: 60, sd3neg: 12.1, sd2neg: 13.7, sd1neg: 15.8, median: 18.2, sd1: 21.2, sd2: 24.6, sd3: 28.8 },
];

// ---------------------------------------------------------------------------
// 3. Length / Height-for-Age (0 to 60 months)
// ---------------------------------------------------------------------------
export const WHO_BOYS_LFA: WHOAgePoint[] = [
  { x: 0, ageMonths: 0, sd3neg: 44.2, sd2neg: 46.1, sd1neg: 48.0, median: 49.9, sd1: 51.8, sd2: 53.7, sd3: 55.6 },
  { x: 1, ageMonths: 1, sd3neg: 48.9, sd2neg: 50.8, sd1neg: 52.8, median: 54.7, sd1: 56.7, sd2: 58.6, sd3: 60.6 },
  { x: 2, ageMonths: 2, sd3neg: 52.4, sd2neg: 54.4, sd1neg: 56.4, median: 58.4, sd1: 60.4, sd2: 62.4, sd3: 64.4 },
  { x: 3, ageMonths: 3, sd3neg: 55.3, sd2neg: 57.3, sd1neg: 59.4, median: 61.4, sd1: 63.5, sd2: 65.5, sd3: 67.6 },
  { x: 6, ageMonths: 6, sd3neg: 61.2, sd2neg: 63.3, sd1neg: 65.5, median: 67.6, sd1: 69.8, sd2: 71.9, sd3: 74.0 },
  { x: 9, ageMonths: 9, sd3neg: 65.2, sd2neg: 67.5, sd1neg: 69.7, median: 72.0, sd1: 74.2, sd2: 76.5, sd3: 78.7 },
  { x: 12, ageMonths: 12, sd3neg: 68.6, sd2neg: 71.0, sd1neg: 73.4, median: 75.7, sd1: 78.1, sd2: 80.5, sd3: 82.9 },
  { x: 18, ageMonths: 18, sd3neg: 74.2, sd2neg: 76.9, sd1neg: 79.6, median: 82.3, sd1: 85.0, sd2: 87.7, sd3: 90.4 },
  { x: 24, ageMonths: 24, sd3neg: 78.0, sd2neg: 81.0, sd1neg: 84.1, median: 87.1, sd1: 90.2, sd2: 93.2, sd3: 96.3 },
  { x: 36, ageMonths: 36, sd3neg: 88.7, sd2neg: 92.4, sd1neg: 96.1, median: 96.1, sd1: 99.8, sd2: 103.5, sd3: 107.2 },
  { x: 48, ageMonths: 48, sd3neg: 94.9, sd2neg: 99.1, sd1neg: 103.3, median: 103.3, sd1: 107.5, sd2: 111.7, sd3: 115.9 },
  { x: 60, ageMonths: 60, sd3neg: 100.7, sd2neg: 105.3, sd1neg: 110.0, median: 110.0, sd1: 114.6, sd2: 119.2, sd3: 123.9 },
];

export const WHO_GIRLS_LFA: WHOAgePoint[] = [
  { x: 0, ageMonths: 0, sd3neg: 43.6, sd2neg: 45.4, sd1neg: 47.3, median: 49.1, sd1: 51.0, sd2: 52.9, sd3: 54.7 },
  { x: 1, ageMonths: 1, sd3neg: 47.8, sd2neg: 49.8, sd1neg: 51.7, median: 53.7, sd1: 55.6, sd2: 57.6, sd3: 59.5 },
  { x: 2, ageMonths: 2, sd3neg: 51.0, sd2neg: 53.0, sd1neg: 55.0, median: 57.1, sd1: 59.1, sd2: 61.1, sd3: 63.2 },
  { x: 3, ageMonths: 3, sd3neg: 53.5, sd2neg: 55.6, sd1neg: 57.7, median: 59.8, sd1: 61.9, sd2: 64.0, sd3: 66.1 },
  { x: 6, ageMonths: 6, sd3neg: 58.9, sd2neg: 61.2, sd1neg: 63.5, median: 65.7, sd1: 68.0, sd2: 70.3, sd3: 72.5 },
  { x: 9, ageMonths: 9, sd3neg: 62.9, sd2neg: 65.3, sd1neg: 67.7, median: 70.1, sd1: 72.6, sd2: 75.0, sd3: 77.4 },
  { x: 12, ageMonths: 12, sd3neg: 66.3, sd2neg: 68.9, sd1neg: 71.4, median: 74.0, sd1: 76.6, sd2: 79.2, sd3: 81.7 },
  { x: 18, ageMonths: 18, sd3neg: 72.8, sd2neg: 74.9, sd1neg: 77.8, median: 80.7, sd1: 83.6, sd2: 86.5, sd3: 89.4 },
  { x: 24, ageMonths: 24, sd3neg: 76.0, sd2neg: 80.0, sd1neg: 82.5, median: 85.7, sd1: 88.9, sd2: 92.2, sd3: 95.4 },
  { x: 36, ageMonths: 36, sd3neg: 87.4, sd2neg: 91.2, sd1neg: 95.1, median: 95.1, sd1: 98.9, sd2: 102.7, sd3: 106.5 },
  { x: 48, ageMonths: 48, sd3neg: 94.1, sd2neg: 98.4, sd1neg: 102.7, median: 102.7, sd1: 107.0, sd2: 111.3, sd3: 115.7 },
  { x: 60, ageMonths: 60, sd3neg: 99.9, sd2neg: 104.7, sd1neg: 109.4, median: 109.4, sd1: 114.2, sd2: 119.0, sd3: 123.7 },
];

/**
 * Universal linear interpolation for any WHO dataset
 */
export function interpolateWHOPoint(xVal: number, dataset: WHOPoint[]): WHOPoint {
  const minVal = dataset[0].x;
  const maxVal = dataset[dataset.length - 1].x;
  const clamped = Math.max(minVal, Math.min(maxVal, xVal));

  const exact = dataset.find((p) => Math.abs(p.x - clamped) < 0.001);
  if (exact) return exact;

  let lower = dataset[0];
  let upper = dataset[dataset.length - 1];

  for (let i = 0; i < dataset.length - 1; i++) {
    if (dataset[i].x <= clamped && dataset[i + 1].x >= clamped) {
      lower = dataset[i];
      upper = dataset[i + 1];
      break;
    }
  }

  const fraction = (clamped - lower.x) / (upper.x - lower.x);
  const lerp = (a: number, b: number) => Number((a + fraction * (b - a)).toFixed(2));

  return {
    x: clamped,
    sd3neg: lerp(lower.sd3neg, upper.sd3neg),
    sd2neg: lerp(lower.sd2neg, upper.sd2neg),
    sd1neg: lerp(lower.sd1neg, upper.sd1neg),
    median: lerp(lower.median, upper.median),
    sd1: lerp(lower.sd1, upper.sd1),
    sd2: lerp(lower.sd2, upper.sd2),
    sd3: lerp(lower.sd3, upper.sd3),
  };
}

export function getWHOThresholds(lengthCm: number, sex: 'Boy' | 'Girl'): WHOLengthPoint {
  const dataset = sex === 'Boy' ? WHO_BOYS_WFL : WHO_GIRLS_WFL;
  const pt = interpolateWHOPoint(lengthCm, dataset);
  return { ...pt, lengthCm: pt.x };
}

export function getWHOWfaThresholds(ageMonths: number, sex: 'Boy' | 'Girl'): WHOAgePoint {
  const dataset = sex === 'Boy' ? WHO_BOYS_WFA : WHO_GIRLS_WFA;
  const pt = interpolateWHOPoint(ageMonths, dataset);
  return { ...pt, ageMonths: pt.x };
}

export function getWHOLfaThresholds(ageMonths: number, sex: 'Boy' | 'Girl'): WHOAgePoint {
  const dataset = sex === 'Boy' ? WHO_BOYS_LFA : WHO_GIRLS_LFA;
  const pt = interpolateWHOPoint(ageMonths, dataset);
  return { ...pt, ageMonths: pt.x };
}
