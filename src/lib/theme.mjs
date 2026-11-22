// Once a visitor makes an explicit choice it remains pinned until changed.
export function isDarkTheme(current, systemIsDark) {
  return current === 'light dark' ? systemIsDark : current === 'dark';
}
export function chooseOppositeTheme(current, systemIsDark, storage) {
  const target = isDarkTheme(current, systemIsDark) ? 'light' : 'dark';
  try { storage.setItem('archive-theme', target); } catch { /* The current page still changes. */ }
  return target;
}
