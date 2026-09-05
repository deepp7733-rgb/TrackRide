const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

async function req(path, opt = {}) {
  const r = await fetch(BASE + path, {
    headers: {
      "Content-Type": "application/json",
      ...(opt.headers || {}),
    },
    ...opt,
  });

  if (!r.ok) throw Error(`API ${r.status}`);
  return r.json();
}

export const searchTransport = (p) =>
  req("/api/search", {
    method: "POST",
    body: JSON.stringify(p),
  });

export const getTracking = (id) =>
  req(`/api/tracking/${encodeURIComponent(id)}`);

export const getAlerts = () => req("/api/alerts");

export const getSavedRoutes = () => req("/api/users/saved");

export const saveRoute = (x) =>
  req("/api/users/saved", {
    method: "POST",
    body: JSON.stringify(x),
  });

export const deleteSavedRoute = (id) =>
  req(`/api/users/saved/${id}`, {
    method: "DELETE",
  });

export const googleLogin = (credential) =>
  req("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });

export { BASE as API_BASE };
