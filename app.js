let selectedClass = "6", selectedFilter = "all", lessons = [], isAdmin = false;
const $ = id => document.getElementById(id);
const esc = s => String(s || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function loadLessons(){
  const r=await fetch(`/api/lessons?class=${selectedClass}`); lessons=await r.json(); render();
}
function render(){
  const q=$("search").value.toLowerCase();
  const shown=lessons.filter(x=>(selectedFilter==="all"||x.type===selectedFilter)&&(`${x.title} ${x.description}`.toLowerCase().includes(q)));
  $("libraryTitle").textContent=`Class ${selectedClass} resources`;
  $("count").textContent=`${shown.length} RESOURCE${shown.length===1?"":"S"}`;
  $("lessons").innerHTML=shown.length?shown.map(x=>`
    <article class="lesson">
      <div class="lesson-top">${x.type==="video"?"▶":"▤"}</div>
      <div class="lesson-info"><span class="tag">${x.type==="video"?"VIDEO LESSON":"PRESENTATION / DOCUMENT"} · CLASS ${x.className}</span>
      <h3>${esc(x.title)}</h3><p>${esc(x.description||"Open this resource to start learning.")}</p>
      <div class="lesson-actions"><button class="view-link" data-open="${x.id}">${x.type==="video"?"Watch lesson":"View resource"} ↗</button>${isAdmin?`<button class="delete-link" data-delete="${x.id}">Delete</button>`:""}</div></div>
    </article>`).join(""):`<div class="empty">No resources published for Class ${selectedClass} yet.<br><br>New lessons will appear here when the admin uploads them.</div>`;
  document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openLesson(Number(b.dataset.open)));
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteLesson(Number(b.dataset.delete)));
}
document.querySelectorAll(".class-card").forEach(b=>b.onclick=()=>{selectedClass=b.dataset.class;document.querySelectorAll(".class-card").forEach(x=>x.classList.toggle("active",x===b));loadLessons();});
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{selectedFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();});
$("search").oninput=render;
function openLesson(id){
 const x=lessons.find(a=>a.id===id);if(!x)return;
 $("viewerTitle").textContent=x.title;
 const url=x.url;
 if(x.type==="video") $("viewerBody").innerHTML=`<video controls playsinline src="${url}"></video><p class="muted">${esc(x.description)}</p>`;
 else {
   const ext=x.originalName.split(".").pop().toLowerCase();
   const embed=ext==="pdf"?`<iframe src="${url}" title="PDF viewer"></iframe>`:
     `<div class="empty">PowerPoint preview works when this site is publicly hosted and the file URL is publicly reachable through Microsoft Office Online.<br><br><a class="download" href="${url}" target="_blank" rel="noopener">Download / open presentation ↗</a></div>`;
   $("viewerBody").innerHTML=embed+`<a class="download" href="${url}" download>Download file ↗</a>`;
 }
 $("viewer").classList.remove("hidden");
}
$("viewerClose").onclick=()=>$("viewer").classList.add("hidden");
$("viewer").onclick=e=>{if(e.target===$("viewer"))$("viewer").classList.add("hidden")};
$("adminOpen").onclick=()=>$("adminModal").classList.remove("hidden");
$("adminClose").onclick=()=>$("adminModal").classList.add("hidden");
$("adminModal").onclick=e=>{if(e.target===$("adminModal"))$("adminModal").classList.add("hidden")};
function setAdmin(v){isAdmin=v;$("loginPanel").classList.toggle("hidden",v);$("uploadPanel").classList.toggle("hidden",!v);render();}
$("loginForm").onsubmit=async e=>{e.preventDefault();const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("password").value})});const d=await r.json();$("adminMessage").textContent=d.error||"";if(r.ok){setAdmin(true);$("password").value="";$("adminMessage").textContent="You are signed in.";loadLessons();}};
$("uploadForm").onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;btn.textContent="Uploading…";const r=await fetch("/api/lessons",{method:"POST",body:new FormData(e.target)});const d=await r.json();$("adminMessage").textContent=d.error||"Resource published successfully.";btn.disabled=false;btn.textContent="Publish resource";if(r.ok){e.target.reset();loadLessons();}};
$("logout").onclick=async()=>{await fetch("/api/logout",{method:"POST"});setAdmin(false);$("adminMessage").textContent="Signed out.";};
async function deleteLesson(id){if(!confirm("Delete this resource?"))return;const r=await fetch(`/api/lessons/${id}`,{method:"DELETE"});if(r.ok)loadLessons();}
fetch("/api/me").then(r=>r.json()).then(d=>setAdmin(d.admin));
loadLessons();