import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const MINUTES_AHEAD = 1;

export function futureDateTimeValidator(minutesAhead = MINUTES_AHEAD): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const selected = new Date(value);
    if (Number.isNaN(selected.getTime())) {
      return { invalidDate: true };
    }

    const minimum = new Date();
    minimum.setMinutes(minimum.getMinutes() + minutesAhead);

    return selected >= minimum ? null : { futureDate: { minutesAhead } };
  };
}

export function endDateAfterStartValidator(startControlName = 'startDate'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const end = new Date(value);
    if (Number.isNaN(end.getTime())) {
      return { invalidDate: true };
    }

    const startValue = control.parent?.get(startControlName)?.value;
    if (!startValue) {
      return null;
    }

    const start = new Date(startValue);
    return end > start ? null : { endBeforeStart: true };
  };
}

export function weekendNightStartValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const afterTenPm = date.getHours() > 22 || (date.getHours() === 22 && date.getMinutes() > 0);

    return isWeekend && afterTenPm ? { weekendNight: true } : null;
  };
}

export function venueCapacityValidator(getVenueCapacity: () => number | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const capacity = getVenueCapacity();
    if (capacity === null) {
      return null;
    }

    return Number(value) <= capacity ? null : { exceedsVenueCapacity: { capacity } };
  };
}

export function toDateTimeLocalValue(date: Date): string {
  const pad = (part: number) => part.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toApiLocalDateTime(value: string): string {
  if (!value) {
    return value;
  }

  return value.length === 16 ? `${value}:00` : value;
}
