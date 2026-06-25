import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Event } from '../models/event.model';
import { getMaxTicketsPerTransaction } from '../utils/business-rules.util';

export function reservationQuantityValidator(getEvent: () => Event | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const event = getEvent();
    const value = control.value;

    if (!event || value === null || value === undefined || value === '') {
      return null;
    }

    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return null;
    }

    const maxAllowed = getMaxTicketsPerTransaction(event);

    return quantity <= maxAllowed
      ? null
      : { maxTicketsPerTransaction: { max: maxAllowed } };
  };
}
