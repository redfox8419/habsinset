// header.js - Place in a /components or /js directory
document.addEventListener('DOMContentLoaded', function() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
      headerPlaceholder.innerHTML = `
        <header>
          <div class="container header-content">
            <a href="../index.html" class="logo">
              <span class="logo-icon"><i class="fas fa-robot"></i></span>
              <span>AI Inset Day</span>
            </a>
            <nav class="nav-links">
              <a href="../ai-foundations/index.html" class="nav-link">AI Foundations</a>
              <a href="../resource-builder/index.html" class="nav-link">Resource Builder</a>
              <a href="../code-creator/index.html" class="nav-link">Code Creator</a>
              <a href="../getting-started/why-use-ai.html" class="nav-link">Why Use AI</a>
            </nav>
          </div>
        </header>
      `;
    }
  });