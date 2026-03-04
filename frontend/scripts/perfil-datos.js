// =============================================
// PERFIL-DATOS.JS — FitAiid (versión definitiva)
// =============================================

(function () {
  'use strict';

  const API_URL = CONFIG.API_URL;
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    cargarDesdeLocalStorage();
    cargarDesdeBackend(userId);
    cargarEstadisticas(userId);   // ← NUEVO
    parchearBotonesEditar(userId);
  }

  // =============================================
  // 1. LOCALSTORAGE — carga inmediata
  // =============================================
  function cargarDesdeLocalStorage() {
    try {
      const userStr = localStorage.getItem('user');
      const fitStr = localStorage.getItem('fitnessProfile');
      if (userStr) {
        const u = JSON.parse(userStr);
        set('userName', (u.firstName || u.name || 'USUARIO').toUpperCase());
        set('userEmail', u.email || '');
      }
      if (fitStr) aplicarFitnessProfile(JSON.parse(fitStr));
    } catch (e) { console.warn('Error leyendo localStorage:', e); }
  }

  // =============================================
  // 2. BACKEND — perfil del usuario
  // =============================================
  async function cargarDesdeBackend(userId) {
    try {
      const res = await fetch(`${API_URL}/api/questionnaire/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!json.success) return;

      const user = json.data?.user || null;
      const q = json.data?.fitnessProfile || null;

      window._perfilActual = { user, questionnaire: q };

      if (q) localStorage.setItem('fitnessProfile', JSON.stringify(q));
      if (user) {
        try {
          const uLS = JSON.parse(localStorage.getItem('user') || '{}');
          uLS.firstName = user.firstName;
          uLS.lastName = user.lastName;
          uLS.email = user.email;
          localStorage.setItem('user', JSON.stringify(uLS));
        } catch (_) { }
        set('userName', `${user.firstName || ''} ${user.lastName || ''}`.trim().toUpperCase());
        set('userEmail', user.email || '');
      }
      if (q) aplicarFitnessProfile(q);

      console.log('✅ Perfil cargado desde MongoDB');
    } catch (err) {
      console.error('Error cargando perfil:', err);
    }
  }

  // =============================================
  // 3. ESTADÍSTICAS REALES — entrenamientos, calorías, tiempo, racha
  // =============================================
  async function cargarEstadisticas(userId) {
    try {
      const res = await fetch(`${API_URL}/api/estadisticas/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!data.success) return;

      const stats = data.data;
      const workouts = stats.workoutHistory || [];

      // Entrenamientos totales
      set('totalWorkouts', stats.totalWorkouts ?? workouts.length ?? 0);

      // Calorías quemadas (suma del historial)
      const totalCal = workouts.reduce((acc, w) => acc + (w.caloriasEstimadas || 0), 0);
      set('totalCalories', totalCal > 0 ? totalCal.toLocaleString('es-CO') : '0');

      // Tiempo activo (minutos → horas y minutos)
      const totalMin = workouts.reduce((acc, w) => acc + (w.duracionTotal || w.duracion || 0), 0);
      const horas = Math.floor(totalMin / 60);
      const minutos = totalMin % 60;
      set('totalHours', horas > 0
        ? `${horas}h${minutos > 0 ? ` ${minutos}m` : ''}`
        : `${totalMin}m`
      );

      // Racha en el badge
      const racha = stats.currentStreak || 0;
      set('streakBadge', `${racha} ${racha === 1 ? 'día' : 'días'}`);

      console.log(`✅ Stats: ${workouts.length} entrenos, ${totalCal} cal, ${totalMin} min, racha ${racha} días`);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }

  // =============================================
  // APLICAR FITNESS PROFILE AL HTML
  // =============================================
  function aplicarFitnessProfile(q) {
    const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '--';

    set('userAge', q.age ? `${q.age} años` : '--');
    set('userHeight', q.height ? `${q.height} cm` : '--');
    set('userWeight', q.weight ? `${q.weight} kg` : '--');
    set('userObjective', cap(q.mainGoal));
    set('userFitnessLevel', cap(q.fitnessLevel));
    set('userGoal', cap(q.mainGoal));
    set('userLevel', cap(q.fitnessLevel));

    if (q.trainingDaysPerWeek) {
      const dur = q.sessionDuration ? ` · ${q.sessionDuration}` : '';
      set('userAvailability', `${q.trainingDaysPerWeek} días/sem${dur}`);
    }
  }

  // =============================================
  // INTERCEPTAR BOTONES DE EDITAR
  // =============================================
  function parchearBotonesEditar(userId) {
    const btnPrincipal = document.querySelector('.btn-primary[onclick*="preguntas.html"]');
    if (btnPrincipal) {
      btnPrincipal.removeAttribute('onclick');
      btnPrincipal.addEventListener('click', () => abrirModal(userId));
    }
    const linkEditar = document.querySelector('.card-action[onclick*="preguntas.html"]');
    if (linkEditar) {
      linkEditar.removeAttribute('onclick');
      linkEditar.style.cursor = 'pointer';
      linkEditar.addEventListener('click', () => abrirModal(userId));
    }
  }

  // =============================================
  // MODAL DE EDICIÓN
  // =============================================
  function abrirModal(userId) {
    document.getElementById('modalEditarPerfil')?.remove();

    const { user, questionnaire: q } = window._perfilActual || {};
    const fname = user?.firstName || '';
    const lname = user?.lastName || '';

    const overlay = document.createElement('div');
    overlay.id = 'modalEditarPerfil';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:99999;
      background:rgba(0,0,0,.88);
      display:flex;align-items:center;justify-content:center;
      padding:16px;overflow-y:auto;
    `;

    overlay.innerHTML = `
      <div style="background:#111;border:1px solid rgba(255,61,0,.35);
        border-radius:20px;padding:32px 26px;width:100%;max-width:460px;
        max-height:90vh;overflow-y:auto;color:#fff;position:relative;">

        <button id="_cerrarEditar" style="position:absolute;top:14px;right:16px;
          background:none;border:none;color:#555;font-size:22px;cursor:pointer;">✕</button>

        <h2 style="font-family:'Oswald',sans-serif;font-size:22px;
          text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Editar Perfil</h2>
        <p style="margin:0 0 22px;font-size:13px;color:#555;">
          Los cambios se guardan en tu cuenta</p>

        <div id="_msgEditar" style="display:none;padding:10px 14px;
          border-radius:8px;margin-bottom:16px;font-size:14px;"></div>

        <p style="font-size:11px;color:#444;text-transform:uppercase;letter-spacing:1.5px;
          margin:0 0 14px;border-bottom:1px solid #1e1e1e;padding-bottom:8px;">
          Datos personales</p>

        ${f('_fname', 'Nombre', 'text', fname)}
        ${f('_lname', 'Apellido', 'text', lname)}
        ${f('_edad', 'Edad', 'number', q?.age ?? '', '14', '100')}
        ${f('_altura', 'Altura (cm)', 'number', q?.height ?? '', '100', '250')}
        ${f('_peso', 'Peso (kg)', 'number', q?.weight ?? '', '30', '300')}

        <p style="font-size:11px;color:#444;text-transform:uppercase;letter-spacing:1.5px;
          margin:22px 0 14px;border-bottom:1px solid #1e1e1e;padding-bottom:8px;">
          Entrenamiento</p>

        ${s('_objetivo', 'Objetivo', [
      ['tonificar', 'Tonificar'],
      ['ganar masa muscular', 'Ganar masa muscular'],
      ['bajar de peso', 'Bajar de peso']
    ], q?.mainGoal)}
        ${s('_nivel', 'Nivel', [
      ['principiante', 'Principiante'],
      ['intermedio', 'Intermedio'],
      ['avanzado', 'Avanzado']
    ], q?.fitnessLevel)}
        ${s('_lugar', 'Lugar de entrenamiento', [
      ['casa', 'Casa'], ['gym', 'Gym']
    ], q?.trainingLocation)}
        ${s('_dias', 'Días por semana', [
      [1, '1 día'], [2, '2 días'], [3, '3 días'], [4, '4 días'], [5, '5 días']
    ], q?.trainingDaysPerWeek)}
        ${s('_duracion', 'Duración por sesión', [
      ['30 min', '30 min'], ['45 min', '45 min'], ['1 hr', '1 hr'], ['+1 hr', '+1 hr']
    ], q?.sessionDuration)}
        ${f('_condicion', 'Lesión / condición médica', 'text', q?.medicalConditions ?? '')}

        <div style="display:flex;gap:10px;margin-top:28px;">
          <button id="_cancelarEditar" style="flex:1;padding:13px;border-radius:10px;
            border:1px solid #2a2a2a;background:transparent;color:#777;
            font-size:14px;cursor:pointer;font-family:'Oswald',sans-serif;">
            CANCELAR</button>
          <button id="_guardarEditar" style="flex:2;padding:13px;border-radius:10px;
            border:none;background:linear-gradient(135deg,#ff3d00,#ff6b3d);
            color:#fff;font-size:14px;font-weight:700;cursor:pointer;
            font-family:'Oswald',sans-serif;">
            GUARDAR CAMBIOS</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('#_cerrarEditar').onclick = () => overlay.remove();
    overlay.querySelector('#_cancelarEditar').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#_guardarEditar').onclick = () => guardar(userId, overlay);
  }

  // =============================================
  // GUARDAR CAMBIOS
  // =============================================
  async function guardar(userId, overlay) {
    const btn = overlay.querySelector('#_guardarEditar');
    const msgEl = overlay.querySelector('#_msgEditar');
    const v = id => overlay.querySelector(`#${id}`)?.value ?? '';

    const firstName = v('_fname').trim();
    const lastName = v('_lname').trim();
    const edad = parseInt(v('_edad'));
    const altura = parseInt(v('_altura'));
    const peso = parseInt(v('_peso'));
    const objetivo = v('_objetivo');
    const nivel = v('_nivel');
    const lugar = v('_lugar');
    const dias = parseInt(v('_dias'));
    const duracion = v('_duracion');
    const condicion = v('_condicion').trim();

    if (!firstName) return notif(msgEl, 'El nombre no puede estar vacío.', 'error');
    if (isNaN(edad) || edad < 14 || edad > 100) return notif(msgEl, 'Edad inválida (14–100).', 'error');
    if (isNaN(altura) || altura < 100 || altura > 250) return notif(msgEl, 'Altura inválida (100–250 cm).', 'error');
    if (isNaN(peso) || peso < 30 || peso > 300) return notif(msgEl, 'Peso inválido (30–300 kg).', 'error');

    btn.textContent = 'Guardando...';
    btn.disabled = true;

    try {
      const r1 = await fetch(`${API_URL}/api/questionnaire/user/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ firstName, lastName })
      });
      const d1 = await r1.json();
      if (!d1.success) throw new Error(d1.message || 'Error actualizando nombre');

      const r2 = await fetch(`${API_URL}/api/questionnaire/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          age: edad, height: altura, weight: peso,
          mainGoal: objetivo, fitnessLevel: nivel,
          trainingLocation: lugar, trainingDaysPerWeek: dias,
          sessionDuration: duracion, medicalConditions: condicion
        })
      });
      const d2 = await r2.json();
      if (!d2.success) throw new Error(d2.message || 'Error actualizando perfil fitness');

      const nuevoUser = { ...window._perfilActual?.user, firstName, lastName, name: `${firstName} ${lastName}` };
      const nuevoQ = {
        ...window._perfilActual?.questionnaire,
        age: edad, height: altura, weight: peso,
        mainGoal: objetivo, fitnessLevel: nivel,
        trainingLocation: lugar, trainingDaysPerWeek: dias,
        sessionDuration: duracion, medicalConditions: condicion
      };
      window._perfilActual = { user: nuevoUser, questionnaire: nuevoQ };
      localStorage.setItem('fitnessProfile', JSON.stringify(nuevoQ));
      try {
        const uLS = JSON.parse(localStorage.getItem('user') || '{}');
        uLS.firstName = firstName; uLS.lastName = lastName;
        localStorage.setItem('user', JSON.stringify(uLS));
      } catch (_) { }

      set('userName', `${firstName} ${lastName}`.toUpperCase());
      aplicarFitnessProfile(nuevoQ);

      notif(msgEl, '✅ Perfil actualizado correctamente', 'success');
      setTimeout(() => overlay.remove(), 1400);

    } catch (err) {
      console.error('Error guardando cambios:', err);
      notif(msgEl, '❌ ' + (err.message || 'Error al guardar'), 'error');
    } finally {
      btn.textContent = 'GUARDAR CAMBIOS';
      btn.disabled = false;
    }
  }

  // =============================================
  // HELPERS
  // =============================================
  function set(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.textContent = val;
  }

  function f(id, label, type, value = '', min = '', max = '') {
    return `<div style="margin-bottom:12px;">
      <label for="${id}" style="display:block;font-size:12px;color:#555;
        margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">${label}</label>
      <input id="${id}" type="${type}" value="${esc(String(value))}"
        ${min ? `min="${min}"` : ''} ${max ? ` max="${max}"` : ''}
        style="width:100%;box-sizing:border-box;padding:10px 13px;
          background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;
          color:#fff;font-size:15px;outline:none;"
        onfocus="this.style.borderColor='#ff3d00'"
        onblur="this.style.borderColor='#2a2a2a'"
      /></div>`;
  }

  function s(id, label, pares, actual) {
    const opts = pares.map(([v, l]) =>
      `<option value="${v}"${String(v) === String(actual) ? ' selected' : ''}>${l}</option>`
    ).join('');
    return `<div style="margin-bottom:12px;">
      <label for="${id}" style="display:block;font-size:12px;color:#555;
        margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">${label}</label>
      <select id="${id}" style="width:100%;box-sizing:border-box;padding:10px 13px;
        background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;
        color:#fff;font-size:15px;outline:none;appearance:none;">${opts}</select>
    </div>`;
  }

  function notif(el, texto, tipo) {
    el.style.display = 'block';
    el.textContent = texto;
    el.style.background = tipo === 'success' ? '#0d2e1a' : '#2e0d0d';
    el.style.color = tipo === 'success' ? '#22c55e' : '#ff5252';
    el.style.border = `1px solid ${tipo === 'success' ? '#22c55e' : '#ff5252'}`;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

})();