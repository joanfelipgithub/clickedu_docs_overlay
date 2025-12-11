// bookmarklet.js
(async function () {
  console.log("Clickedu Docs Overlay – loading…");

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
    overlayVisible = false;
    btn.style.opacity = "1";
  }

  function escClose(e) { if (e.key === "Escape") closeOverlay(); }

  async function loadDocs(overlay, loadingMsg) {
    const SHEET_URL = "https://docs.google.com/spreadsheets/d/1iAF3p81G8DdByShDyfz4ShoweV80QWuoQ7wWSzZUORQ/export?format=csv&gid=0";
    try {
      const response = await fetch(SHEET_URL + "&_=" + Date.now());
      if (!response.ok) throw new Error("HTTP " + response.status);
      const csv = await response.text();
      const docs = parseCSV(csv);
      loadingMsg.remove();
      if (!Object.keys(docs).length) { showError("⚠️ No s'han trobat documents vàlids al Google Sheet", overlay); return; }
      buildUI(docs, overlay);
    } catch (err) {
      loadingMsg.textContent = "❌ Error: " + err.message + "\n\nComprova el Google Sheet.";
      loadingMsg.style.color = "#ff6b6b";
      console.error(err);
    }
  }

  function parseCSV(text) {
    const lines = text.split("\n").filter(l => l.trim()), groups = {};
    const parseLine = line => { const out=[], len=line.length; let cur="", q=false; for(let i=0;i<len;i++){const c=line[i], n=line[i+1]; if(c==='"'){if(q&&n==='"'){cur+='"';i++;}else q=!q;} else if(c===","&&!q){out.push(cur.trim());cur="";} else cur+=c;} out.push(cur.trim()); return out; };
    for(let i=1;i<lines.length;i++){
      const [group,label,url] = parseLine(lines[i]).map(v=>v.replace(/^"+|"+$/g,"").trim());
      if(!group||!label||!url) continue;
      if(!groups[group]) groups[group]=[];
      groups[group].push({label,url});
    }
    return groups;
  }

  function buildUI(groups, overlay) {
    const container = document.createElement("div");
    Object.assign(container.style, { width:"100%", maxWidth:"1200px", marginTop:"20px" });
    for(const groupName in groups){
      const docs = groups[groupName];
      const section = document.createElement("div");
      Object.assign(section.style, { marginBottom:"15px", background:"rgba(255,255,255,0.1)", borderRadius:"12px", overflow:"hidden" });
      const header = document.createElement("div");
      header.textContent = `▼ ${groupName} (${docs.length})`;
      Object.assign(header.style, { padding:"15px 20px", background:"rgba(0,123,255,0.8)", color:"white", fontSize:"18px", fontWeight:"bold", cursor:"pointer", userSelect:"none", transition:"background 0.2s" });
      header.onmouseover = ()=>header.style.background="rgba(0,123,255,1)";
      header.onmouseout = ()=>header.style.background="rgba(0,123,255,0.8)";
      const content=document.createElement("div");
      Object.assign(content.style,{display:"none",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:"10px",padding:"0"});
      let open=false;
      header.onclick=()=>{open=!open;content.style.display=open?"grid":"none";content.style.padding=open?"15px":"0";header.textContent=`${open?"▲":"▼"} ${groupName} (${docs.length})`;};
      docs.forEach(d=>{const btn=document.createElement("button");btn.textContent=d.label;Object.assign(btn.style,{padding:"12px",fontSize:"14px",cursor:"pointer",borderRadius:"8px",border:"none",background:"#007bff",color:"#fff",boxShadow:"0 2px 4px rgba(0,0,0,0.2)",transition:"background .2s",textAlign:"left"});btn.onmouseover=()=>btn.style.background="#0056b3";btn.onmouseout=()=>btn.style.background="#007bff";btn.onclick=()=>window.open(d.url,"_blank");content.appendChild(btn);});
      section.appendChild(header);section.appendChild(content);container.appendChild(section);
    }
    overlay.appendChild(container);
  }

  function showError(message, overlay) { const box=document.createElement("div"); box.textContent=message; Object.assign(box.style,{color:"#ffc107", fontSize:"18px", textAlign:"center", marginTop:"20px"}); overlay.appendChild(box); }
})();
