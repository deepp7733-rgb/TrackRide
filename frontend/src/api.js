const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed: ${response.status}`);
  return body;
}

export const api = {
  health: () => request("/health"),
  search: (params) => request(`/search?${new URLSearchParams(params)}`),
  vehicles: (type = "both") => request(`/vehicles?type=${encodeURIComponent(type)}`),
  tracking: (vehicleId) => request(`/tracking/${encodeURIComponent(vehicleId)}`),
  alerts: () => request("/alerts"),
  saved: (token) => request("/users/saved", { headers: { Authorization: `Bearer ${token}` } }),
  save: (token, journey) => request("/users/saved", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(journey),
  }),
  removeSaved: (token, journeyId) => request(`/users/saved/${encodeURIComponent(journeyId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }),
  googleLogin: (credential) => request("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  }),
};
