// showcase-nav.js - Add back to showcase navigation with dynamic path detection
document.addEventListener('DOMContentLoaded', function() {
    // Dynamically determine the path to showcase.html
    function getShowcasePath() {
      // Get the current path (everything after the domain)
      const path = window.location.pathname;
      
      // Count directory levels from the site root to current page
      // This assumes your site is served from the root of the domain
      const depth = path.split('/').filter(Boolean).length;
      
      // Calculate how many levels to go up to reach the showcase page
      // If showcase.html is in the main directory, we need to go up all
      // directory levels except one (the root)
      const upLevels = Math.max(0, depth - 1);
      
      // Build the path with the appropriate number of "../"
      let link = '';
      for (let i = 0; i < upLevels; i++) {
        link += '../';
      }
      link += 'showcase.html';
      
      return link;
    }
  
    // Create the back button
    const backButton = document.createElement('div');
    backButton.id = 'back-to-showcase';
    backButton.style.position = 'fixed';
    backButton.style.bottom = '20px';
    backButton.style.left = '20px';
    backButton.style.zIndex = '1000';
    backButton.style.backgroundColor = 'rgba(3, 105, 161, 0.8)';
    backButton.style.color = 'white';
    backButton.style.padding = '10px 15px';
    backButton.style.borderRadius = '6px';
    backButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    backButton.style.fontSize = '14px';
    backButton.style.cursor = 'pointer';
    backButton.style.transition = 'all 0.2s ease';
    backButton.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    // Create the anchor tag with the dynamically calculated path
    const link = document.createElement('a');
    link.href = getShowcasePath();
    link.style.color = 'white';
    link.style.textDecoration = 'none';
    link.style.display = 'flex';
    link.style.alignItems = 'center';
    
    // Add the arrow icon
    link.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Back to Showcase
    `;
    
    // Add the link to the button
    backButton.appendChild(link);
    
    // Add hover effects
    backButton.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(3, 105, 161, 1)';
      this.style.transform = 'translateY(-2px)';
    });
    
    backButton.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'rgba(3, 105, 161, 0.8)';
      this.style.transform = 'translateY(0)';
    });
    
    // Add the button to the page
    document.body.appendChild(backButton);
  });