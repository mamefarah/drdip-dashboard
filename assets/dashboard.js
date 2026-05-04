const appState = {
  raw: [],
  records: [],
  filtered: [],
  targets: null,
  charts: {},
  map: null,
  markers: null
};

const FIELD_ALIASES = {
  region: ['group_0/region', 'region', 'Region', 'region_name'],
  woreda: ['group_0/woreda', 'woreda', 'Woreda', 'district', 'city'],
  kebele: ['group_0/kebele', 'kebele', 'Kebele'],
  subcomponent: ['group_0/Q1a', 'Project sub-component', 'project_sub_component', 'subcomponent', 'Sub-component'],
  type: ['group_0/Q1b', 'Sub project or Investment Type', 'sub_project_or_investment_type', 'investment_type'],
  name: ['group_1/sbp_name', 'Local name of the sub-project', 'local_name_of_the_sub_project', 'subproject_name'],
  description: ['group_1/sbp_descr', 'Sub-project description', 'sub_project_description', 'description'],
  status: ['group_3/impl_status', 'Status of the sub-project/investment implementation', 'implementation_status', 'status'],
  beneficiaries: ['group_4/group_hostcomm/host_total', 'beneficiaries', 'Total beneficiaries', 'total_beneficiaries'],
  host: ['group_4/group_hostcomm/host_total', 'host', 'host_beneficiaries', 'Host beneficiaries'],
  refugee: ['group_13/tc_002', 'refugee', 'refugee_beneficiaries', 'Refugee beneficiaries'],
  male: ['group_4/group_hostcomm/host_male', 'group_12/gain_male_hc', 'group_13/gain_male_ref', 'male'],
  female: ['group_4/group_hostcomm/host_female', 'group_12/gain_female_hc', 'group_13/gain_female_ref', 'female'],
  gps: ['gps_point', 'gps', '_geolocation'],
  latitude: ['latitude', '_geolocation_latitude'],
  longitude: ['longitude', '_geolocation_longitude'],
  submitted: ['_submission_time', 'submission_time', 'submitted'],
  validation: ['_validation_status', 'validation_status']
};

const TARGET_ROWS = [
  ['beneficiaries_total', 'PDO / Component 1.1', 'Beneficiaries with access to social and economic services and infrastructure', 'Number', 'beneficiaries'],
  ['beneficiaries_host', 'PDO / Component 1.1', 'Host community beneficiaries with access to services', 'Number', 'host'],
  ['beneficiaries_refugee', 'PDO / Component 1.1', 'Refugee community beneficiaries with access to services', 'Number', 'refugee'],
  ['slm_physical_ha', '2.1 Community-based NRM', 'Land area under SLM practices, physical', 'Hectare', 'slm'],
  ['slm_biological_ha', '2.1 Community-based NRM', 'Land area under SLM practices, biological', 'Hectare', 'slm'],
  ['cif_completed', '1.1 Infrastructure and basic services', 'CIF subprojects completed and operational', 'Number', 'cif'],
  ['sif_completed', '1.1 Infrastructure and basic services', 'SIF subprojects completed and operational', 'Number', 'sif'],
  ['energy_demo_households', '2.2 Alternative energy', 'Households with improved alternative energy demonstration', 'Number', 'energy'],
  ['energy_self_adopt_households', '2.2 Alternative energy', 'Households adopting alternative energy with own resources', 'Number', 'energy'],
  ['cbo_operational', '3.2 Livelihoods / CBO support', 'CBOs operational one year after support', 'Number', 'cbo'],
  ['traditional_livelihood_beneficiaries', '3.1 Traditional livelihoods', 'Traditional livelihood beneficiaries', 'Number', 'livelihoodBen'],
  ['nontraditional_livelihood_beneficiaries', '3.2 Non-traditional livelihoods', 'Non-traditional livelihood beneficiaries', 'Number', 'livelihoodBen'],
  ['irrigation_beneficiaries', '3.3 Small-scale and micro-irrigation', 'Irrigation beneficiaries', 'Number', 'irrigationBen'],
  ['farmers_adopting_technologies', '3.1 Traditional livelihoods', 'Farmers adopting improved technologies', 'Number', 'livelihoodBen'],
  ['irrigation_area_ha', '3.3 Small-scale and micro-irrigation', 'New or improved irrigation area', 'Hectare', 'irrigation'],
  ['female_members_percent', '1.3 Inclusion', 'Female members in community institutions', 'Percentage', 'femaleShare'],
  ['women_leadership_percent', '1.3 Inclusion', 'Women in leadership roles', 'Percentage', 'none']
];

function el(id) { return document.getElementById(id); }
function clean(value) { return value == null ? '' : String(value).trim(); }
function lower(value) { return clean(value).toLowerCase(); }
function num(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(clean(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
function fmt(value) { return Number(value || 0).toLocaleString(); }
function html(value) {
  return clean(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}
function title(value) {
  return clean(value).replace(/_/g, ' ').replace(/\s+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}
function getValue(record, field) {
  for (const key of FIELD_ALIASES[field] || []) {
    if (Object.prototype.hasOwnProperty.call(record, key) && clean(record[key])) return record[key];
  }
  return '';
}
function groupBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = typeof field === 'function' ? field(row) : row[field] || 'Unspecified';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}
function sum(rows, field) { return rows.reduce((total, row) => total + num(row[field]), 0); }
function statusLabel(value) {
  const text = lower(value);
  if (!text) return '';
  if (text.includes('complete')) return 'Completed';
  if (text.includes('ongoing') || text.includes('progress')) return 'Ongoing';
  if (text.includes('delay') || text.includes('problem')) return 'Delayed or Problem';
  return title(value);
}
function textOf(row) {
  return lower([row.subcomponent, row.type, row.name, row.description, row.status, row.woreda, row.kebele].join(' '));
}
function hasText(row, word) { return textOf(row).includes(word); }
function isCompleted(row) { return row.status === 'Completed'; }
function getGps(record) {
  const gps = getValue(record, 'gps');
  if (Array.isArray(gps) && gps.length >= 2) return { lat: num(gps[0]), lon: num(gps[1]) };
  if (typeof gps === 'string') {
    const parts = gps.split(/[ ,]+/).map(num).filter(Boolean);
    if (parts.length >= 2) return { lat: parts[0], lon: parts[1] };
  }
  return { lat: num(getValue(record, 'latitude')), lon: num(getValue(record, 'longitude')) };
}
function isSomali(record) {
  const region = lower(getValue(record, 'region'));
  const woreda = lower(getValue(record, 'woreda'));
  if (region.includes('somali') || region.includes('somale')) return true;
  return ['awbare', 'kebribeyah', 'kebribayah', 'dollo', 'dolo', 'bokolmayo', 'bokulmayo', 'dollo bay', 'jigjiga', 'jijiga', 'danot', 'bokh'].some(name => woreda.includes(name));
}
function normalize(record, index) {
  const gps = getGps(record);
  const male = num(getValue(record, 'male'));
  const female = num(getValue(record, 'female'));
  const host = num(getValue(record, 'host'));
  const refugee = num(getValue(record, 'refugee'));
  const beneficiaries = num(getValue(record, 'beneficiaries')) || male + female || host + refugee;
  return {
    index,
    woreda: title(getValue(record, 'woreda')) || 'Unspecified',
    kebele: title(getValue(record, 'kebele')),
    subcomponent: title(getValue(record, 'subcomponent')),
    type: title(getValue(record, 'type')),
    name: title(getValue(record, 'name')),
    description: clean(getValue(record, 'description')),
    status: statusLabel(getValue(record, 'status')),
    beneficiaries,
    host,
    refugee,
    male,
    female,
    lat: gps.lat,
    lon: gps.lon,
    hasGps: Boolean(gps.lat && gps.lon),
    hasPhotos: Array.isArray(record._attachments) && record._attachments.some(att => clean(att.mimetype).startsWith('image/')),
    submitted: clean(getValue(record, 'submitted')),
    validation: clean(getValue(record, 'validation')),
    raw: record
  };
}
function alertBox(message, error = false) {
  const box = el('alert');
  if (!box) return;
  box.textContent = message;
  box.className = error ? 'alert error' : 'alert';
  box.classList.remove('hidden');
}
function hideAlert() {
  const box = el('alert');
  if (box) box.classList.add('hidden');
}
function badge(value) {
  const cls = value === 'Completed' ? 'completed' : value === 'Ongoing' ? 'ongoing' : lower(value).includes('delay') ? 'problem' : '';
  return `<span class="badge ${cls}">${html(value || 'Unknown')}</span>`;
}
function progress(percent) {
  const safe = Math.max(0, Math.min(percent, 100));
  return `<strong>${percent}%</strong><div class="progress"><span style="width:${safe}%"></span></div>`;
}
function kpis(items) {
  return items.map(item => `<div class="card kpi-card"><div class="kpi-label">${html(item[0])}</div><div class="kpi-value">${html(item[1])}</div><div class="kpi-sub">${html(item[2])}</div></div>`).join('');
}
function setHtml(id, value) {
  const node = el(id);
  if (node) node.innerHTML = value;
}
function setText(id, value) {
  const node = el(id);
  if (node) node.textContent = value;
}
function fillSelect(id, values, label) {
  const node = el(id);
  if (!node) return;
  const old = node.value;
  const unique = [...new Set(values.filter(Boolean))].sort();
  node.innerHTML = `<option value="">${label}</option>` + unique.map(value => `<option>${html(value)}</option>`).join('');
  if (unique.includes(old)) node.value = old;
}
function actuals() {
  const rows = appState.filtered;
  const male = sum(rows, 'male');
  const female = sum(rows, 'female');
  return {
    beneficiaries: sum(rows, 'beneficiaries'),
    host: sum(rows, 'host'),
    refugee: sum(rows, 'refugee'),
    slm: rows.filter(row => hasText(row, '2.1') || hasText(row, 'natural') || hasText(row, 'landscape') || hasText(row, 'watershed')).length,
    cif: rows.filter(row => (hasText(row, 'cif') || hasText(row, 'community investment')) && isCompleted(row)).length,
    sif: rows.filter(row => (hasText(row, 'sif') || hasText(row, 'strategic investment')) && isCompleted(row)).length,
    energy: rows.filter(row => hasText(row, '2.2') || hasText(row, 'energy') || hasText(row, 'solar')).length,
    cbo: rows.filter(row => hasText(row, 'cbo') || hasText(row, 'cooperative') || hasText(row, 'russaco')).length,
    livelihoodBen: sum(rows.filter(row => hasText(row, '3.1') || hasText(row, '3.2') || hasText(row, 'livelihood')), 'beneficiaries'),
    irrigationBen: sum(rows.filter(row => hasText(row, '3.3') || hasText(row, 'irrigation')), 'beneficiaries'),
    irrigation: rows.filter(row => hasText(row, '3.3') || hasText(row, 'irrigation')).length,
    femaleShare: male + female ? Math.round(female / (male + female) * 100) : 0,
    none: 0
  };
}
function targetRows() {
  const targets = appState.targets?.targets || {};
  const actual = actuals();
  return TARGET_ROWS.map(([code, subcomponent, indicator, unit, actualKey]) => {
    const target = num(targets[code]);
    const collected = num(actual[actualKey]);
    const achievement = target ? Math.round(collected / target * 100) : 0;
    return { subcomponent, indicator, unit, target, collected, achievement, gap: Math.max(target - collected, 0), source: actualKey === 'none' ? 'No matching Kobo field mapped' : 'Kobo collected data or proxy count' };
  });
}
function allocationRows() {
  const units = appState.targets?.woreda_city_intervention_areas || [];
  const targets = appState.targets?.targets || {};
  const totalAreas = units.reduce((total, unit) => total + num(unit.total), 0);
  const byWoreda = groupBy(appState.filtered, 'woreda');
  return units.map(unit => {
    const share = totalAreas ? num(unit.total) / totalAreas : 0;
    const rows = byWoreda[unit.woreda_city] || byWoreda[unit.woreda_city.replace(' Woreda', '')] || [];
    const target = Math.round(num(targets.beneficiaries_total) * share);
    const collected = sum(rows, 'beneficiaries');
    return {
      unit,
      share,
      target,
      collected,
      achievement: target ? Math.round(collected / target * 100) : 0,
      cif: Math.round(num(targets.cif_completed) * share),
      sif: Math.round(num(targets.sif_completed) * share),
      slm: Math.round((num(targets.slm_physical_ha) + num(targets.slm_biological_ha)) * share),
      energy: Math.round(num(targets.energy_demo_households) * share),
      livelihood: Math.round((num(targets.traditional_livelihood_beneficiaries) + num(targets.nontraditional_livelihood_beneficiaries)) * share),
      irrigation: Math.round(num(targets.irrigation_area_ha) * share)
    };
  });
}
function drawChart(id, type, labels, data, label = 'Records', max = null) {
  try {
    const canvas = el(id);
    if (!canvas || !window.Chart) return;
    if (appState.charts[id]) appState.charts[id].destroy();
    const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type === 'doughnut' } }, scales: type === 'bar' ? { y: { beginAtZero: true } } : {} };
    if (max && options.scales.y) options.scales.y.max = max;
    appState.charts[id] = new Chart(canvas, { type, data: { labels, datasets: [{ label, data }] }, options });
  } catch (error) {
    console.warn('Chart skipped:', id, error);
  }
}
function renderTargets() {
  const rows = targetRows();
  const targets = appState.targets?.targets || {};
  const beneficiaryTarget = num(targets.beneficiaries_total);
  const collected = sum(appState.filtered, 'beneficiaries');
  const gap = Math.max(beneficiaryTarget - collected, 0);
  setText('target-source', appState.targets?.source || 'Target baseline');
  setText('target-note', appState.targets?.note || '');
  setHtml('target-kpis', kpis([
    ['Beneficiary target', fmt(beneficiaryTarget), 'Official Somali Region target'],
    ['Collected beneficiaries', fmt(collected), 'Filtered Kobo records'],
    ['Achievement', beneficiaryTarget ? Math.round(collected / beneficiaryTarget * 100) + '%' : '0%', fmt(gap) + ' remaining'],
    ['Collected records', fmt(appState.filtered.length), 'Kobo submissions'],
    ['Target year', 'Year 5', 'PDO and intermediate targets']
  ]));
  setHtml('target-table-body', rows.map(row => `<tr><td>${html(row.subcomponent)}</td><td>${html(row.indicator)}</td><td>${html(row.unit)}</td><td>${fmt(row.target)}</td><td>${fmt(row.collected)}</td><td>${progress(row.achievement)}</td><td>${fmt(row.gap)}</td><td>${html(row.source)}</td></tr>`).join(''));
  const allocation = allocationRows();
  setHtml('woreda-target-body', allocation.map(row => `<tr><td>${html(row.unit.woreda_city)}</td><td>${html(row.unit.zone)}</td><td>${Math.round(row.share * 100)}%</td><td>${fmt(row.target)}</td><td>${fmt(row.collected)}</td><td>${progress(row.achievement)}</td><td>${fmt(row.cif)}</td><td>${fmt(row.sif)}</td><td>${fmt(row.slm)}</td><td>${fmt(row.energy)}</td><td>${fmt(row.livelihood)}</td><td>${fmt(row.irrigation)}</td><td>${html(row.unit.note || 'Planning allocation')}</td></tr>`).join(''));
  drawChart('chart-target-achievement', 'bar', rows.slice(0, 12).map(row => row.indicator.slice(0, 30)), rows.slice(0, 12).map(row => row.achievement), 'Achievement %', 100);
  drawChart('chart-woreda-targets', 'bar', allocation.map(row => row.unit.woreda_city), allocation.map(row => row.achievement), 'Beneficiary achievement %', 100);
}
function renderMain() {
  const rows = appState.filtered;
  const completed = rows.filter(isCompleted).length;
  setText('hdr-live', fmt(appState.records.length));
  setText('hdr-filtered', fmt(rows.length));
  setHtml('kpi-grid', kpis([
    ['Records', fmt(rows.length), 'Filtered records'],
    ['Woreda/City', fmt(new Set(rows.map(row => row.woreda)).size), 'Reported units'],
    ['Kebeles', fmt(new Set(rows.map(row => row.kebele).filter(Boolean)).size), 'Reported kebeles'],
    ['Beneficiaries', fmt(sum(rows, 'beneficiaries')), 'Collected'],
    ['Completed', rows.length ? Math.round(completed / rows.length * 100) + '%' : '0%', fmt(completed) + ' completed']
  ]));
  setHtml('latest-body', [...rows].sort((a, b) => clean(b.submitted).localeCompare(clean(a.submitted))).slice(0, 12).map(row => `<tr><td>${html((row.submitted || '').slice(0, 10))}</td><td>${html(row.woreda)}</td><td>${html(row.kebele)}</td><td>${html(row.name || row.type)}</td><td>${badge(row.status)}</td><td>${fmt(row.beneficiaries)}</td></tr>`).join('') || '<tr><td colspan="6">No records</td></tr>');
  const byStatus = Object.entries(groupBy(rows, 'status')).map(([name, items]) => ({ name, count: items.length })).sort((a, b) => b.count - a.count);
  drawChart('chart-status', 'doughnut', byStatus.map(row => row.name), byStatus.map(row => row.count));
  const bySub = Object.entries(groupBy(rows, 'subcomponent')).map(([name, items]) => ({ name, count: items.length })).sort((a, b) => b.count - a.count).slice(0, 15);
  drawChart('chart-subcomponent', 'bar', bySub.map(row => row.name), bySub.map(row => row.count));
  const byWoreda = Object.entries(groupBy(rows, 'woreda')).map(([name, items]) => ({ name, rows: items, count: items.length, beneficiaries: sum(items, 'beneficiaries') })).sort((a, b) => b.count - a.count);
  drawChart('chart-woreda-records', 'bar', byWoreda.slice(0, 20).map(row => row.name), byWoreda.slice(0, 20).map(row => row.count));
  drawChart('chart-woreda-beneficiaries', 'bar', byWoreda.slice().sort((a, b) => b.beneficiaries - a.beneficiaries).slice(0, 20).map(row => row.name), byWoreda.slice().sort((a, b) => b.beneficiaries - a.beneficiaries).slice(0, 20).map(row => row.beneficiaries), 'Beneficiaries');
  setHtml('woreda-rank-body', byWoreda.map(row => `<tr><td>${html(row.name)}</td><td>${fmt(row.count)}</td><td>${fmt(new Set(row.rows.map(item => item.kebele).filter(Boolean)).size)}</td><td>${fmt(row.beneficiaries)}</td><td>${row.count ? Math.round(row.rows.filter(isCompleted).length / row.count * 100) : 0}%</td><td>${row.count ? Math.round(row.rows.filter(item => item.hasGps).length / row.count * 100) : 0}%</td><td>${row.count ? Math.round(row.rows.filter(item => item.hasPhotos).length / row.count * 100) : 0}%</td></tr>`).join(''));
  setHtml('table-body', rows.map(row => `<tr><td>${html(row.woreda)}</td><td>${html(row.kebele)}</td><td>${html(row.name || row.description)}</td><td>${html(row.subcomponent)}</td><td>${html(row.type)}</td><td>${badge(row.status)}</td><td>${fmt(row.beneficiaries)}</td><td>${html((row.submitted || '').slice(0, 10))}</td></tr>`).join('') || '<tr><td colspan="8">No records</td></tr>');
  setHtml('quality-kpis', [
    ['Missing kebele', rows.filter(row => !row.kebele).length],
    ['Missing status', rows.filter(row => !row.status).length],
    ['Missing beneficiaries', rows.filter(row => !row.beneficiaries).length],
    ['Missing GPS', rows.filter(row => !row.hasGps).length],
    ['Missing photos', rows.filter(row => !row.hasPhotos).length]
  ].map(item => `<div class="quality-item"><span>${html(item[0])}</span><strong>${fmt(item[1])}</strong></div>`).join(''));
  setHtml('quality-body', byWoreda.map(row => `<tr><td>${html(row.name)}</td><td>${fmt(row.count)}</td><td>${row.rows.filter(item => !item.kebele).length}</td><td>${row.rows.filter(item => !item.status).length}</td><td>${row.rows.filter(item => !item.beneficiaries).length}</td><td>${row.rows.filter(item => !item.hasGps).length}</td><td>${row.rows.filter(item => !item.hasPhotos).length}</td></tr>`).join(''));
  setText('normalized-json', JSON.stringify(rows.slice(0, 200), null, 2));
}
function renderMap() {
  try {
    if (!window.L || !el('map')) return;
    const mapped = appState.filtered.filter(row => row.hasGps);
    setText('map-count', fmt(mapped.length) + ' mapped records');
    setText('map-missing', fmt(appState.filtered.length - mapped.length) + ' missing GPS');
    if (!appState.map) {
      appState.map = L.map('map').setView([6.7, 44.2], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(appState.map);
      appState.markers = L.layerGroup().addTo(appState.map);
    }
    appState.markers.clearLayers();
    mapped.forEach(row => L.marker([row.lat, row.lon]).bindPopup(`<b>${html(row.woreda)}</b><br>${html(row.kebele)}<br>${html(row.name || row.type)}`).addTo(appState.markers));
  } catch (error) {
    console.warn('Map skipped:', error);
  }
}
function renderAll() {
  renderTargets();
  renderMain();
  renderMap();
}
function applyFilters() {
  const get = id => clean(el(id)?.value);
  const query = lower(get('filter-search'));
  appState.filtered = appState.records.filter(row => {
    if (get('filter-woreda') && row.woreda !== get('filter-woreda')) return false;
    if (get('filter-kebele') && row.kebele !== get('filter-kebele')) return false;
    if (get('filter-subcomponent') && row.subcomponent !== get('filter-subcomponent')) return false;
    if (get('filter-type') && row.type !== get('filter-type')) return false;
    if (get('filter-status') && row.status !== get('filter-status')) return false;
    if (get('filter-date-from') && row.submitted && row.submitted.slice(0, 10) < get('filter-date-from')) return false;
    if (get('filter-date-to') && row.submitted && row.submitted.slice(0, 10) > get('filter-date-to')) return false;
    if (query && !textOf(row).includes(query)) return false;
    return true;
  });
  renderAll();
}
function resetFilters() {
  document.querySelectorAll('.filters-grid select:not(.locked-select), .filters-grid input').forEach(input => { input.value = ''; });
  appState.filtered = [...appState.records];
  renderAll();
}
function makeCsv(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  return [keys.join(','), ...rows.map(row => keys.map(key => `"${clean(row[key]).replace(/"/g, '""')}"`).join(','))].join('\n');
}
function download(name, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
function proxyBase() { return clean(localStorage.proxyBase) || location.origin; }
async function loadData() {
  alertBox('Loading Somali Region targets and Kobo records...');
  try {
    const targetResponse = await fetch('data/plan-targets-summary.json?v=stable', { cache: 'no-store' });
    appState.targets = targetResponse.ok ? await targetResponse.json() : { targets: {}, woreda_city_intervention_areas: [] };
    const params = new URLSearchParams();
    if (clean(localStorage.assetUid)) params.set('asset', localStorage.assetUid);
    if (clean(localStorage.koboServer)) params.set('server', localStorage.koboServer);
    const url = `${proxyBase()}/api/kobo-proxy${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    appState.raw = Array.isArray(data.results) ? data.results : [];
    appState.records = appState.raw.filter(isSomali).map(normalize);
    appState.filtered = [...appState.records];
    setText('hdr-live', fmt(appState.records.length));
    setText('hdr-filtered', fmt(appState.filtered.length));
    setText('hdr-synced', new Date(data.fetchedAt || Date.now()).toLocaleString());
    fillSelect('filter-woreda', appState.records.map(row => row.woreda), 'All Woreda/City');
    fillSelect('filter-kebele', appState.records.map(row => row.kebele), 'All Kebeles');
    fillSelect('filter-subcomponent', appState.records.map(row => row.subcomponent), 'All Sub-components');
    fillSelect('filter-type', appState.records.map(row => row.type), 'All Types');
    fillSelect('filter-status', appState.records.map(row => row.status), 'All Statuses');
    hideAlert();
    renderAll();
  } catch (error) {
    console.error(error);
    alertBox('Failed to load dashboard: ' + error.message, true);
  }
}
function setupEvents() {
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const panel = el(`tab-${button.dataset.tab}`);
      if (panel) panel.classList.add('active');
      setTimeout(() => appState.map && appState.map.invalidateSize(), 100);
    });
  });
  ['filter-woreda', 'filter-kebele', 'filter-subcomponent', 'filter-type', 'filter-status', 'filter-date-from', 'filter-date-to', 'filter-search'].forEach(id => {
    const node = el(id);
    if (node) node.addEventListener('input', applyFilters);
  });
  if (el('reset-filters')) el('reset-filters').addEventListener('click', resetFilters);
  if (el('refresh-btn')) el('refresh-btn').addEventListener('click', loadData);
  if (el('export-targets')) el('export-targets').addEventListener('click', () => download('somali-region-target-vs-collected.csv', makeCsv(targetRows())));
  if (el('export-csv')) el('export-csv').addEventListener('click', () => download('somali-region-filtered-records.csv', makeCsv(appState.filtered.map(row => ({ woreda: row.woreda, kebele: row.kebele, subcomponent: row.subcomponent, type: row.type, name: row.name, status: row.status, beneficiaries: row.beneficiaries, submitted: row.submitted })))));
  if (el('export-json')) el('export-json').addEventListener('click', () => download('somali-region-filtered-records.json', JSON.stringify(appState.filtered, null, 2)));
  if (el('settings-btn')) el('settings-btn').addEventListener('click', () => {
    el('setting-asset').value = localStorage.assetUid || '';
    el('setting-server').value = localStorage.koboServer || '';
    el('setting-proxy').value = localStorage.proxyBase || '';
    el('settings-modal').classList.remove('hidden');
  });
  if (el('settings-close')) el('settings-close').addEventListener('click', () => el('settings-modal').classList.add('hidden'));
  if (el('settings-save')) el('settings-save').addEventListener('click', () => {
    localStorage.assetUid = el('setting-asset').value;
    localStorage.koboServer = el('setting-server').value;
    localStorage.proxyBase = el('setting-proxy').value;
    el('settings-modal').classList.add('hidden');
    loadData();
  });
}
window.appState = appState;
window.renderAll = renderAll;
window.resetFilters = resetFilters;
document.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  loadData();
});
