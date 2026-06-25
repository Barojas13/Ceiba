import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function parsePriceInput(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = value.trim().replace(/\$/g, '').replace(/\s/g, '');
  if (!cleaned) {
    return null;
  }

  let normalized = cleaned;
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (hasComma) {
    const parts = cleaned.split(',');
    normalized =
      parts.length === 2 && parts[1].length <= 2
        ? `${parts[0]}.${parts[1]}`
        : cleaned.replace(/,/g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatPriceInput(value: number | string | null | undefined): string {
  const amount = typeof value === 'number' ? value : parsePriceInput(value);
  if (amount === null) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function priceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return null;
    }

    const parsed = parsePriceInput(rawValue);
    if (parsed === null) {
      return { invalidPrice: true };
    }

    if (parsed <= 0) {
      return { min: { min: 0.01, actual: parsed } };
    }

    return null;
  };
}
