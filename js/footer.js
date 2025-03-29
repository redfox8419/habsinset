// footer.js - Place in a /components or /js directory
document.addEventListener('DOMContentLoaded', function() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
      footerPlaceholder.innerHTML = `
        <footer>
          <div class="container footer-content">
            <p>2025 Habs Innovation AI Inset Day</p>
            <a href="../index.html" class="home-btn">Home</a>
          </div>
        </footer>
      `;
    }
  });