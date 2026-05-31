// ─────────────────────────────────────────────────────────────
//  CRM Insight Card — app.js  (corrected for real Cards SDK API)
// ─────────────────────────────────────────────────────────────

const CRM_ENDPOINT = 'https://indy-crm.free.beeceptor.com/crm/customer';
const FETCH_TIMEOUT_MS = 8000;

const $ = (id) => document.getElementById(id);

function showState(name) {
  ['loading', 'error', 'data'].forEach((s) => {
    $(`state-${s}`).classList.toggle('hidden', s !== name);
  });
  if (window.Kustomer && typeof Kustomer.resize === 'function') {
    Kustomer.resize();
  }
}

function renderCRMData(data) {
  const plan  = data.membershipPlan ?? '—';
  const type  = data.customerType   ?? '—';
  const notes = data.notes          ?? '—';

  $('field-plan').textContent  = plan;
  $('field-type').textContent  = type;
  $('field-notes').textContent = notes;

  const planBadge = $('field-plan');
  planBadge.className = 'value badge';
  if (plan === 'Gold')     planBadge.classList.add('badge-gold');
  if (plan === 'Silver')   planBadge.classList.add('badge-silver');
  if (plan === 'Platinum') planBadge.classList.add('badge-platinum');

  showState('data');
}

async function fetchCRMData(customerEmail) {
  const url = customerEmail
    ? `${CRM_ENDPOINT}?email=${encodeURIComponent(customerEmail)}`
    : CRM_ENDPOINT;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data || (!data.membershipPlan && !data.customerType && !data.notes)) {
      throw new Error('Empty or unexpected CRM payload');
    }
    renderCRMData(data);
  } catch (err) {
    clearTimeout(timer);
    console.warn('[CRM Card] Fetch failed:', err.message);
    showState('error');
  }
}

// Pull the primary email out of the real context shape, defensively.
function extractEmail(contextJSON) {
  try {
    const emails = contextJSON?.customer?.attributes?.emails;
    if (Array.isArray(emails) && emails.length) {
      return emails[0].email ?? null;
    }
  } catch (e) { /* fall through */ }
  return null;
}

// Real Cards SDK: single callback, receives context directly.
// Calling initialize is also what makes the card render in the panel.
Kustomer.initialize(function (contextJSON) {
  const email = extractEmail(contextJSON);
  console.info('[CRM Card] Context loaded. Email:', email);
  fetchCRMData(email);
});
