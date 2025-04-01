// header.js - Ultra Simple Hamburger Menu Implementation
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded"); // Debug log
    
    const headerPlaceholder = document.getElementById('header-placeholder');
    console.log("Found header placeholder:", !!headerPlaceholder); // Debug log
    
    if (headerPlaceholder) {
      // Create the header content as a string
      const headerHTML = `
        <style>
          /* Menu Styles */
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
          }
          
          .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            color: white;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.8rem;
          }
          
          .menu-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 18px;
            width: 25px;
            padding: 0;
          }
          
          .menu-btn span {
            display: block;
            height: 2px;
            width: 100%;
            background-color: white;
          }

          .tooltip {
            position: relative;
          }

          .tooltip::after {
            content: attr(data-tooltip);
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 14px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease, transform 0.2s ease;
            transform-origin: top;
            transform: translateX(-50%) scale(0.8);
            z-index: 200;
            margin-top: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          }

          .tooltip:hover::after {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          
          .dropdown {
            position: absolute;
            top: 60px;
            right: 20px;
            background-color: #192133;
            border-radius: 4px;
            width: 200px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            display: none;
            z-index: 100;
          }
          
          .dropdown.show {
            display: block;
          }
          
          .dropdown a {
            display: block;
            padding: 12px 20px;
            color: white;
            text-decoration: none;
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          
          .dropdown a:last-child {
            border-bottom: none;
          }
          
          .dropdown a:hover {
            background-color: rgba(255,255,255,0.1);
          }
        </style>
        
        <header>
          <div class="container header-content">
            <a href="../index.html" class="logo">
              <span class="logo-icon">
                <img src="../images/ai-icon.png" alt="AI Icon" style="height: 40px; width: auto; margin-top: 10px;">
              </span>
              <span>AI Inset Day</span>
            </a>
            
            <button id="menuBtn" class="menu-btn">
              <span></span>
              <span></span>
              <span></span>
            </button>
            
            <div id="dropdown" class="dropdown">
              <a href="../index.html#pathways" class="tooltip" data-tooltip="Guided AI learning">Learning Pathways</a>
              <a href="../resources/index.html" class="tooltip" data-tooltip="AI resources for teachers">Resources</a>
              <a href="../showcase.html" class="tooltip" data-tooltip="See AI in action">Showcase</a>
            </div>
          </div>
        </header>
      `;
      
      // Set the HTML to the placeholder
      headerPlaceholder.innerHTML = headerHTML;
      console.log("Header HTML inserted"); // Debug log
      
      // After the HTML is inserted, add event listeners
      const menuBtn = document.getElementById('menuBtn');
      const dropdown = document.getElementById('dropdown');
      
      console.log("Menu button found:", !!menuBtn); // Debug log
      console.log("Dropdown found:", !!dropdown); // Debug log
      
      if (menuBtn && dropdown) {
        // Toggle dropdown on button click
        menuBtn.addEventListener('click', function(e) {
          console.log("Menu button clicked"); // Debug log
          e.stopPropagation();
          dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function(e) {
          if (dropdown.classList.contains('show')) {
            if (!dropdown.contains(e.target) && e.target !== menuBtn) {
              dropdown.classList.remove('show');
            }
          }
        });
      }
    }
  });