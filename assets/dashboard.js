const SOMALI_REGION = 'Somali Region';

const state = {
  raw: [],
  records: [],
  filtered: [],
  targets: null,
  charts: {},
  map: null,
  markers: null
};

const aliases = {
  region: ['group_0/region', 'region', 'Region'],
  woreda: ['group_0/woreda', 'woreda', 'Woreda', 'district', 'city'],
  kebele: ['group_0/kebele', 'kebele', 'Kebele'],
  subcomponent: ['group_0/Q1a', 'Project sub-component', 'subcomponent', 'Sub-component'],
  type: ['group_0/Q1b', 'Sub project or Investment Type', 'investment_type'],
  name: ['group_1/sbp_name', 'Local name of the sub-project', 'subproject_name'],
  description: ['group_1/sbp_descr', 'Sub-project description', 'description'],
  status: ['group_3/impl_status', 'Status of the sub-project/investment implementation', 'status'],
  beneficiaries: ['group_4/group_hostcomm/host_total', 'beneficiaries', 'Total beneficiaries', 'total_beneficiaries'],
  host: ['group_4/group_hostcomm/host_total', 'host', 'Host beneficiaries'],
  refugee: ['group_13/tc_002', 'refugee', 'Refugee beneficiaries'],
  male: ['group_4/group_hostcomm/host_male', 'group_12/gain_male_hc', 'group_13/gain_male_ref', 'male'],
  female: ['group_4/group_hostcomm/host_female', 'group_12/gain_female_hc', 'group_13/gain_female_ref', 'female'],
  gps: ['gps_point', 'gps', '_geolocation'],
  latitude: ['latitude', '_geolocation_latitude'],
  longitude: ['longitude', '_geolocation_longitude'],
  submitted: ['_submission_time', 'submission_time', 'submitted'],
  validation: ['_validation_status', 'validation_status']
};

const targetMap = [
  ['beneficiaries_total', 'PDO / Component 1.1', 'Beneficiaries with access to social and economic services and infrastructure', 'Number', 'beneficiaries', 'Sum of Kobo beneficiary fields'],
  ['beneficiaries_host', 'PDO / Component 1.1', 'Host community beneficiaries with access to services', 'Number', 'host', 'Sum of host beneficiary field'],
  ['beneficiaries_refugee', 'PDO / Component 1.1', 'Refugee community beneficiaries with access to services', 'Number', 'refugee', 'Sum of refugee beneficiary field'],
  ['slm_physical_ha', '2.1 Community-based NRM', 'Land area under SLM practices, physical', 'Hectare', 'slm', 'Record count proxy until hectare field is mapped'],
  ['slm_biological_ha', '2.1 Community-based NRM', 'Land area under SLM practices, biological', 'Hectare', 'slm', 'Record count proxy until hectare field is mapped'],
  ['cif_completed', '1.1 Infrastructure and basic services', 'CIF subprojects completed and operational', 'Number', 'cif', 'Completed CIF records'],
  ['sif_completed', '1.1 Infrastructure and basic services', 'SIF subprojects completed and operational', 'Number', 'sif', 'Completed SIF records'],
  ['energy_demo_households', '2.2 Alternative energy', 'Households with improved alternative energy demonstration', 'Number', 'energy', 'Energy record proxy'],
  ['energy_self_adopt_households', '2.2 Alternative energy', 'Households adopting alternative energy with own resources', 'Number', 'energy', 'Energy record proxy'],
  ['cbo_operational', '3.2 Livelihoods / CBO support', 'CBOs operational one year after support', 'Number', 'cbo', 'CBO record proxy'],
  ['traditional_livelihood_beneficiaries', '3.1 Traditional livelihoods', 'Traditional livelihood beneficiaries', 'Number', 'livelihoodBen', 'Matched livelihood beneficiaries'],
  ['nontraditional_livelihood_beneficiaries', '3.2 Non-traditional livelihoods', 'Non-traditional livelihood beneficiaries', 'Number', 'livelihoodBen', 'Matched livelihood beneficiaries'],
  ['irrigation_beneficiaries', '3.3 Small-scale and micro-irrigation', 'Irrigation beneficiaries', 'Number', 'irrigationBen', 'Matched irrigation beneficiaries'],
  ['farmers_adopting_technologies', '3.1 Traditional livelihoods', 'Farmers adopting improved technologies', 'Number', 'livelihoodBen', 'Matched livelihood beneficiaries'],
  ['irrigation_area_ha', '3.3 Small-scale and micro-irrigation', 'New or improved irrigation area', 'Hectare', 'irrigation', 'Record count proxy until hectare field is mapped'],
  ['female_members_percent', '1.3 Inclusion', 'Female members in community institutions', 'Percentage', 'femaleShare', 'Calculated from male/female beneficiary fields'],
  ['women_leadership_percent', '1.3 Inclusion', 'Women in leadership roles', 'Percentage', 'none', 'No matching Kobo field mapped']
];

const $ = id => document.getElementById(id);
const clean = value => value == null ? '' : String(value).trim();
const lower = value => clean(value).toLowerCase();
const number = value => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(clean(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};
const formatNumber = value => Number(value || 0).toLocaleString();
const escapeHtml = value => clean(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
const titleCase = value => clean(value).replace(/_/g, ' ').replace(/\s+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

function getField(record, key) {
  for (const path of aliases[key] || []) {
    if (Object.prototype.hasOwnProperty.call(record, path) && clean(record[path])) return record[path];
  }
  return '';
}

function getGps(record) {
  const gps = getField(record, 'gps');
  if (Array.isArray(gps) && gps.length > 1) return { lat: number(gps[0]), lon: number(gps[1]) };
  if (typeof gps === 'string') {
    const parts = gps.split(/[ ,]+/).map(number).filter(Boolean);
    if (parts.length > 1) return { lat: parts[0], lon: parts[1] };
  }
  return { lat: number(getField(record, 'latitude')), lon: number(getField(record, 'longitude')) };
}

function isSomaliRecord(record) {
  const region = lower(getField(record, 'region'));
  if (region.includes('somali') || region.includes('somale')) return true;
  const woreda = lower(getField(record, 'woreda'));
  return ['awbare', 'kebribeyah', 'kebribayah', 'dollo', 'dolo', 'bokolmayo', 'bokulmayo', 'dollo bay', 'jigjiga', 'jijiga', 'danot', 'bokh'].some(name => woreda.includes(name));
}

function normalizeStatus(value) {
  const text = lower(value);
  if (!text) return '';
  if (text.includes('complete')) return 'Completed';
  if (text.includes('ongoing') || text.includes('progress')) return 'Ongoing';
  if (text.includes('delay') || text.includes('problem')) return 'Delayed or Problem';
  return titleCase(value);
}

function normalizeRecord(record, index) {
  const gps = getGps(record);
  const male = number(getField(record, 'male'));
  const female = number(getField(record, 'female'));
  const host = number(getField(record, 'host'));
  const refugee = number(getField(record, 'refugee'));
  const beneficiaries = number(getField(record, 'beneficiaries')) || male + female || host + refugee;

  return {
    index,
    raw: record,
    woreda: titleCase(getField(record, 'woreda')) || 'Unspecified',
    kebele: titleCase(getField(record, 'kebele')),
    subcomponent: titleCase(getField(record, 'subcomponent')),
    type: titleCase(getField(record, 'type')),
    name: titleCase(getField(record, 'name')),
    description: clean(getField(record, 'description')),
    status: normalizeStatus(getField(record, 'status')),
    beneficiaries,
    host,
    refugee,
    male,
    female,
    lat: gps.lat,
    lon: gps.lon,
    hasGps: Boolean(gps.lat && gps.lon),
    hasPhotos: Array.isArray(record._attachments) && record._attachments.some(att => clean(att.mimetype).startsWith('image/')),
    submitted: clean(getField(record, 'submitted')),
    validation: clean(getField(record, 'validation'))
  };
}

function groupBy(rows, key) {
  return rows.reduce((out, row) => {
    const value = typeof key === 'function' ? key(row) : row[key] || 'Unspecified';
    if (!out[value]) out[value] = [];
    out[value].push(row);
    return out;
  }, {});
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + number(row[key]), 0);
}

function countBy(rows, key) {
  return Object.entries(groupBy(rows, key)).map(([name, records]) => ({ name, value: records.length, records })).sort((a, b) => b.value - a.value);
}

function searchableText(record) {
  return lower([record.subcomponent, record.type, record.name, record.description].join(' '));
}

function matches(record, text) {
  return searchableText(record).includes(text);
}

function isCompleted(record) {
  return record.status === 'Completed';
}

function getActuals() {
  const rows = state.filtered;
  const male = sum(rows, 'male');
  const female = sum(rows, 'female');

  return {
    beneficiaries: sum(rows, 'beneficiaries'),
    host: sum(rows, 'host'),
    refugee: sum(rows, 'refugee'),
    slm: rows.filter(row => matches(row, '2.1') || matches(row, 'natural') || matches(row, 'landscape') || matches(row, 'watershed')).length,
    cif: rows.filter(row => (matches(row, 'cif') || matches(row, 'community investment')) && isCompleted(row)).length,
    sif: rows.filter(row => (matches(row, 'sif') || matches(row, 'strategic investment')) && isCompleted(row)).length,
    energy: rows.filter(row => matches(row, '2.2') || matches(row, 'energy') || matches(row, 'solar')).length,
    cbo: rows.filter(row => matches(row, 'cbo') || matches(row, 'cooperative') || matches(row, 'russaco')).length,
    livelihoodBen: sum(rows.filter(row => matches(row, '3.1') || matches(row, '3.2') || matches(row, 'livelihood')), 'beneficiaries'),
    irrigationBen: sum(rows.filter(row => matches(row, '3.3') || matches(row, 'irrigation')), 'beneficiaries'),
    irrigation: rows.filter(row => matches(row, '3.3') || matches(row, 'irrigation')).length,
    femaleShare: male + female ? Math.round((female / (male + female)) * 100) : 0,
    none: 0
  };
}

function getTargetRows() {
  const targets = state.targets?.targets || {};
  const actuals = getActuals();
  return targetMap.map(([code, subcomponent, indicator, unit, actualKey, source]) => {
    const target = number(targets[code]);
    const actual = number(actuals[actualKey]);
    const percent = target ? Math.round((actual / target) * 100) : 0;
    return { code, subcomponent, indicator, unit, target, actual, percent, gap: Math.max(target - actual, 0), source };
  });
}

function getWoredaAllocationRows() {
  const units = state.targets?.woreda_city_intervention_areas || [];
  const targets = state.targets?.targets || {};
  const totalAreas = units.reduce((total, unit) => total + number(unit.total), 0);
  const recordsByWoreda = groupBy(state.filtered, 'woreda');

  return units.map(unit => {
    const share = totalAreas ? number(unit.total) / totalAreas : 0;
    const records = recordsByWoreda[unit.woreda_city] || recordsByWoreda[unit.woreda_city.replace(' Woreda', '')] || [];
    const beneficiaryTarget = Math.round(number(targets.beneficiaries_total) * share);
    const collected = sum(records, 'beneficiaries');
    return {
      unit,
      share,
      beneficiaryTarget,
      collected,
      achievement: beneficiaryTarget ? Math.round((collected / beneficiaryTarget) * 100) : 0,
      cif: Math.round(number(targets.cif_completed) * share),
      sif: Math.round(number(targets.sif_completed) * share),
      slm: Math.round((number(targets.slm_physical_ha) + number(targets.slm_biological_ha)) * share),
      energy: Math.round(number(targets.energy_demo_households) * share),
      livelihood: Math.round((number(targets.traditional_livelihood_beneficiaries) + number(targets.nontraditional_livelihood_beneficiaries)) * share),
      irrigation: Math.round(number(targets.irrigation_area_ha) * share)
    };
  });
}

function makeKpis(items) {
  return items.map(item => `<div class="card kpi-card"><div class="kpi-label">${escapeHtml(item[0])}</div><div class="kpi-value">${escapeHtml(item[1])}</div><div class="kpi-sub">${escapeHtml(item[2])}</div></div>`).join('');
}

function makeProgress(percent) {
  return `<strong>${percent}%</strong><div class="progress"><span style="width:${Math.min(percent, 100)}%"></span></div>`;
}

function makeBadge(status) {
  const className = status === 'Completed' ? 'completed' : status === 'Ongoing' ? 'ongoing' : lower(status).includes('delay') ? 'problem' : '';
  return `<span class="badge ${className}">${escapeHtml(status || 'Unknown')}</span>`;
}

function drawChart(id, type, labels, data, label = 'Records', max = null) {
  const canvas = $(id);
  if (!window.Chart || !canvas) return;
  if (state.charts[id]) state.charts[id].destroy();
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: type === 'doughnut' } },
    scales: type === 'bar' ? { y: { beginAtZero: true } } : {}
  };
  if (max && options.scales.y) options.scales.y.max = max;
  state.charts[id] = new Chart(canvas, { type, data: { labels, datasets: [{ label, data }] }, options });
}

function renderTargets() {
  const targetRows = getTargetRows();
  const targets = state.targets?.targets || {};
  const collected = sum(state.filtered, 'beneficiaries');
  const beneficiaryTarget = number(targets.beneficiaries_total);
  const gap = Math.max(beneficiaryTarget - collected, 0);

  $('target-source').textContent = state.targets?.source || 'Target baseline';
  $('target-note').textContent = state.targets?.note || '';
  $('target-kpis').innerHTML = makeKpis([
    ['Beneficiary target', formatNumber(beneficiaryTarget), 'Official Somali Region target'],
    ['Collected beneficiaries', formatNumber(collected), 'Filtered Kobo records'],
    ['Achievement', beneficiaryTarget ? Math.round((collected / beneficiaryTarget) * 100) + '%' : '0%', formatNumber(gap) + ' remaining'],
    ['Collected records', formatNumber(state.filtered.length), 'Kobo submissions'],
    ['Target year', 'Year 5', 'PDO and intermediate targets']
  ]);

  $('target-table-body').innerHTML = targetRows.map(row => `<tr><td>${escapeHtml(row.subcomponent)}</td><td>${escapeHtml(row.indicator)}</td><td>${escapeHtml(row.unit)}</td><td>${formatNumber(row.target)}</td><td>${formatNumber(row.actual)}</td><td>${makeProgress(row.percent)}</td><td>${formatNumber(row.gap)}</td><td>${escapeHtml(row.source)}</td></tr>`).join('');

  const allocationRows = getWoredaAllocationRows();
  $('woreda-target-body').innerHTML = allocationRows.map(row => `<tr><td>${escapeHtml(row.unit.woreda_city)}</td><td>${escapeHtml(row.unit.zone)}</td><td>${Math.round(row.share * 100)}%</td><td>${formatNumber(row.beneficiaryTarget)}</td><td>${formatNumber(row.collected)}</td><td>${makeProgress(row.achievement)}</td><td>${formatNumber(row.cif)}</td><td>${formatNumber(row.sif)}</td><td>${formatNumber(row.slm)}</td><td>${formatNumber(row.energy)}</td><td>${formatNumber(row.livelihood)}</td><td>${formatNumber(row.irrigation)}</td><td>${escapeHtml(row.unit.note || 'Planning allocation')}</td></tr>`).join('');

  drawChart('chart-target-achievement', 'bar', targetRows.slice(0, 12).map(row => row.indicator.slice(0, 32)), targetRows.slice(0, 12).map(row => row.percent), 'Achievement %', 100);
  drawChart('chart-woreda-targets', 'bar', allocationRows.map(row => row.unit.woreda_city), allocationRows.map(row => row.achievement), 'Beneficiary achievement %', 100);
}

function renderMap() {
  if (!window.L || !$('map')) return;
  const mappedRows = state.filtered.filter(row => row.hasGps);
  $('map-count').textContent = formatNumber(mappedRows.length) + ' mapped records';
  $('map-missing').textContent = formatNumber(state.filtered.length - mappedRows.length) + ' missing GPS';

  if (!state.map) {
    state.map = L.map('map').setView([6.7, 44.2], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(state.map);
    state.markers = L.layerGroup().addTo(state.map);
  }

  state.markers.clearLayers();
  mappedRows.forEach(row => {
    L.marker([row.lat, row.lon]).bindPopup(`<b>${escapeHtml(row.woreda)}</b><br>${escapeHtml(row.kebele)}<br>${escapeHtml(row.name || row.type)}`).addTo(state.markers);
  });

  if (mappedRows.length) {
    state.map.fitBounds(L.latLngBounds(mappedRows.map(row => [row.lat, row.lon])), { padding: [24, 24] });
  }
}

function render() {
  renderTargets();

  const rows = state.filtered;
  const completedCount = rows.filter(isCompleted).length;

  $('hdr-live').textContent = formatNumber(state.records.length);
  $('hdr-filtered').textContent = formatNumber(rows.length);

  $('kpi-grid').innerHTML = makeKpis([
    ['Records', formatNumber(rows.length), 'Filtered records'],
    ['Woreda/City', formatNumber(new Set(rows.map(row => row.woreda)).size), 'Reported units'],
    ['Kebeles', formatNumber(new Set(rows.map(row => row.kebele).filter(Boolean)).size), 'Reported kebeles'],
    ['Beneficiaries', formatNumber(sum(rows, 'beneficiaries')), 'Collected'],
    ['Completed', rows.length ? Math.round((completedCount / rows.length) * 100) + '%' : '0%', formatNumber(completedCount) + ' completed']
  ]);

  const statusCounts = countBy(rows, 'status');
  drawChart('chart-status', 'doughnut', statusCounts.map(row => row.name), statusCounts.map(row => row.value));

  const subcomponentCounts = countBy(rows, 'subcomponent').slice(0, 15);
  drawChart('chart-subcomponent', 'bar', subcomponentCounts.map(row => row.name), subcomponentCounts.map(row => row.value));

  $('latest-body').innerHTML = [...rows]
    .sort((a, b) => clean(b.submitted).localeCompare(clean(a.submitted)))
    .slice(0, 12)
    .map(row => `<tr><td>${escapeHtml((row.submitted || '').slice(0, 10))}</td><td>${escapeHtml(row.woreda)}</td><td>${escapeHtml(row.kebele)}</td><td>${escapeHtml(row.name || row.type)}</td><td>${makeBadge(row.status)}</td><td>${formatNumber(row.beneficiaries)}</td></tr>`)
    .join('') || '<tr><td colspan="6">No records</td></tr>';

  const woredaRecords = countBy(rows, 'woreda').slice(0, 20);
  drawChart('chart-woreda-records', 'bar', woredaRecords.map(row => row.name), woredaRecords.map(row => row.value));

  const woredaBeneficiaries = Object.entries(groupBy(rows, 'woreda'))
    .map(([name, records]) => ({ name, value: sum(records, 'beneficiaries'), records }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
  drawChart('chart-woreda-beneficiaries', 'bar', woredaBeneficiaries.map(row => row.name), woredaBeneficiaries.map(row => row.value), 'Beneficiaries');

  $('woreda-rank-body').innerHTML = Object.entries(groupBy(rows, 'woreda')).map(([woreda, records]) => `<tr><td>${escapeHtml(woreda)}</td><td>${formatNumber(records.length)}</td><td>${formatNumber(new Set(records.map(row => row.kebele).filter(Boolean)).size)}</td><td>${formatNumber(sum(records, 'beneficiaries'))}</td><td>${records.length ? Math.round((records.filter(isCompleted).length / records.length) * 100) : 0}%</td><td>${records.length ? Math.round((records.filter(row => row.hasGps).length / records.length) * 100) : 0}%</td><td>${records.length ? Math.round((records.filter(row => row.hasPhotos).length / records.length) * 100) : 0}%</td></tr>`).join('');

  $('table-body').innerHTML = rows.map(row => `<tr><td>${escapeHtml(row.woreda)}</td><td>${escapeHtml(row.kebele)}</td><td>${escapeHtml(row.name || row.description)}</td><td>${escapeHtml(row.subcomponent)}</td><td>${escapeHtml(row.type)}</td><td>${makeBadge(row.status)}</td><td>${formatNumber(row.beneficiaries)}</td><td>${escapeHtml((row.submitted || '').slice(0, 10))}</td></tr>`).join('');

  $('quality-kpis').innerHTML = [
    ['Missing kebele', rows.filter(row => !row.kebele).length],
    ['Missing status', rows.filter(row => !row.status).length],
    ['Missing beneficiaries', rows.filter(row => !row.beneficiaries).length],
    ['Missing GPS', rows.filter(row => !row.hasGps).length],
    ['Missing photos', rows.filter(row => !row.hasPhotos).length]
  ].map(item => `<div class="quality-item"><span>${item[0]}</span><strong>${formatNumber(item[1])}</strong></div>`).join('');

  $('quality-body').innerHTML = Object.entries(groupBy(rows, 'woreda')).map(([woreda, records]) => `<tr><td>${escapeHtml(woreda)}</td><td>${formatNumber(records.length)}</td><td>${records.filter(row => !row.kebele).length}</td><td>${records.filter(row => !row.status).length}</td><td>${records.filter(row => !row.beneficiaries).length}</td><td>${records.filter(row => !row.hasGps).length}</td><td>${records.filter(row => !row.hasPhotos).length}</td></tr>`).join('');

  $('normalized-json').textContent = JSON.stringify(rows.slice(0, 200), null, 2);
  renderMap();
}

function applyFilters() {
  const get = id => clean($(id)?.value);
  const query = lower(get('filter-search'));

  state.filtered = state.records.filter(record => {
    if (get('filter-woreda') && record.woreda !== get('filter-woreda')) return false;
    if (get('filter-kebele') && record.kebele !== get('filter-kebele')) return false;
    if (get('filter-subcomponent') && record.subcomponent !== get('filter-subcomponent')) return false;
    if (get('filter-type') && record.type !== get('filter-type')) return false;
    if (get('filter-status') && record.status !== get('filter-status')) return false;
    if (get('filter-date-from') && record.submitted && record.submitted.slice(0, 10) < get('filter-date-from')) return false;
    if (get('filter-date-to') && record.submitted && record.submitted.slice(0, 10) > get('filter-date-to')) return false;
    if (query && !lower([record.woreda, record.kebele, record.subcomponent, record.type, record.name, record.description, record.status].join(' ')).includes(query)) return false;
    return true;
  });

  render();
}

function fillSelect(id, values, label) {
  const element = $(id);
  const oldValue = element.value;
  const uniqueValues = [...new Set(values.filter(Boolean))].sort();
  element.innerHTML = `<option value="">${label}</option>` + uniqueValues.map(value => `<option>${escapeHtml(value)}</option>`).join('');
  if (uniqueValues.includes(oldValue)) element.value = oldValue;
}

function csv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [cols.join(','), ...rows.map(row => cols.map(col => `"${clean(row[col]).replace(/"/g, '""')}"`).join(','))].join('\n');
}

function downloadFile(name, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function proxyBase() {
  return clean(localStorage.proxyBase) || location.origin;
}

function showAlert(message, isError = false) {
  const alert = $('alert');
  alert.textContent = message;
  alert.className = isError ? 'alert error' : 'alert';
  alert.classList.remove('hidden');
}

function hideAlert() {
  $('alert').classList.add('hidden');
}

async function loadDashboard() {
  showAlert('Loading Somali Region targets and Kobo records...');
  try {
    state.targets = await (await fetch('data/plan-targets-summary.json', { cache: 'no-store' })).json();

    const params = new URLSearchParams();
    if (clean(localStorage.assetUid)) params.set('asset', localStorage.assetUid);
    if (clean(localStorage.koboServer)) params.set('server', localStorage.koboServer);

    const response = await fetch(`${proxyBase()}/api/kobo-proxy${params.toString() ? '?' + params.toString() : ''}`);
    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    state.raw = Array.isArray(data.results) ? data.results : [];
    state.records = state.raw.filter(isSomaliRecord).map(normalizeRecord);

    $('hdr-synced').textContent = new Date(data.fetchedAt || Date.now()).toLocaleString();
    hideAlert();

    fillSelect('filter-woreda', state.records.map(row => row.woreda), 'All Woreda/City');
    fillSelect('filter-kebele', state.records.map(row => row.kebele), 'All Kebeles');
    fillSelect('filter-subcomponent', state.records.map(row => row.subcomponent), 'All Sub-components');
    fillSelect('filter-type', state.records.map(row => row.type), 'All Types');
    fillSelect('filter-status', state.records.map(row => row.status), 'All Statuses');

    applyFilters();
  } catch (error) {
    showAlert('Failed to load dashboard: ' + error.message, true);
    state.filtered = [];
    render();
  }
}

function setupEvents() {
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      $(`tab-${button.dataset.tab}`).classList.add('active');
      setTimeout(() => state.map && state.map.invalidateSize(), 100);
    });
  });

  ['filter-woreda', 'filter-kebele', 'filter-subcomponent', 'filter-type', 'filter-status', 'filter-date-from', 'filter-date-to', 'filter-search'].forEach(id => {
    $(id).addEventListener('input', applyFilters);
  });

  $('reset-filters').addEventListener('click', () => {
    document.querySelectorAll('.filters-grid select:not(.locked-select), .filters-grid input').forEach(input => { input.value = ''; });
    applyFilters();
  });

  $('refresh-btn').addEventListener('click', loadDashboard);
  $('export-targets').addEventListener('click', () => downloadFile('somali-region-target-vs-collected.csv', csv(getTargetRows())));
  $('export-csv').addEventListener('click', () => downloadFile('somali-region-filtered-records.csv', csv(state.filtered.map(row => ({ woreda: row.woreda, kebele: row.kebele, subcomponent: row.subcomponent, type: row.type, name: row.name, status: row.status, beneficiaries: row.beneficiaries, submitted: row.submitted }))));
  $('export-json').addEventListener('click', () => downloadFile('somali-region-filtered-records.json', JSON.stringify(state.filtered, null, 2)));

  $('settings-btn').addEventListener('click', () => {
    $('setting-asset').value = localStorage.assetUid || '';
    $('setting-server').value = localStorage.koboServer || '';
    $('setting-proxy').value = localStorage.proxyBase || '';
    $('settings-modal').classList.remove('hidden');
  });

  $('settings-close').addEventListener('click', () => $('settings-modal').classList.add('hidden'));
  $('settings-save').addEventListener('click', () => {
    localStorage.assetUid = $('setting-asset').value;
    localStorage.koboServer = $('setting-server').value;
    localStorage.proxyBase = $('setting-proxy').value;
    $('settings-modal').classList.add('hidden');
    loadDashboard();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  loadDashboard();
});
