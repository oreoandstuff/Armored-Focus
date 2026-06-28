// This is a client-heavy, private CRM tool — render it as an SPA so the singleton
// client store is never shared across server requests. The server `load` still
// runs to fetch initial state from D1.
export const ssr = false;
