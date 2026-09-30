
const STORAGE_KEY = "participate_v1";

const emojiFor = {
  Create: "🎨",
  Move: "🚶",
  Connect: "🤝",
  Explore: "🧭",
  Improve: "🛠️"
};

const defaultData = () => ({
  entries: [],
  reflections: {}
});

let data = loadData();
let selectedCategory = null;
let selectedRating = null;
let calendarCursor = new Date();
calendarCursor.setDate(1);

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData();
  } catch {
    return defaultData();
  }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function isoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function prettyDate(str) {
  const [y,m,d] = str.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
}
function entriesForDate(dateStr) {
  return data.entries.filter(e => e.date === dateStr);
}
function uniqueParticipationDays(entries=data.entries) {
  return new Set(entries.map(e => e.date));
}
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),1800);
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "board") renderCalendar();
    if (btn.dataset.tab === "memories") renderMemories();
    if (btn.dataset.tab === "reflect") renderReflection();
  });
});

document.querySelectorAll(".category").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedCategory = btn.dataset.category;
    document.querySelectorAll(".category").forEach(b=>b.classList.toggle("selected", b===btn));
    updateLogButton();
  });
});

document.querySelectorAll("#aliveScale button").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedRating = Number(btn.dataset.rating);
    document.querySelectorAll("#aliveScale button").forEach(b=>b.classList.toggle("selected", b===btn));
  });
});

document.getElementById("activityNote").addEventListener("input", updateLogButton);

function updateLogButton() {
  const note = document.getElementById("activityNote").value.trim();
  document.getElementById("logButton").disabled = !(selectedCategory && note);
}

document.getElementById("logButton").addEventListener("click", () => {
  const note = document.getElementById("activityNote").value.trim();
  if (!selectedCategory || !note) return;
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: isoDate(),
    createdAt: new Date().toISOString(),
    category: selectedCategory,
    note,
    rating: selectedRating
  };
  const firstToday = entriesForDate(entry.date).length === 0;
  data.entries.push(entry);
  saveData();

  document.getElementById("activityNote").value = "";
  selectedCategory = null;
  selectedRating = null;
  document.querySelectorAll(".category").forEach(b=>b.classList.remove("selected"));
  document.querySelectorAll("#aliveScale button").forEach(b=>b.classList.remove("selected"));
  updateLogButton();
  renderAll();
  showToast(firstToday ? "⭐ You participated today." : "Moment added.");
});

function renderToday() {
  const todays = entriesForDate(isoDate());
  const star = document.getElementById("todayStar");
  const status = document.getElementById("todayStatus");
  const count = document.getElementById("todayCount");
  if (todays.length) {
    star.textContent = "★";
    star.classList.add("earned");
    status.textContent = "You participated today.";
    count.textContent = todays.length === 1 ? "One moment logged. That counts." : `${todays.length} moments logged. One was enough.`;
  } else {
    star.textContent = "☆";
    star.classList.remove("earned");
    status.textContent = "You haven't logged a participation moment yet.";
    count.textContent = "One is enough.";
  }
}

const badgeDefs = [
  {key:"create3", icon:"🎨", title:"Made a Thing", desc:"Create on 3 different days", check:()=>daysWith("Create")>=3},
  {key:"move3", icon:"👟", title:"Moved My Body", desc:"Move on 3 different days", check:()=>daysWith("Move")>=3},
  {key:"connect3", icon:"🫶", title:"Actual Human Contact", desc:"Connect on 3 different days", check:()=>daysWith("Connect")>=3},
  {key:"explore3", icon:"🌿", title:"Touched Grass", desc:"Explore on 3 different days", check:()=>daysWith("Explore")>=3},
  {key:"improve3", icon:"🔧", title:"Useful Adult", desc:"Improve on 3 different days", check:()=>daysWith("Improve")>=3},
  {key:"showup7", icon:"⭐", title:"Showed Up", desc:"Participate on 7 different days", check:()=>uniqueParticipationDays().size>=7},
];

function daysWith(category) {
  return new Set(data.entries.filter(e=>e.category===category).map(e=>e.date)).size;
}
function renderBadges() {
  const box = document.getElementById("badges");
  box.innerHTML = badgeDefs.map(b => {
    const earned = b.check();
    return `<div class="badge ${earned ? "" : "locked"}">
      <div class="badge-icon">${earned ? b.icon : "🔒"}</div>
      <div class="badge-title">${b.title}</div>
      <small>${b.desc}</small>
    </div>`;
  }).join("");
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  document.getElementById("monthTitle").textContent =
    calendarCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const today = isoDate();

  for (let i=0;i<firstDay;i++) {
    const div = document.createElement("div");
    div.className = "day empty";
    calendar.appendChild(div);
  }
  let participated = 0;
  for (let day=1;day<=daysInMonth;day++) {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const has = entriesForDate(dateStr).length > 0;
    if (has) participated++;
    const div = document.createElement("div");
    div.className = `day ${dateStr===today ? "today" : ""}`;
    div.innerHTML = `<span class="num">${day}</span><span class="star">${has ? "★" : ""}</span>`;
    calendar.appendChild(div);
  }
  document.getElementById("monthStars").textContent = participated;
}
document.getElementById("prevMonth").addEventListener("click",()=>{
  calendarCursor.setMonth(calendarCursor.getMonth()-1);
  renderCalendar();
});
document.getElementById("nextMonth").addEventListener("click",()=>{
  calendarCursor.setMonth(calendarCursor.getMonth()+1);
  renderCalendar();
});

function renderMemories() {
  const box = document.getElementById("memoryList");
  const sorted = [...data.entries].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  if (!sorted.length) {
    box.innerHTML = `<div class="empty-state">Your participation moments will collect here.</div>`;
    return;
  }
  box.innerHTML = sorted.map(e=>`
    <article class="memory">
      <div class="memory-top">
        <span class="pill">${emojiFor[e.category]} ${e.category}</span>
        <span class="muted small">${prettyDate(e.date)}</span>
      </div>
      <p>${escapeHtml(e.note)}</p>
      ${e.rating ? `<div class="alive">Felt alive: ${"●".repeat(e.rating)}${"○".repeat(5-e.rating)}</div>` : ""}
    </article>
  `).join("");
}

function currentWeekKey() {
  const d = new Date();
  const temp = new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const day = temp.getDay() || 7;
  temp.setDate(temp.getDate() + 4 - day);
  const yearStart = new Date(temp.getFullYear(),0,1);
  const weekNo = Math.ceil((((temp-yearStart)/86400000)+1)/7);
  return `${temp.getFullYear()}-W${String(weekNo).padStart(2,"0")}`;
}
function renderReflection() {
  const key = currentWeekKey();
  const r = data.reflections[key] || {};
  document.getElementById("aliveReflection").value = r.alive || "";
  document.getElementById("moreReflection").value = r.more || "";

  const cats = ["Create","Move","Connect","Explore","Improve"];
  document.getElementById("patternSummary").innerHTML = cats.map(c => {
    const arr = data.entries.filter(e=>e.category===c && e.rating);
    const avg = arr.length ? (arr.reduce((s,e)=>s+e.rating,0)/arr.length).toFixed(1) : "—";
    return `<div class="pattern"><span>${emojiFor[c]}</span><strong>${avg}</strong><small>${c}<br/>avg alive</small></div>`;
  }).join("");
}
document.getElementById("saveReflection").addEventListener("click",()=>{
  const key = currentWeekKey();
  data.reflections[key] = {
    alive: document.getElementById("aliveReflection").value.trim(),
    more: document.getElementById("moreReflection").value.trim(),
    savedAt: new Date().toISOString()
  };
  saveData();
  document.getElementById("reflectionSaved").textContent = "Saved.";
  setTimeout(()=>document.getElementById("reflectionSaved").textContent="",1600);
});

const BRYAN_EMAIL = "bryanpharris@gmail.com";

function notifyBryan(entry) {
  if (!entry) return showToast("Log a participation moment first.");
  const subject = "Participate: I showed up today";
  const ratingLine = entry.rating ? `\nFelt alive: ${entry.rating}/5` : "";
  const body = `Hey Bryan,\n\nI participated today.\n\n${entry.category}: ${entry.note}${ratingLine}\n\n⭐`;
  const href = `mailto:${BRYAN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

function latestEntry() {
  return [...data.entries].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0] || null;
}

document.getElementById("notifyBryanToday").addEventListener("click", () => {
  notifyBryan(latestEntry());
});

document.getElementById("shareRecent").addEventListener("click", () => {
  notifyBryan(latestEntry());
});

document.getElementById("exportData").addEventListener("click",()=>{
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `participate-backup-${isoDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById("importData").addEventListener("change", async (ev)=>{
  const file = ev.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.entries) || typeof imported.reflections !== "object") throw new Error();
    data = imported;
    saveData();
    renderAll();
    showToast("Data imported.");
  } catch {
    showToast("That file didn't look like a Participate backup.");
  }
  ev.target.value = "";
});
document.getElementById("clearData").addEventListener("click",()=>{
  if (!confirm("Clear every participation moment and reflection on this device?")) return;
  data = defaultData();
  saveData();
  renderAll();
  showToast("Data cleared.");
});

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function renderAll() {
  renderToday();
  renderBadges();
  renderCalendar();
  renderMemories();
  renderReflection();
}

renderAll();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
