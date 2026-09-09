const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export const api = {
  // Risks
  risks:        (params = {}) => request('/risks/?' + new URLSearchParams(params)),
  riskSummary:  ()             => request('/risks/summary'),
  risk:         (id)           => request(`/risks/${id}`),
  createRisk:   (data)         => request('/risks/', { method: 'POST',  body: JSON.stringify(data) }),
  updateRisk:   (id, data)     => request(`/risks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Vendors
  vendors:      (params = {}) => request('/vendors/?' + new URLSearchParams(params)),
  vendor:       (id)          => request(`/vendors/${id}`),

  // SBR
  sbr:          (params = {}) => request('/sbr/?' + new URLSearchParams(params)),
  sbrSummary:   ()            => request('/sbr/summary'),

  // SCA
  sca:          ()            => request('/sca/'),
  scaSummary:   ()            => request('/sca/summary'),

  // KRI
  kri:          ()            => request('/kri/'),
  kriStatus:    ()            => request('/kri/status'),

  // IRQ
  irq:          ()            => request('/irq/'),

  // Chat
  chat:         (messages, context_query) =>
    request('/chat/', { method: 'POST', body: JSON.stringify({ messages, context_query }) }),
}
