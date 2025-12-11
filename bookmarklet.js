// bookmarklet.js - Enhanced Security Version
(async function () {
  console.log("Clickedu Docs Overlay – loading (Secure Version)…");

  // ============================================================================
  // SECURITY CONFIGURATION
  // ============================================================================
  
  const SECURITY_CONFIG = {
    // Whitelist of allowed domains - MODIFY THIS LIST as needed
    allowedDomains: [
      'clickedu.eu',
      'docs.google.com',
      'drive.google.com',
      'educacio.gencat.cat',
      'xtec.cat',
      // Add more trusted domains here
    ],
    
    // Block executable file extensions
    blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar', '.app', '.dmg'],
    
    // Show warnings for external links (not in primary domain)
    warnOnExternal: true,
    
    // Log security events to console
    enableSecurityLogging: true,
    
    // Use CORS proxy if direct fetch fails (set to false by default)
    useCorsProxy: false
  };

  // ============================================================================
  // SECURITY FUNCTIONS
  // ============================================================================

  function isURLSafe(urlString) {
    try {
      const url = new URL(urlString);
      
      // Check protocol (only allow HTTPS and HTTP)
      if (!['https:', 'http:'].includes(url.protocol)) {
        logSecurity('warn', `Blocked non-HTTP(S) protocol: ${url.protocol} in ${urlString}`);
        return { safe: false, reason: 'Protocol no permès' };
      }
      
      // Check for blocked file extensions
      const path = url.pathname.toLowerCase();
      for (const ext of SECURITY_CONFIG.blockedExtensions) {
        if (path.endsWith(ext)) {
          logSecurity('warn', `Blocked dangerous file extension: ${ext} in ${urlString}`);
          return { safe: false, reason: 'Tipus de fitxer perillós' };
        }
      }
      
      // Check domain whitelist
      const hostname = url.hostname.toLowerCase();
      const isAllowed = SECURITY_CONFIG.allowedDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
      
      if (!isAllowed) {
        logSecurity('warn', `Blocked non-whitelisted domain: ${hostname}`);
        return { safe: false, reason: 'Domini no autoritzat' };
      }
      
      // Check if it's an external domain (for warnings)
      const isExternal = !hostname.endsWith('clickedu.eu') && 
                         !hostname.endsWith('google.com');
      
      return { 
        safe: true, 
        isExternal: isExternal && SECURITY_CONFIG.warnOnExternal,
        hostname: hostname
      };
      
    } catch (err) {
      logSecurity('error', `Invalid URL format: ${urlString}`);
      return { safe: false, reason: 'Format d\'URL invàlid' };
    }
  }

  function logSecurity(level, message) {
    if (!SECURITY_CONFIG.enableSecurityLogging) return;
    
    const prefix = '🔒 [SECURITY]';
    switch(level) {
      case 'warn': console.warn(prefix, message); break;
      case 'error': console.error(prefix, message); break;
      default: console.log(prefix, message);
    }
  }

  function sanitizeCSVValue(value) {
    // Remove potential CSV injection patterns
    if (typeof value !== 'string') return '';
    return value
      .replace(/^[=+\-@]/g, '') // Remove formula injection chars
      .trim();
  }

  // ============================================================================
  // ORIGINAL FUNCTIONALITY
  // ============================================================================

  if (!location.href.includes("insscf.clickedu.eu/sumari/index.php?p=links")) {
    alert("⚠️ Aquest bookmarklet només funciona al Clickedu, a la secció Passarel·les dins de Sumari");
    return;
  }

  let formNode = null, containerNode = null;
  const formXPath = '//form[@action="https://shorturl.at/anS1H"]';
  formNode = document.evaluate(formXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

  if (formNode) {
    containerNode = formNode.closest(".bloc-info-sumari");
    (containerNode || formNode).style.display = "none";
  }

  const btn = document.createElement("button");
  btn.textContent = "📂 Veure Documents";
  Object.assign(btn.style, {
    position: "fixed", top: "10px", right: "10px", zIndex: 9999,
    padding: "10px 15px", background: "#007bff", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,.2)", transition: "background .2s, opacity .3s",
    fontWeight: "bold", opacity: "1",
  });
  btn.onmouseover = () => btn.style.background = "#0056b3";
  btn.onmouseout = () => btn.style.background = "#007bff";
  document.body.appendChild(btn);

  let overlayVisible = false;

  btn.onclick = async () => {
    if (overlayVisible) { closeOverlay(); return; }
    openOverlay();
  };

  function openOverlay() {
    overlayVisible = true; btn.style.opacity = "0.2";
    const overlay = document.createElement("div");
    overlay.id = "docsOverlay";
    Object.assign(overlay.style, {
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.85)", zIndex: 9998, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
      padding: "20px", overflowY: "auto",
    });
    overlay.addEventListener("click", e => { if (e.target === overlay) closeOverlay(); });
    document.addEventListener("keydown", escClose);
    document.addEventListener("keydown", openSheetsShortcut);

    const loadingMsg = document.createElement("div");
    loadingMsg.textContent = "⏳ Carregant documents des del Google Sheet…";
    Object.assign(loadingMsg.style, { color: "white", fontSize: "18px", marginTop: "50px", textAlign: "center" });
    overlay.appendChild(loadingMsg);
    document.body.appendChild(overlay);

    loadDocs(overlay, loadingMsg);
  }

  function closeOverlay() {
    const overlay = document.getElementById("docsOverlay");
    if (overlay) overlay.remove();
    document.removeEventListener("keydown", escClose);
    document.removeEventListener("keydown", openSheetsShortcut);
    overlayVisible = false;
    btn.style.opacity = "1";
  }

  function escClose(e) { if (e.key === "Escape") closeOverlay(); }

  function openSheetsShortcut(e) {
    // Ctrl+Shift+S to open Google Sheets for maintenance
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      const SHEET_EDIT_URL = "https://docs.google.com/spreadsheets/d/1iAF3p81G8DdByShDyfz4ShoweV80QWuoQ7wWSzZUORQ/edit";
      window.open(SHEET_EDIT_URL, '_blank');
      logSecurity('info', 'User opened Google Sheets for maintenance via Ctrl+Shift+S');
      
      // Optional: Show a brief notification
      showTemporaryNotification("📝 S'ha obert el Google Sheet per a edició");
    }
  }

  function showTemporaryNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    Object.assign(notification.style, {
      position: "fixed",
      top: "70px",
      right: "10px",
      background: "#28a745",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
      zIndex: 10000,
      fontSize: "14px",
      fontWeight: "bold",
      opacity: "0",
      transition: "opacity 0.3s"
    });
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => notification.style.opacity = "1", 10);
    
    // Fade out and remove after 2 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  async function loadDocs(overlay, loadingMsg) {
    const SHEET_URL = "https://docs.google.com/spreadsheets/d/1iAF3p81G8DdByShDyfz4ShoweV80QWuoQ7wWSzZUORQ/export?format=csv&gid=0";
    
    try {
      logSecurity('info', 'Fetching documents from Google Sheets...');
      
      // Use XMLHttpRequest instead of fetch - better for CORS with Google Sheets
      const csv = await loadCSVviaXHR(SHEET_URL);
      
      // Check if we actually got CSV data
      if (!csv || csv.trim().length === 0) {
        throw new Error("El Google Sheet està buit o no és accessible");
      }
      
      // Parse and validate CSV
      const docs = parseCSV(csv);
      const validatedDocs = validateAndFilterDocs(docs);
      
      loadingMsg.remove();
      
      if (!Object.keys(validatedDocs.valid).length) { 
        showError("⚠️ No s'han trobat documents vàlids al Google Sheet", overlay); 
        return; 
      }
      
      // Show security summary if items were blocked
      if (validatedDocs.blocked.length > 0) {
        showSecurityWarning(overlay, validatedDocs.blocked);
      }
      
      buildUI(validatedDocs.valid, overlay);
      
      logSecurity('info', `Loaded ${countDocs(validatedDocs.valid)} valid documents`);
      
    } catch (err) {
      loadingMsg.remove();
      
      // Detailed error message
      const errorBox = document.createElement("div");
      Object.assign(errorBox.style, {
        background: "rgba(255,107,107,0.2)",
        border: "2px solid #ff6b6b",
        borderRadius: "12px",
        padding: "20px",
        maxWidth: "600px",
        color: "#fff"
      });
      
      errorBox.innerHTML = `
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 15px;">
          ❌ Error al carregar els documents
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Detall de l'error:</strong><br>
          ${err.message}
        </div>
        <div style="font-size: 14px; line-height: 1.6;">
          <strong>Possibles causes:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>El Google Sheet no és públic (ha de ser "Qualsevol persona amb l'enllaç")</li>
            <li>Problema de xarxa o firewall</li>
            <li>L'ID del Google Sheet és incorrecte</li>
            <li>CORS (Cross-Origin) està bloquejant la petició</li>
          </ul>
          <strong>Prova aquestes solucions:</strong>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Verifica que el Google Sheet sigui accessible <a href="${SHEET_URL}" target="_blank" style="color: #4fc3f7;">clicant aquí</a></li>
            <li>Obre el Google Sheet i configura: Share → "Anyone with the link" → "Viewer"</li>
            <li>Comprova la consola del navegador (F12) per veure més detalls</li>
          </ol>
        </div>
      `;
      
      overlay.appendChild(errorBox);
      console.error("Full error details:", err);
      logSecurity('error', `Failed to load documents: ${err.message}`);
    }
  }

  function loadCSVviaXHR(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
      
      xhr.open('GET', cacheBuster, true);
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      xhr.onerror = function() {
        reject(new Error('Failed to fetch: Network error or CORS issue'));
      };
      xhr.send();
    });
  }

  function parseCSV(text) {
    const lines = text.split("\n").filter(l => l.trim()), groups = {};
    const parseLine = line => { 
      const out=[], len=line.length; 
      let cur="", q=false; 
      for(let i=0;i<len;i++){
        const c=line[i], n=line[i+1]; 
        if(c==='"'){
          if(q&&n==='"'){cur+='"';i++;} 
          else q=!q;
        } else if(c===","&&!q){
          out.push(cur.trim());
          cur="";
        } else cur+=c;
      } 
      out.push(cur.trim()); 
      return out; 
    };
    
    for(let i=1;i<lines.length;i++){
      const [group,label,url] = parseLine(lines[i]).map(v=>sanitizeCSVValue(v.replace(/^"+|"+$/g,"")));
      if(!group||!label||!url) continue;
      if(!groups[group]) groups[group]=[];
      groups[group].push({label,url});
    }
    return groups;
  }

  function validateAndFilterDocs(groups) {
    const valid = {};
    const blocked = [];
    
    for (const groupName in groups) {
      const docs = groups[groupName];
      const validDocs = [];
      
      docs.forEach(doc => {
        const check = isURLSafe(doc.url);
        
        if (check.safe) {
          validDocs.push({
            ...doc,
            isExternal: check.isExternal,
            hostname: check.hostname
          });
        } else {
          blocked.push({
            group: groupName,
            label: doc.label,
            url: doc.url,
            reason: check.reason
          });
        }
      });
      
      if (validDocs.length > 0) {
        valid[groupName] = validDocs;
      }
    }
    
    return { valid, blocked };
  }

  function showSecurityWarning(overlay, blockedItems) {
    const warning = document.createElement("div");
    Object.assign(warning.style, {
      background: "rgba(255, 152, 0, 0.2)",
      border: "2px solid #ff9800",
      borderRadius: "8px",
      padding: "15px",
      margin: "20px 0",
      maxWidth: "1200px",
      width: "100%"
    });
    
    warning.innerHTML = `
      <div style="color: #ff9800; font-weight: bold; margin-bottom: 10px;">
        🛡️ Avís de Seguretat: S'han bloquejat ${blockedItems.length} enllaç(os) sospitós(os)
      </div>
      <div style="color: #fff; font-size: 14px; line-height: 1.5;">
        Els següents enllaços no compleixen els criteris de seguretat i no es mostren:
        <ul style="margin-top: 10px; padding-left: 20px;">
          ${blockedItems.slice(0, 5).map(item => 
            `<li><strong>${item.label}</strong> (${item.reason})</li>`
          ).join('')}
          ${blockedItems.length > 5 ? `<li><em>... i ${blockedItems.length - 5} més</em></li>` : ''}
        </ul>
      </div>
    `;
    
    overlay.appendChild(warning);
  }

  function buildUI(groups, overlay) {
    const container = document.createElement("div");
    Object.assign(container.style, { width:"100%", maxWidth:"1200px", marginTop:"20px" });
    
    for(const groupName in groups){
      const docs = groups[groupName];
      const section = document.createElement("div");
      Object.assign(section.style, { 
        marginBottom:"15px", 
        background:"rgba(255,255,255,0.1)", 
        borderRadius:"12px", 
        overflow:"hidden" 
      });
      
      const header = document.createElement("div");
      header.textContent = `▼ ${groupName} (${docs.length})`;
      Object.assign(header.style, { 
        padding:"15px 20px", 
        background:"rgba(0,123,255,0.8)", 
        color:"white", 
        fontSize:"18px", 
        fontWeight:"bold", 
        cursor:"pointer", 
        userSelect:"none", 
        transition:"background 0.2s" 
      });
      header.onmouseover = ()=>header.style.background="rgba(0,123,255,1)";
      header.onmouseout = ()=>header.style.background="rgba(0,123,255,0.8)";
      
      const content=document.createElement("div");
      Object.assign(content.style,{
        display:"none",
        gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
        gap:"10px",
        padding:"0"
      });
      
      let open=false;
      header.onclick=()=>{
        open=!open;
        content.style.display=open?"grid":"none";
        content.style.padding=open?"15px":"0";
        header.textContent=`${open?"▲":"▼"} ${groupName} (${docs.length})`;
      };
      
      docs.forEach(d=>{
        const btn=document.createElement("button");
        
        // Apply visual security indicators
        if (d.isExternal) {
          btn.textContent = `🌐 ${d.label}`;
          btn.style.background = "#ff9800"; // Orange for external
          btn.title = `Enllaç extern: ${d.hostname}\n(Click per obrir en una nova pestanya)`;
        } else {
          btn.textContent = d.label;
          btn.style.background = "#007bff"; // Blue for internal
          btn.title = `Enllaç intern: ${d.hostname}`;
        }
        
        Object.assign(btn.style,{
          padding:"12px",
          fontSize:"14px",
          cursor:"pointer",
          borderRadius:"8px",
          border:"none",
          color:"#fff",
          boxShadow:"0 2px 4px rgba(0,0,0,0.2)",
          transition:"background .2s",
          textAlign:"left"
        });
        
        btn.onmouseover = () => {
          btn.style.background = d.isExternal ? "#f57c00" : "#0056b3";
        };
        btn.onmouseout = () => {
          btn.style.background = d.isExternal ? "#ff9800" : "#007bff";
        };
        
        btn.onclick = () => {
          // Additional confirmation for external links
          if (d.isExternal) {
            const confirm = window.confirm(
              `Estàs a punt d'obrir un enllaç extern:\n\n${d.hostname}\n\nVols continuar?`
            );
            if (!confirm) return;
          }
          
          logSecurity('info', `User opened: ${d.url}`);
          window.open(d.url,"_blank");
        };
        
        content.appendChild(btn);
      });
      
      section.appendChild(header);
      section.appendChild(content);
      container.appendChild(section);
    }
    
    overlay.appendChild(container);
  }

  function countDocs(groups) {
    let total = 0;
    for (const groupName in groups) {
      total += groups[groupName].length;
    }
    return total;
  }

  function showError(message, overlay) { 
    const box=document.createElement("div"); 
    box.textContent=message; 
    Object.assign(box.style,{
      color:"#ffc107", 
      fontSize:"18px", 
      textAlign:"center", 
      marginTop:"20px"
    }); 
    overlay.appendChild(box); 
  }
  
  logSecurity('info', 'Bookmarklet initialized with security features enabled');
})();
