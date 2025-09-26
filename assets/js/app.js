// ===============================
// Navegación responsive (navbar)
// ===============================
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('.nav-toggle');
  if (toggle) {
    const nav = document.querySelector('.nav-links');
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open');
  }
});

// ===============================
// Catálogo de equipos 
// ===============================
const TEAMS = [
  { id: "colo",     name: "Colo-Colo",                      defaultRating: 78, crest:"assets/img/escudos/colo.png" },
  { id: "udechile", name: "Universidad de Chile",           defaultRating: 60, crest:"assets/img/escudos/laU.png" },
  { id: "cato",     name: "Universidad Catolica de Chile",  defaultRating: 56, crest:"assets/img/escudos/cato.png"},
  {id:  "uniEsp",   name: "Union Española",                 defaultRating: 40, crest:"assets/img/escudos/uniEsp.png" }
  // nuevos equipos 

];

// ===============================
// escudo por defecto
// ===============================
const gen_crest = "assets/img/escudos/gen.png"


// ===============================
// Cargar lista de equipos
// ===============================
function populateTeamSelect(selectEl) {

  TEAMS.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    selectEl.appendChild(opt);
  });
}

// ===============================
// obtiene un equipo por su id
// ===============================
function getTeamById(id) {
  return TEAMS.find(t => t.id === id);
}

// ===============================
// Cambia el escudo y gestiona rating
// ===============================

function updateCrest(selectEl, imgEl, ratingInput) {
  const team = getTeamById(selectEl.value);
  if (!team) {
    imgEl.src = gen_crest;
    imgEl.alt = "Escudo no seleccionado";
    imgEl.classList.add('is-placeholder');
    ratingInput.readOnly = false; // desbloquea si vuelves al placeholder
    return;
  }
  imgEl.src = team.crest;
  imgEl.alt = `Escudo de ${team.name}`;
  imgEl.classList.remove('is-placeholder');
  // autocompletar + bloquear rating
  ratingInput.value = team.defaultRating;
  ratingInput.readOnly = true;
}

// ===============================
// Validación y utilidades comunes
// ===============================


// ===============================
// Setea el mensaje de error
// ===============================
function setError(input, message) {
  const small = document.querySelector(`.error[data-for="${input.id}"]`);
  if (small) small.textContent = message || '';
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validateTeamSelect(selectEl) {

   const empty = !(selectEl && selectEl.value);
  const msg = empty
    ? (selectEl.id === 'teamA'
        ? 'Debe seleccionar un equipo local antes de simular.'
        : 'Debe seleccionar un equipo visitante antes de simular.')
    : '';
  setError(selectEl, msg);
  return !empty;
}

function validateRange(input, min, max) {
  const n = Number(input.value);
  if (Number.isNaN(n)) return setError(input, 'Debe ser un número.');
  if (n < min || n > max) return setError(input, `Debe estar entre ${min} y ${max}.`);
  setError(input, '');
}

function addSuggestions(teamAEl, teamBEl) {
  if (teamAEl.value && teamBEl.value && teamAEl.value === teamBEl.value) {
    setError(teamBEl, 'Sugerencia: usa equipos distintos.');
  } else {
    setError(teamBEl, '');
  }
}

// ===============================
// Simulación (Poisson + ponderadores)
// ===============================
function poissonRandom(lambda) {
  let L = Math.exp(-lambda), k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

function simulateMatch({nomA,nomB, ratingA, ratingB, weather, pace, duration }) {
  
  
  const Ra = Math.max(1, Math.min(100, ratingA)) / 100;
  const Rb = Math.max(1, Math.min(100, ratingB)) / 100;

  const weatherMod = ({ normal:1.0, lluvia:0.9, viento:0.92, calor:0.88 }[weather]) ?? 1.0;
  const paceMod    = ({ equilibrado:1.0, ofensivo:1.15, defensivo:0.85 }[pace]) ?? 1.0;

  const baseLambda = (2.6 / 90) * duration * weatherMod * paceMod;

  const total   = Ra + Rb;
  const lambdaA = baseLambda * (Ra / total) * (1.1 + (Ra - Rb) * 0.4);
  const lambdaB = baseLambda * (Rb / total) * (1.1 + (Rb - Ra) * 0.4);

  const goalsA = poissonRandom(Math.max(0.05, lambdaA));
  const goalsB = poissonRandom(Math.max(0.05, lambdaB));

  const events = [];
  const addEvent = (min, text) => events.push({ min, text });
  const randMin = () => Math.max(1, Math.floor(Math.random() * duration));

  for (let i = 0; i < goalsA; i++) addEvent(randMin(), '⚽  Gol de '+ nomA);
  for (let i = 0; i < goalsB; i++) addEvent(randMin(), '⚽ Gol de ' + nomB);

  
 

  if (Math.random() < 0.9)  addEvent(randMin(), '🟨 Tarjeta amarilla');
  if (Math.random() < 0.15) addEvent(randMin(), '🟥 Tarjeta roja');
  if (Math.random() < 0.1)  addEvent(randMin(), '⛑️ Lesión');

  events.sort((e1, e2) => e1.min - e2.min);
  return { goalsA, goalsB, events };
}

// ===============================
// Lógica de páginas (DOMContentLoaded)
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  // --------- Página: simular (formulario) ----------
  const form          = document.getElementById('matchForm');
  const teamA         = document.getElementById('teamA');
  const teamB         = document.getElementById('teamB');
  const ratingA       = document.getElementById('ratingA');
  const ratingB       = document.getElementById('ratingB');
  const crestA        = document.getElementById('crestA');
  const crestB        = document.getElementById('crestB');
  const duration      = document.getElementById('duration');
  const resultSection = document.getElementById('resultSection');
  const scoreline     = document.getElementById('scoreline');
  const eventsDiv     = document.getElementById('events');
  const saveBtn       = document.getElementById('saveMatch');

  if (form && teamA && teamB) {
    // Poblar selects con el catálogo (AHORA sí, dentro del DOMContentLoaded)
    populateTeamSelect(teamA);
    populateTeamSelect(teamB);

    updateCrest(teamA, crestA, ratingA);
    updateCrest(teamB, crestB, ratingB);

    // Autocompletar rating al seleccionar un equipo
    teamA.addEventListener('change', () => {
      updateCrest(teamA, crestA, ratingA);
      validateTeamSelect(teamA);
      addSuggestions(teamA, teamB);
    });

    teamB.addEventListener('change', () => {
      updateCrest(teamB, crestB, ratingB);
      validateTeamSelect(teamB);
      addSuggestions(teamA, teamB);
    });

    // Validaciones en tiempo real (SOLO valida)
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (t === ratingA) validateRange(ratingA, 1, 100);
      if (t === ratingB) validateRange(ratingB, 1, 100);
      if (t === duration) validateRange(duration, 30, 120);
      if (t === teamA || t === teamB) validateTeamSelect(t);
      addSuggestions(teamA, teamB);
    });

    // Validar todo
    const validateAll = () => {
      validateTeamSelect(teamA);
      validateTeamSelect(teamB);
      validateRange(ratingA, 1, 100);
      validateRange(ratingB, 1, 100);
      validateRange(duration, 30, 120);
      addSuggestions(teamA, teamB);
      return !document.querySelector('[aria-invalid="true"]');
    };

    // Envío del formulario → simular y mostrar resultado (AQUÍ va la simulación)
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateAll()) {
        const firstError = document.querySelector('[aria-invalid="true"]');
        if (firstError) firstError.focus();
        return; // NO simular si hay errores
      }

      const A = getTeamById(teamA.value);
      const B = getTeamById(teamB.value);

      const cfg = {
        nomA: A.name,
        nomB: B.name,
        ratingA: Number(ratingA.value),
        ratingB: Number(ratingB.value),
        weather: document.getElementById('weather').value,
        pace:    document.getElementById('pace').value,
        duration: Number(duration.value)
      };

      const { goalsA, goalsB, events } = simulateMatch(cfg);
      scoreline.textContent = `${A.name} ${goalsA} - ${goalsB} ${B.name}`;
      eventsDiv.innerHTML = events.length
        ? events.map(ev => `<div><strong>${ev.min}'</strong> ${ev.text}</div>`).join('')
        : '<em>Sin eventos destacados.</em>';
      resultSection.classList.remove('hidden');

      // Guardar en historial
      saveBtn.onclick = () => {
        const item = {
          date: new Date().toISOString(),
          teamA: A.name,
          teamB: B.name,
          goalsA, goalsB,
          weather: cfg.weather,
          pace: cfg.pace
        };
        const key = 'simfut_partidos';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push(item);
        localStorage.setItem(key, JSON.stringify(arr));
        saveBtn.textContent = 'Guardado ✓';
        setTimeout(() => (saveBtn.textContent = 'Guardar resultado'), 1500);
      };
    });
  }

  // --------- Página: resultados (tabla) ----------
  const table = document.getElementById('matchesTable');
  if (table) {
    const tbody = table.querySelector('tbody');
    const key = 'simfut_partidos';
    const arr = JSON.parse(localStorage.getItem(key) || '[]').reverse();
    tbody.innerHTML = arr.length
      ? arr.map(m => {
          const d = new Date(m.date).toLocaleString();
          return `<tr>
            <td>${d}</td>
            <td>${m.teamA}</td>
            <td>${m.teamB}</td>
            <td>${m.goalsA} - ${m.goalsB}</td>
            <td>${m.weather}</td>
            <td>${m.pace}</td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="6"><em>No hay resultados guardados.</em></td></tr>';
  }
});
