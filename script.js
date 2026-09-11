/* ============================================================
   KINGPINS — City of Crowns
   Football-Manager style crime empire sim
   ============================================================ */

const SAVE_KEY = "kingpins_save_v1";

const RIVALS = {
  saltTide: { name: "Salt Tide Crew", color: "#e08772" },
  jadeSerpent: { name: "Jade Serpent Society", color: "#e08772" },
  foundryWolves: { name: "Foundry Wolves", color: "#e08772" },
};

function defaultState(){
  return {
    day: 1,
    money: 5000,
    heat: 15,
    reputation: 50,
    feed: [
      { day: 1, text: "👑 Welcome to the city, Boss. Downtown answers to you — the rest is up for grabs.", tone:"good" }
    ],
    zones: {
      downtown:  { id:"downtown",  name:"Downtown",  nickname:"The Gilded Row",  type:"Bribery & rackets", owner:"player", income:500, defense:55, heat:6 },
      harbor:    { id:"harbor",    name:"Harbor",     nickname:"Rustwater Docks", type:"Smuggling",         owner:"saltTide", income:380, defense:60, heat:3 },
      chinatown: { id:"chinatown", name:"Chinatown",  nickname:"Red Lantern Quarter", type:"Gambling dens", owner:"jadeSerpent", income:620, defense:75, heat:5 },
      industrial:{ id:"industrial",name:"Industrial", nickname:"Ironvale",       type:"Arms & manufacturing", owner:"foundryWolves", income:300, defense:80, heat:2 },
      suburbs:   { id:"suburbs",   name:"Suburbs",    nickname:"Maple Hollow",   type:"Quiet money laundering", owner:"neutral", income:220, defense:30, heat:1 },
    },
    crew: [
      { id:"miguel", name:"Miguel", role:"Captain", muscle:70, smarts:65, loyalty:82, stealth:40 },
      { id:"carlos", name:"Carlos", role:"Soldier", muscle:75, smarts:40, loyalty:67, stealth:35 },
      { id:"dolores", name:"Dolores", role:"Fixer", muscle:30, smarts:88, loyalty:74, stealth:60 },
      { id:"ray", name:"Ray", role:"Lookout", muscle:35, smarts:55, loyalty:58, stealth:85 },
    ],
    recruits: [
      { id:"nikolai", name:"Nikolai", role:"Enforcer", muscle:90, smarts:30, loyalty:50, stealth:20, cost:1800 },
      { id:"sana", name:"Sana", role:"Driver", muscle:45, smarts:60, loyalty:65, stealth:70, cost:1500 },
      { id:"otis", name:"Otis", role:"Fixer", muscle:25, smarts:80, loyalty:55, stealth:50, cost:1200 },
    ],
  };
}

let state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){ /* ignore corrupt save */ }
  return defaultState();
}

function saveState(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){}
}

function factionName(owner){
  if(owner === "player") return "Kingpins (You)";
  if(owner === "neutral") return "Unclaimed";
  return RIVALS[owner]?.name || owner;
}

/* ============== Tactics ============== */
const TACTICS = {
  aggressive: { label:"Go loud", desc:"Lean on muscle. High risk, high reward, raises heat fast.", attr:"muscle", heat:9, costFactor:0 },
  cunning:    { label:"Play it smart", desc:"Use smarts and stealth to outmaneuver them quietly.", attr:"mixed", heat:2, costFactor:0 },
  bribe:      { label:"Grease palms", desc:"Spend cash to buy the district outright. Safest, costs the most.", attr:"cash", heat:0, costFactor:1 },
};

/* ============== Rendering ============== */

function renderAll(){
  renderTopbar();
  renderTicker();
  renderMap();
  renderSquad();
  renderStandings();
  renderFeed();
  document.getElementById("dayCount").textContent = state.day;
}

function renderTopbar(){
  document.getElementById("money").textContent = "$" + state.money.toLocaleString();
  document.getElementById("members").textContent = state.crew.length;
  document.getElementById("heat").textContent = Math.round(state.heat);
  document.getElementById("reputation").textContent = Math.round(state.reputation);
}

function flashStat(id, good){
  const el = document.getElementById(id);
  el.classList.remove("stat-flash","stat-flash-bad");
  void el.offsetWidth;
  el.classList.add(good ? "stat-flash" : "stat-flash-bad");
}

function renderTicker(){
  const ticker = document.getElementById("ticker");
  const latest = state.feed[0];
  if(!latest) return;
  ticker.textContent = latest.text;
  ticker.classList.remove("enter");
  void ticker.offsetWidth;
  ticker.classList.add("enter");
}

function renderMap(){
  const map = document.getElementById("cityMap");
  map.innerHTML = "";
  Object.values(state.zones).forEach(zone => {
    const div = document.createElement("div");
    const statusClass = zone.owner === "player" ? "owned" : zone.owner === "neutral" ? "neutral" : "rival";
    div.className = "zone " + statusClass;
    div.dataset.id = zone.id;

    const badgeLabel = zone.owner === "player" ? "You" : zone.owner === "neutral" ? "Unclaimed" : factionName(zone.owner);
    const actionLabel = zone.owner === "player" ? "Reinforce" : "Contest district";

    div.innerHTML = `
      <div class="zone-top">
        <div>
          <div class="zone-name">${zone.nickname}</div>
          <div class="zone-type">${zone.name} · ${zone.type}</div>
        </div>
        <div class="zone-badge ${statusClass}">${badgeLabel}</div>
      </div>
      <div class="zone-stats">
        <div>Daily income <b>$${zone.income}</b></div>
        <div>Defense
          <div class="meter"><div class="meter-fill" data-w="${zone.defense}"></div></div>
        </div>
      </div>
      <button class="zone-action ${zone.owner === 'player' ? 'owned-action' : ''}" data-zone="${zone.id}">${actionLabel}</button>
    `;
    map.appendChild(div);
  });

  requestAnimationFrame(() => {
    map.querySelectorAll(".meter-fill").forEach(m => { m.style.width = m.dataset.w + "%"; });
  });

  map.querySelectorAll(".zone-action").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openTurfModal(btn.dataset.zone);
    });
  });
}

function attrBarColor(val){
  if(val >= 70) return "linear-gradient(90deg,#3fb39c,#7fd9c4)";
  if(val >= 40) return "linear-gradient(90deg,#5c7897,#9db6cf)";
  return "linear-gradient(90deg,#c1462f,#e08772)";
}

function crewCardHTML(person, isRecruit){
  const initials = person.name.slice(0,2).toUpperCase();
  const attrs = [
    ["Muscle", person.muscle],
    ["Smarts", person.smarts],
    ["Loyalty", person.loyalty],
    ["Stealth", person.stealth],
  ];
  const attrsHTML = attrs.map(([label,val]) => `
    <div class="attr-row">
      <label>${label}</label>
      <div class="attr-bar"><div class="attr-fill" data-w="${val}" style="background:${attrBarColor(val)}"></div></div>
      <span class="attr-val">${val}</span>
    </div>
  `).join("");

  const footer = isRecruit
    ? `<button class="recruit-btn" data-recruit="${person.id}" ${state.money < person.cost ? "disabled" : ""}>Hire — $${person.cost.toLocaleString()}</button>`
    : "";

  return `
    <div class="crew-card">
      <div class="crew-head">
        <div class="avatar">${initials}</div>
        <div>
          <h3>${person.name}</h3>
          <span>${person.role}</span>
        </div>
      </div>
      ${attrsHTML}
      ${footer}
    </div>
  `;
}

function renderSquad(){
  const squadGrid = document.getElementById("squadGrid");
  squadGrid.innerHTML = state.crew.map(p => crewCardHTML(p,false)).join("");

  const recruitGrid = document.getElementById("recruitGrid");
  if(state.recruits.length === 0){
    recruitGrid.innerHTML = `<p style="color:var(--muted);font-size:.85rem;">No free agents on the market right now. Check back after you advance the day.</p>`;
  } else {
    recruitGrid.innerHTML = state.recruits.map(p => crewCardHTML(p,true)).join("");
  }

  requestAnimationFrame(() => {
    document.querySelectorAll("#squadGrid .attr-fill, #recruitGrid .attr-fill").forEach(f => { f.style.width = f.dataset.w + "%"; });
  });

  recruitGrid.querySelectorAll("[data-recruit]").forEach(btn => {
    btn.addEventListener("click", () => hireRecruit(btn.dataset.recruit));
  });
}

function hireRecruit(id){
  const idx = state.recruits.findIndex(r => r.id === id);
  if(idx === -1) return;
  const person = state.recruits[idx];
  if(state.money < person.cost) return;
  state.money -= person.cost;
  state.crew.push({ id:person.id, name:person.name, role:person.role, muscle:person.muscle, smarts:person.smarts, loyalty:person.loyalty, stealth:person.stealth });
  state.recruits.splice(idx,1);
  addFeed(`🤝 ${person.name} joined your crew as ${person.role}.`, "good");
  saveState();
  renderAll();
}

function totalStrength(owner){
  let base = 0;
  if(owner === "player"){
    base = state.crew.reduce((sum,p) => sum + p.muscle + p.smarts + p.stealth, 0) / Math.max(state.crew.length,1);
  } else if(owner === "neutral"){
    base = 20;
  } else {
    base = 55;
  }
  const zoneDefense = Object.values(state.zones).filter(z => z.owner === owner).reduce((s,z) => s + z.defense, 0);
  return Math.round(base + zoneDefense);
}

function renderStandings(){
  const factions = ["player","saltTide","jadeSerpent","foundryWolves"];
  const rows = factions.map(f => {
    const owned = Object.values(state.zones).filter(z => z.owner === f);
    const income = owned.reduce((s,z) => s + z.income, 0);
    return {
      id:f,
      name: f === "player" ? "Kingpins (You)" : RIVALS[f].name,
      districts: owned.length,
      strength: totalStrength(f),
      income,
    };
  }).sort((a,b) => b.districts - a.districts || b.strength - a.strength);

  const tbody = document.getElementById("standingsBody");
  tbody.innerHTML = rows.map((r,i) => `
    <tr class="${r.id === 'player' ? 'you' : ''}">
      <td>${i+1}</td>
      <td>${r.name}</td>
      <td>${r.districts}</td>
      <td>${r.strength}</td>
      <td>$${r.income.toLocaleString()}</td>
    </tr>
  `).join("");
}

function renderFeed(){
  const feed = document.getElementById("feed");
  feed.innerHTML = state.feed.map(f => `
    <div class="feedItem ${f.tone || ''}">
      <span>${f.text}</span>
      <span class="fday">Day ${f.day}</span>
    </div>
  `).join("");
}

function addFeed(text, tone){
  state.feed.unshift({ day: state.day, text, tone });
  if(state.feed.length > 60) state.feed.pop();
}

/* ============== Turf war modal ============== */

let selectedTactic = null;
let activeZoneId = null;

function openTurfModal(zoneId){
  activeZoneId = zoneId;
  selectedTactic = null;
  const zone = state.zones[zoneId];
  const overlay = document.getElementById("modalOverlay");
  const modal = document.getElementById("modal");
  const isOwned = zone.owner === "player";

  const heading = isOwned ? "Reinforce " + zone.nickname : "Contest " + zone.nickname;
  const sub = isOwned
    ? `Already yours. Reinforcing lowers heat and boosts defense for a price in loyalty.`
    : `Held by ${factionName(zone.owner)}. Defense rating ${zone.defense}. Choose your approach.`;

  const bribeCost = Math.round(zone.defense * 25);

  modal.innerHTML = `
    <h2>${heading}</h2>
    <p class="modal-sub">${sub}</p>
    <div class="tactic-options" id="tacticOptions">
      <div class="tactic" data-tactic="aggressive">
        <h4>Go loud</h4>
        <p>${TACTICS.aggressive.desc}</p>
      </div>
      <div class="tactic" data-tactic="cunning">
        <h4>Play it smart</h4>
        <p>${TACTICS.cunning.desc}</p>
      </div>
      <div class="tactic" data-tactic="bribe">
        <h4>Grease palms</h4>
        <p>${TACTICS.bribe.desc} Costs ~$${bribeCost.toLocaleString()}.</p>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" id="modalCancel">Back off</button>
      <button class="btn btn-primary" id="modalLaunch" disabled>Launch move</button>
    </div>
  `;

  modal.querySelectorAll(".tactic").forEach(el => {
    el.addEventListener("click", () => {
      modal.querySelectorAll(".tactic").forEach(t => t.classList.remove("selected"));
      el.classList.add("selected");
      selectedTactic = el.dataset.tactic;
      document.getElementById("modalLaunch").disabled = false;
    });
  });

  document.getElementById("modalCancel").addEventListener("click", closeModal);
  document.getElementById("modalLaunch").addEventListener("click", () => runTurfWar(zoneId, isOwned, bribeCost));

  overlay.classList.add("open");
}

function closeModal(){
  document.getElementById("modalOverlay").classList.remove("open");
}

function crewAverage(attr){
  if(state.crew.length === 0) return 20;
  if(attr === "mixed"){
    return state.crew.reduce((s,p) => s + (p.smarts + p.stealth)/2, 0) / state.crew.length;
  }
  return state.crew.reduce((s,p) => s + p[attr], 0) / state.crew.length;
}

function runTurfWar(zoneId, isOwned, bribeCost){
  const zone = state.zones[zoneId];
  const tactic = TACTICS[selectedTactic];
  const modal = document.getElementById("modal");

  if(selectedTactic === "bribe" && state.money < bribeCost){
    modal.innerHTML += `<p style="color:var(--red);font-size:.8rem;margin-top:8px;">Not enough cash for a bribe of this size.</p>`;
    return;
  }

  let playerPower;
  if(selectedTactic === "bribe"){
    playerPower = (state.money / bribeCost) * 60 + Math.random()*20;
  } else {
    playerPower = crewAverage(tactic.attr) + Math.random()*30;
  }

  const rivalPower = (isOwned ? zone.defense * 0.5 : zone.defense) + Math.random()*25;
  const success = playerPower >= rivalPower;

  const lines = [];
  if(isOwned){
    lines.push(`Your crew moves to shore up ${zone.nickname}...`);
    lines.push(tactic.label + " — reinforcing the district's defenses.");
  } else {
    lines.push(`Your crew moves on ${zone.nickname}, held by ${factionName(zone.owner)}...`);
    if(selectedTactic === "aggressive") lines.push("Fists and lead-pipes settle old scores in the alleys.");
    if(selectedTactic === "cunning") lines.push("Your people slip through the shadows, working every angle.");
    if(selectedTactic === "bribe") lines.push("An envelope changes hands. Then another.");
  }

  modal.innerHTML = `
    <h2>${isOwned ? "Reinforcing" : "Contesting"} ${zone.nickname}</h2>
    <div class="commentary" id="commentary"></div>
  `;

  const commentary = document.getElementById("commentary");
  let delay = 0;
  lines.forEach(line => {
    const p = document.createElement("div");
    p.className = "line";
    p.textContent = line;
    p.style.animationDelay = delay + "ms";
    commentary.appendChild(p);
    delay += 500;
  });

  setTimeout(() => {
    const finalLine = document.createElement("div");
    finalLine.className = "line final";
    finalLine.style.animationDelay = "0ms";

    if(isOwned){
      zone.defense = Math.min(95, zone.defense + 8);
      state.reputation = Math.min(100, state.reputation + 2);
      finalLine.textContent = `${zone.nickname}'s defenses hold firmer than ever.`;
      addFeed(`🛡️ Reinforced ${zone.nickname}. Defense up.`, "good");
    } else if(success){
      const previousOwnerName = factionName(zone.owner);
      zone.owner = "player";
      zone.defense = Math.max(30, Math.round(zone.defense * 0.7));
      state.reputation = Math.min(100, state.reputation + 6);
      finalLine.textContent = `${zone.nickname} now flies your colors.`;
      addFeed(`👑 Took ${zone.nickname} from ${previousOwnerName}.`, "good");
    } else {
      state.reputation = Math.max(0, state.reputation - 3);
      finalLine.textContent = `${factionName(zone.owner)} holds the line. Your crew retreats.`;
      addFeed(`💥 Failed to take ${zone.nickname}.`, "bad");
    }

    if(selectedTactic === "bribe"){
      state.money -= bribeCost;
    }
    state.heat = Math.max(0, Math.min(100, state.heat + tactic.heat));

    commentary.appendChild(finalLine);

    const banner = document.createElement("div");
    banner.className = "result-banner " + (isOwned ? "win" : (success ? "win" : "lose"));
    banner.textContent = isOwned ? "Defenses reinforced" : (success ? "District captured" : "Attempt failed");

    const modalEl = document.getElementById("modal");
    modalEl.insertBefore(banner, commentary.nextSibling);

    const actions = document.createElement("div");
    actions.className = "modal-actions";
    actions.innerHTML = `<button class="btn btn-primary" id="modalClose">Back to the map</button>`;
    modalEl.appendChild(actions);
    document.getElementById("modalClose").addEventListener("click", () => {
      closeModal();
      saveState();
      renderAll();
    });

  }, delay + 300);
}

/* ============== Day progression / AI ============== */

const RANDOM_EVENTS_GOOD = [
  "💰 A side hustle paid off better than expected.",
  "📦 A smuggling shipment slipped past the docks untouched.",
  "🤐 A witness decided to keep quiet, for a price.",
];
const RANDOM_EVENTS_BAD = [
  "🚔 Police increased patrols near your territory.",
  "⚔ A rival gang was spotted scouting your streets.",
  "🗞️ A reporter started asking questions downtown.",
];

function nextDay(){
  state.day += 1;

  let income = 0;
  Object.values(state.zones).forEach(z => {
    if(z.owner === "player"){
      income += z.income;
      state.heat += z.heat * 0.4;
    }
  });
  state.money += income;
  if(income > 0) addFeed(`💵 Collected $${income.toLocaleString()} from your districts.`, "good");

  // heat decay if low profile, else creeps up
  state.heat = Math.max(0, state.heat - 2);

  // police raid risk
  if(state.heat > 70 && Math.random() < 0.35){
    const loss = Math.round(state.money * 0.15);
    state.money = Math.max(0, state.money - loss);
    state.heat = Math.max(0, state.heat - 25);
    addFeed(`🚨 Raid! The police hit your operation and seized $${loss.toLocaleString()}. Heat drops as they move on.`, "bad");
  }

  // crew loyalty drift
  state.crew.forEach(p => {
    p.loyalty = Math.max(0, Math.min(100, p.loyalty + (Math.random()*6 - 3)));
  });
  const disloyal = state.crew.find(p => p.loyalty < 20);
  if(disloyal && Math.random() < 0.3){
    state.crew = state.crew.filter(p => p.id !== disloyal.id);
    addFeed(`🚪 ${disloyal.name} lost faith and walked out on the crew.`, "bad");
  }

  // rival AI: small chance to take a neutral zone or push into a weak player zone
  Object.values(state.zones).forEach(z => {
    if(z.owner === "neutral" && Math.random() < 0.15){
      const rivalIds = Object.keys(RIVALS);
      const picked = rivalIds[Math.floor(Math.random()*rivalIds.length)];
      z.owner = picked;
      addFeed(`📍 ${factionName(picked)} moved into ${z.nickname} while it sat unclaimed.`, "bad");
    } else if(z.owner === "player" && z.defense < 35 && Math.random() < 0.1){
      const rivalIds = Object.keys(RIVALS);
      const picked = rivalIds[Math.floor(Math.random()*rivalIds.length)];
      z.owner = picked;
      z.defense = 40;
      addFeed(`⚠️ ${factionName(picked)} pushed your weakened crew out of ${z.nickname}.`, "bad");
    }
  });

  // random flavor event
  if(Math.random() < 0.5){
    const pool = Math.random() < 0.6 ? RANDOM_EVENTS_GOOD : RANDOM_EVENTS_BAD;
    const tone = pool === RANDOM_EVENTS_GOOD ? "good" : "bad";
    const text = pool[Math.floor(Math.random()*pool.length)];
    addFeed(text, tone);
    if(tone === "good") state.money += Math.round(Math.random()*400 + 100);
    if(tone === "bad") state.heat = Math.min(100, state.heat + Math.round(Math.random()*8 + 2));
  }

  // occasionally refresh recruit market
  if(state.recruits.length < 2 && Math.random() < 0.4){
    const names = ["Vera","Tomas","Kiko","Lena","Bram","Ines"];
    const roles = ["Driver","Lookout","Enforcer","Fixer","Soldier"];
    const name = names[Math.floor(Math.random()*names.length)];
    const role = roles[Math.floor(Math.random()*roles.length)];
    state.recruits.push({
      id: name.toLowerCase()+state.day,
      name, role,
      muscle: 20 + Math.round(Math.random()*70),
      smarts: 20 + Math.round(Math.random()*70),
      loyalty: 40 + Math.round(Math.random()*40),
      stealth: 20 + Math.round(Math.random()*70),
      cost: 900 + Math.round(Math.random()*1400),
    });
    addFeed(`🕶️ A new face is looking for work: ${name}, ${role}.`, "good");
  }

  saveState
