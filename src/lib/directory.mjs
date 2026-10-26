export const PLANS = ['essential', 'plus', 'family', 'senior_care', 'community'];
export const PAGE_SIZE = 20;
export function directoryQuery(params, kind) {
  const rawPage = params.get('page') || '1';
  const page = /^\d{1,5}$/.test(rawPage) ? Math.min(10000, Math.max(1, Number(rawPage))) : 1;
  const value = params.get('filter') || 'all';
  const allowed = kind === 'doctors' ? ['active', 'inactive'] : PLANS;
  return { q: (params.get('q') || '').trim().slice(0, 80), filter: allowed.includes(value) ? value : 'all', page };
}
export function escapedSearch(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function directoryFilter(query, kind) {
  const filter = {};
  if (query.q) {
    const regex = { $regex: escapedSearch(query.q), $options: 'i' };
    const fields = kind === 'doctors' ? ['name', 'phone', 'registrationNumber', 'city', 'specialties'] : ['name', 'phone', 'memberId', 'email'];
    filter.$or = fields.map((field) => ({ [field]: regex }));
  }
  if (query.filter !== 'all') {
    if (kind === 'doctors' && ['active', 'inactive'].includes(query.filter)) filter.isActive = query.filter === 'active';
    if (kind === 'patients' && PLANS.includes(query.filter)) filter.plan = query.filter;
  }
  return filter;
}
