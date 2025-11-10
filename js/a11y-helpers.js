// Basic accessibility helpers shared across static pages.
// Adds aria-hidden to decorative Font Awesome icons to keep screen readers quiet.

(function () {
  function enhanceIcons() {
    const icons = document.querySelectorAll('i[class*="fa-"]:not([aria-hidden])');
    icons.forEach((icon) => {
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceIcons, { once: true });
  } else {
    enhanceIcons();
  }
})();
