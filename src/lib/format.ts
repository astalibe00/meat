const currencyFormatter = new Intl.NumberFormat("uz-UZ", {
  style: "currency",
  currency: "UZS",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("uz-UZ", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value)).replace(/\u00a0/g, " ");
}

export function formatDate(value: string | Date) {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatTime(value: string | Date) {
  return timeFormatter.format(typeof value === "string" ? new Date(value) : value);
}
