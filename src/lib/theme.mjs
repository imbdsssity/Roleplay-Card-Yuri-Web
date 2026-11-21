// Once a visitor makes an explicit choice it remains pinned until changed.
export function chooseOppositeTheme(current, systemIsDark, storage) {
  const rendered = current === 'light dark' ? (systemIsDark ? 'dark' : 'light') : current;
  const target = rendered === 'dark' ? 'light' : 'dark';
  try { storage.setItem('archive-theme', target); } catch { /* The current page still changes. */ }
  return target;
}
