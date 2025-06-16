function formatDateWithOrdinal(d: Date) {
  const day = d.getDate();
  const year = d.getFullYear();
  const month = d.toLocaleString('default', { month: 'long' });

  const suffix = getOrdinalSuffix(day);

  return `${month} ${day}${suffix}, ${year}`;
}

function getOrdinalSuffix(n: number) {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export { formatDateWithOrdinal, getOrdinalSuffix };