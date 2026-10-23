// TruthLens AI — apply the saved theme before first paint (default: light)
try {
  var stored = localStorage.getItem('newsguard_theme');
  document.documentElement.setAttribute('data-theme', stored === 'dark' ? 'dark' : 'light');
} catch (e) {
  document.documentElement.setAttribute('data-theme', 'light');
}
