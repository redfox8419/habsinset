// footer.js - Place in a /components or /js directory
document.addEventListener('DOMContentLoaded', function() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = `
      <footer style="padding: 16px 0; background-color: #111827;">
        <div class="container footer-content" style="max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 10px;">
          <p style="margin: 0; font-size: 0.95rem; color: #94a3b8;">2025 Habs Innovation AI Inset Day</p>
          <a href="../index.html" 
             style="color: #121726; background-color: rgba(255, 255, 255, 0.7); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; text-decoration: none; font-weight: 500; transition: all 0.2s ease;"
             onmouseover="this.style.backgroundColor='rgba(255, 255, 255, 0.9)'" 
             onmouseout="this.style.backgroundColor='rgba(255, 255, 255, 0.7)'">Home</a>
        </div>
      </footer>
    `;
  }
});