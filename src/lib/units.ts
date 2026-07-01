import type { Units } from '../types/app';

export const KG_PER_LB = 0.45359237;

export function kgToDisplay(kg: number, units: Units): number {
  return units === 'lb' ? kg / KG_PER_LB : kg;
}

export function displayToKg(value: number, units: Units): number {
  return units === 'lb' ? value * KG_PER_LB : value;
}

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return inch === 12 ? { ft: ft + 1, in: 0 } : { ft, in: inch };
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * 2.54);
}
