// Capitalism Tycoon – Idle mechanics with save/load + upgrades
const state = {
  money: 100,
  incomePerSecond: 0,
  companies: [
    { id: 'startup', name: 'Startup Tech', cost: 50, income: 1, owned: 0, desc: 'Applis & SaaS minimalistes.' },
    { id: 'market', name: 'Supermarchés', cost: 500, income: 12, owned: 0, desc: 'Volumes, marges serrées.' },
    { id: 'hotel', name: 'Hôtels Luxe', cost: 5000, income: 140, owned: 0, desc: 'ADR élevé, clientèle VIP.' },
    { id: 'oil', name: 'Pétrole & Gaz', cost: 25000, income: 820, owned: 0, desc: 'CASHFLOW massif, volatil.' },
    { id: 'space', name: 'Mine Spatiale', cost: 100000, income: 5600, owned: 0, desc: 'Ressources rares, futuriste.' },
  ],
  upgrades: [
    { id: 'ops', name: 'Optimisation Opérationnelle', desc: '+10% revenu global', cost: 1000, purchased: 0, effect: s => s.incomePerSecond *= 1.1 },
    { id: 'ads', name: 'Marketing Data-Driven', desc: '+20% revenu des Startups', cost: 3000, purchased: 0, effect: s => addMultiplier('startup',1.2) },
    { id: 'ai', name: 'Automatisation IA', desc: '+15% revenu global', cost: 10000, purchased: 0, effect: s => s.incomePerSecond *= 1.15 },
  ],
  multipliers: {},
};

function addMultiplier(id, m){
  state.multipliers[id] = (state.multipliers[id]||1) * m;
  recalcIncome();
}

function format(n){
  if(n>=1e12) return (n/1e12).toFixed(2)+'T';
  if(n>=1e9) return (n/1e9).toFixed(2)+'B';
  if(n>=1e6) return (n/1e6).toFixed(2)+'M';
  if(n>=1e3) return (n/1e3).toFixed(2)+'k';
  return n.toFixed(2);
}

function recalcIncome(){
  let inc = 0;
  for(const c of state.companies){
    const mul = state.multipliers[c.id]||1;
    inc += c.owned * c.income * mul;
  }
  state.incomePerSecond = inc;
}

function render(){
  document.getElementById('money').textContent = '$' + format(state.money);
  document.getElementById('income').textContent = '$' + format(state.incomePerSecond);
  const wrap = document.getElementById('companies');
  wrap.innerHTML = '';
  state.companies.forEach((c,idx)=>{
    const el = document.createElement('div');
    el.className='card';
    el.innerHTML = `
      <div class="row">
        <h3>${c.name}</h3>
        <div class="small">Possédé·es: <b>${c.owned}</b></div>
      </div>
      <div class="small">${c.desc}</div>
      <div class="row">
        <div class="small">Revenu: <b>$${format(c.income*(state.multipliers[c.id]||1))}/s</b> / unité</div>
        <button class="buy" data-idx="${idx}">Acheter — $${format(c.cost)}</button>
      </div>`;
    wrap.appendChild(el);
  });

  const upw = document.getElementById('upgrades');
  upw.innerHTML = '';
  state.upgrades.forEach((u,i)=>{
    const el = document.createElement('div');
    el.className='card';
    const disabled = u.purchased ? 'disabled' : '';
    el.innerHTML = `
      <h3>${u.name}</h3>
      <div class="small">${u.desc}</div>
      <div class="row">
        <div class="price">$${format(u.cost)}</div>
        <button class="buy" data-up="${i}" ${disabled}>${u.purchased?'Acheté':'Acheter'}</button>
      </div>`;
    upw.appendChild(el);
  });

  document.querySelectorAll('button.buy[data-idx]').forEach(btn=>{
    const i = +btn.dataset.idx;
    btn.disabled = state.money < state.companies[i].cost;
    btn.onclick = ()=>buyCompany(i);
  });
  document.querySelectorAll('button.buy[data-up]').forEach(btn=>{
    const i = +btn.dataset.up;
    btn.disabled = state.upgrades[i].purchased || state.money < state.upgrades[i].cost;
    btn.onclick = ()=>buyUpgrade(i);
  });
}

function buyCompany(i){
  const c = state.companies[i];
  if(state.money >= c.cost){
    state.money -= c.cost;
    c.owned += 1;
    c.cost = Math.round(c.cost * 1.15);
    recalcIncome();
    render();
  }
}

function buyUpgrade(i){
  const u = state.upgrades[i];
  if(!u.purchased && state.money >= u.cost){
    state.money -= u.cost;
    u.purchased = 1;
    u.effect(state);
    recalcIncome();
    render();
  }
}

function tick(){
  state.money += state.incomePerSecond / 10;
  render();
}

function save(){
  localStorage.setItem('capitalism_tycoon_save', JSON.stringify(state));
}

function load(){
  const raw = localStorage.getItem('capitalism_tycoon_save');
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    Object.assign(state, data);
  }catch(e){ console.warn('Load failed', e); }
  recalcIncome();
}

document.getElementById('saveBtn').onclick = save;
document.getElementById('resetBtn').onclick = ()=>{
  localStorage.removeItem('capitalism_tycoon_save');
  location.reload();
};
document.getElementById('exportBtn').onclick = ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'capitalism-tycoon-save.json';
  a.click();
};
document.getElementById('importFile').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      Object.assign(state, data);
      recalcIncome();
      render();
      save();
    }catch(err){ alert('Fichier invalide'); }
  };
  reader.readAsText(file);
});

load();
recalcIncome();
render();
setInterval(tick, 100);
