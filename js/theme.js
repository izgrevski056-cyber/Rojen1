export const THEME_KEY = 'rojen1_theme';

/** @returns {'light' | 'dark'} */
export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** @param {'light' | 'dark'} theme */
export function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#1e3a5f');
  }

  updateThemeButtonStates();
}

/** @param {'light' | 'dark'} theme */
export function setTheme(theme) {
  applyTheme(theme);
}

export function initTheme() {
  applyTheme(getTheme());
}

export function updateThemeButtonStates() {
  const theme = getTheme();
  document.getElementById('theme-light')?.classList.toggle('theme-option--active', theme === 'light');
  document.getElementById('theme-dark')?.classList.toggle('theme-option--active', theme === 'dark');
}

export default { getTheme, setTheme, applyTheme, initTheme, updateThemeButtonStates, THEME_KEY };
