export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const day = 86400000;
  const weeks = Math.floor(diff / (7 * day));
  const months = Math.floor(diff / (30 * day));
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks >= 1) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const days = Math.floor(diff / day);
  if (days >= 1) return `${days} day${days > 1 ? 's' : ''} ago`;
  return 'recently';
}

export function formatNaira(amount: number): string {
  return '\u20A6' + amount.toLocaleString('en-NG');
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
