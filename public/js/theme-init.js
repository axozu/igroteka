// Ставит сохранённую тему до отрисовки страницы, чтобы не было «вспышки» светлой темы.
// Обычный скрипт (не модуль) без defer: выполняется сразу при разборе <head>.
// Любая ошибка (нет доступа к localStorage, мусор в значении) — тема «как в системе».
(function initTheme() {
  try {
    var raw = localStorage.getItem('igroteka:theme');
    var theme = raw === null ? null : JSON.parse(raw);
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (error) {
    // Оставляем тему системы.
  }
})();
