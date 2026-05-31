// ─────────────────────────────────────────────────────────────
//  CRM Insight Card — app.js
// ─────────────────────────────────────────────────────────────

const CRM_ENDPOINT = 'https://indy-crm.free.beeceptor.com/crm/customer';
const FETCH_TIMEOUT_MS = 8000;

const $ = (id) => document.getElementById(id);

function showState(name) {
  ['loading', 'error', 'data'].forEach((s) => {
    $(`state-${s}`).classList.toggle('hidden', s !== name);
  });
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

Kustomer.initialize({}, () => {
  Kustomer.context({ page: 'customer' }, (context, err) => {
    if (err || !context) {
      console.warn('[CRM Card] No Kustomer context available:', err);
      fetchCRMData(null);
      return;
    }
    const customerEmail =
      context?.customer?.email
      ?? context?.customer?.emails?.[0]
      ?? null;
    console.info('[CRM Card] Customer context loaded. Email:', customerEmail);
    fetchCRMData(customerEmail);
  });
});
