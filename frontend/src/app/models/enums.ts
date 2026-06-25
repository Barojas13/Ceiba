export enum EventType {
  Conferencia = 1,
  Taller = 2,
  Concierto = 3
}

export enum EventStatus {
  Activo = 1,
  Cancelado = 2,
  Completado = 3
}

export enum ReservationStatus {
  PendientePago = 1,
  Confirmada = 2,
  Cancelada = 3
}

export const EventTypeLabels: Record<EventType, string> = {
  [EventType.Conferencia]: 'Conferencia',
  [EventType.Taller]: 'Taller',
  [EventType.Concierto]: 'Concierto'
};

export const EventStatusLabels: Record<EventStatus, string> = {
  [EventStatus.Activo]: 'Activo',
  [EventStatus.Cancelado]: 'Cancelado',
  [EventStatus.Completado]: 'Completado'
};

export const ReservationStatusLabels: Record<ReservationStatus, string> = {
  [ReservationStatus.PendientePago]: 'Pendiente de pago',
  [ReservationStatus.Confirmada]: 'Confirmada',
  [ReservationStatus.Cancelada]: 'Cancelada'
};
