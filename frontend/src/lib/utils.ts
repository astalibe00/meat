/**
 * Format number as Uzbek sum currency string
 * Example: 25000 → "25 000 so'm"
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU').replace(/,/g, ' ') + " so'm";
}

/**
 * Format short order ID from UUID
 * Example: "a1b2c3d4-..." → "#A1B2C3"
 */
export function shortId(id: string): string {
  return '#' + id.slice(0, 6).toUpperCase();
}

/**
 * Format date as readable Uzbek string
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month}, ${hours}:${mins}`;
}
