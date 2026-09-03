const routes = [
  { id:"bus-102", type:"bus", name:"Bus 102", from:"Kolkata College", to:"Howrah Station", duration:42, stops:["Kolkata College","Esplanade","Howrah Station"] },
  { id:"bus-105", type:"bus", name:"Bus 105", from:"Salt Lake", to:"Sealdah", duration:35, stops:["Salt Lake","Phoolbagan","Sealdah"] },
  { id:"train-12345", type:"train", name:"Demo Express 12345", from:"Kolkata", to:"Bardhaman", duration:95, stops:["Kolkata","Bandel","Bardhaman"] },
  { id:"train-12988", type:"train", name:"Demo Intercity 12988", from:"Howrah", to:"Durgapur", duration:120, stops:["Howrah","Bardhaman","Durgapur"] }
];

const state = new Map(routes.map((r, i) => [r.id, {
  ...r,
  etaMin: 8 + i * 5,
  distanceKm: 2.4 + i,
  progress: 0.18 + i * 0.12,
  status: i === 1 ? "Delayed" : "On time",
  nextStop: r.stops[1],
  updatedAt: new Date().toISOString()
}]));

export async function searchRoutes({ from, to, type }) {
  const f = String(from || "").toLowerCase();
  const t = String(to || "").toLowerCase();
  const allowed = type === "both" ? ["bus", "train"] : [type];

  return routes
    .filter(r => allowed.includes(r.type))
    .filter(r => (!f || `${r.from} ${r.stops.join(" ")}`.toLowerCase().includes(f)))
    .filter(r => (!t || `${r.to} ${r.stops.join(" ")}`.toLowerCase().includes(t)))
    .map(r => ({
      id: r.id,
      type: r.type,
      name: r.name,
      from: r.from,
      to: r.to,
      duration: r.duration,
      departure: r.type === "train" ? "08:30" : "08:42",
      arrival: r.type === "train" ? "10:05" : "09:24",
      status: state.get(r.id).status,
      vehicle: state.get(r.id)
    }));
}

export async function getVehicles(type = "both") {
  const allowed = type === "both" ? ["bus", "train"] : [type];
  return [...state.values()].filter(v => allowed.includes(v.type));
}

export async function getTracking(id) {
  const v = state.get(id);
  if (!v) return null;

  const nextProgress = v.progress >= 0.96 ? 0.02 : +(v.progress + 0.015).toFixed(3);
  const route = routes.find(r => r.id === id);
  const nextStopIndex = Math.min(route.stops.length - 1, Math.floor(nextProgress * route.stops.length));
  const updated = {
    ...v,
    progress: nextProgress,
    etaMin: Math.max(1, Math.round((1 - nextProgress) * route.duration)),
    distanceKm: +(Math.max(.1, (1 - nextProgress) * 10).toFixed(1)),
    nextStop: route.stops[nextStopIndex],
    updatedAt: new Date().toISOString()
  };
  state.set(id, updated);
  return updated;
}

export async function getAlerts() {
  return [
    { id:"a1", priority:"normal", title:"Bus 102", text:"Vehicle is moving normally toward Howrah Station.", time:"Just now", vehicle:state.get("bus-102") },
    { id:"a2", priority:"urgent", title:"Bus 105", text:"Expected delay near Phoolbagan.", time:"6 min ago", vehicle:state.get("bus-105") },
    { id:"a3", priority:"normal", title:"Train 12345", text:"Running status feed is ready for provider integration.", time:"12 min ago", vehicle:state.get("train-12345") }
  ];
}
