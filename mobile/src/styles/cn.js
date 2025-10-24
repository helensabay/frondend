export function cn(...inputs) {
  return inputs
    .flatMap((value) => {
      if (!value) return [];
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') {
        return Object.entries(value)
          .filter(([, condition]) => Boolean(condition))
          .map(([className]) => className);
      }
      return [];
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
