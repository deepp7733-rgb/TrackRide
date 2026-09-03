import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { useAsync, useLiveTracking, useSearch } from "./hooks";

const TABS = [
  ["home", "⌂", "Home"],
  ["search", "⌕", "Find"],
  ["live", "◉", "Live"],
  ["alerts", "!", "Alerts"],
  ["profile", "●", "Profile"],
];

const demoGoogleDisabled = !import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [tab, setTab] = useState("home");
  const [mode, setMode] = useState("both");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("trackride_user") || "null"));
  const [settings, setSettings] = useState(() => JSON.parse(localStorage.getItem("trackride_settings") || JSON.stringify({
    notifications: true, largeText: false, language: "English"
  })));

  const vehicles = useAsync(() => api.vehicles(mode), [mode]);
  const alerts = useAsync(api.alerts, []);
  const search = useSearch({ from, to, type: mode, date });
  const live = useLiveTracking(detailVehicle?.id, Boolean(detailVehicle));

  useEffect(() => {
    document.documentElement.classList.toggle("large-text", settings.largeText);
    localStorage.setItem("trackride_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (user) localStorage.setItem("trackride_user", JSON.stringify(user));
    else localStorage.removeItem("trackride_user");
  }, [user]);

  const nearby = vehicles.data?.vehicles || [];
  const results = search.data?.results || [];
  const liveVehicle = live.data?.vehicle || detailVehicle;

  const setSetting = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  const performSearch = () => {
    if (!from.trim() || !to.trim()) {
      setTab("search");
      return;
    }
    setTab("search");
  };

  const loginWithGoogle = async (credential) => {
    try {
      const data = await api.googleLogin(credential);
      setUser(data.user);
    } catch (e) {
      alert(e.message);
    }
  };

  const logout = () => setUser(null);

  const openVehicle = (vehicle) => {
    setDetailVehicle(vehicle);
    setTab("live");
  };

  return (
    <div className="page">
      <main className="shell">
        <header className="topbar">
          <div>
            <div className="brand">TrackRide</div>
            <div className="tagline">Bus + Train • India • Live</div>
          </div>
          <button className="iconButton" onClick={() => setTab("profile")} aria-label="Open profile">
            {user?.picture ? <img src={user.picture} alt="" /> : "●"}
          </button>
        </header>

        <section className="content">
          {tab === "home" && (
            <Home
              from={from} to={to} date={date} mode={mode}
              setFrom={setFrom} setTo={setTo} setDate={setDate} setMode={setMode}
              onSearch={performSearch} vehicles={nearby} onOpen={openVehicle}
              onFind={() => setTab("search")}
            />
          )}
          {tab === "search" && (
            <SearchScreen
              from={from} to={to} date={date} mode={mode}
              setFrom={setFrom} setTo={setTo} setDate={setDate} setMode={setMode}
              onSearch={performSearch} state={search} onOpen={openVehicle}
            />
          )}
          {tab === "live" && (
            <LiveScreen
              vehicle={liveVehicle} state={live} vehicles={nearby}
              onOpen={openVehicle} onBack={() => setDetailVehicle(null)}
            />
          )}
          {tab === "alerts" && <Alerts alerts={alerts.data?.alerts || []} loading={alerts.loading} onOpen={openVehicle} />}
          {tab === "profile" && (
            <Profile
              user={user} setUser={setUser} logout={logout}
              settings={settings} setSetting={setSetting}
              googleDisabled={demoGoogleDisabled}
              onGoogleLogin={loginWithGoogle}
            />
          )}
        </section>

        <nav className="bottomNav" aria-label="Main navigation">
          {TABS.map(([id, icon, label]) => (
            <button key={id} className={tab === id ? "nav active" : "nav"} onClick={() => setTab(id)}>
              <span>{icon}</span><small>{label}</small>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}

function ModeSwitch({ mode, setMode }) {
  return (
    <div className="segmented" role="tablist" aria-label="Transport type">
      {[["both", "All"], ["bus", "Bus"], ["train", "Train"]].map(([id, label]) => (
        <button key={id} className={mode === id ? "selected" : ""} onClick={() => setMode(id)}>{label}</button>
      ))}
    </div>
  );
}

function SearchBox({ from, to, setFrom, setTo, date, setDate, mode, setMode, onSearch }) {
  return (
    <div className="searchCard">
      <ModeSwitch mode={mode} setMode={setMode} />
      <label className="field"><span>FROM</span><input value={from} onChange={e => setFrom(e.target.value)} placeholder="City, station or stop" /></label>
      <div className="swap">↕</div>
      <label className="field"><span>TO</span><input value={to} onChange={e => setTo(e.target.value)} placeholder="Where do you want to go?" /></label>
      <label className="field"><span>DATE</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      <button className="primary" onClick={onSearch}>Find buses & trains</button>
    </div>
  );
}

function Home(props) {
  return (
    <>
      <div className="hero">
        <p className="eyebrow">ONE SEARCH. EVERY RIDE.</p>
        <h1>Where do you<br />want to go?</h1>
        <p>Find buses and trains across India from one place.</p>
      </div>
      <SearchBox {...props} />
      <div className="sectionTitle">Nearby live vehicles</div>
      <VehicleList vehicles={props.vehicles} onOpen={props.onOpen} />
    </>
  );
}

function SearchScreen({ state, onOpen, ...props }) {
  const results = state.data?.results || [];
  return (
    <>
      <div className="screenHeading"><h2>Find a ride</h2><p>Search by city, station or stop.</p></div>
      <SearchBox {...props} />
      {state.loading && <Loading />}
      {state.error && <ErrorBox message={state.error.message} />}
      {!state.loading && !state.error && results.length > 0 && (
        <div className="results">
          <div className="sectionTitle">{results.length} options</div>
          {results.map(r => <ResultCard key={r.id} result={r} onOpen={onOpen} />)}
        </div>
      )}
      {!state.loading && props.from && props.to && !results.length && !state.error && <Empty text="No demo results yet. Connect a real transit provider in the backend." />}
    </>
  );
}

function ResultCard({ result, onOpen }) {
  const isTrain = result.type === "train";
  return (
    <article className="resultCard">
      <div className="resultTop">
        <span className={"transportBadge " + (isTrain ? "train" : "bus")}>{isTrain ? "TRAIN" : "BUS"}</span>
        <strong>{result.name}</strong>
        <span className="time">{result.duration} min</span>
      </div>
      <div className="routeText">{result.from} → {result.to}</div>
      <div className="meta"><span>{result.departure}</span><span>{result.arrival}</span><span>{result.status}</span></div>
      <button className="secondary" onClick={() => onOpen(result.vehicle)}>Track live</button>
    </article>
  );
}

function VehicleList({ vehicles, onOpen }) {
  if (!vehicles?.length) return <Empty text="No nearby demo vehicles." />;
  return <div className="results">{vehicles.map(v => (
    <article className="vehicleCard" key={v.id} onClick={() => onOpen(v)}>
      <div className="vehicleIcon">{v.type === "train" ? "🚆" : "🚌"}</div>
      <div className="grow"><strong>{v.name}</strong><div className="muted">{v.from} → {v.to}</div></div>
      <div className="eta"><b>{v.etaMin}</b><small>min</small></div>
    </article>
  ))}</div>;
}

function LiveScreen({ vehicle, state, vehicles, onOpen, onBack }) {
  if (!vehicle) return (
    <>
      <div className="screenHeading"><h2>Live tracking</h2><p>Select a bus or train to see movement.</p></div>
      <VehicleList vehicles={vehicles} onOpen={onOpen} />
    </>
  );

  const current = state.data?.vehicle || vehicle;
  return (
    <>
      <div className="screenHeading rowBetween">
        <div><h2>Live tracking</h2><p>{current.name}</p></div>
        {onBack && <button className="ghost" onClick={onBack}>Close</button>}
      </div>
      {state.error && <ErrorBox message={state.error.message} />}
      <div className="mapMock">
        <div className="mapGrid" />
        <div className="routeLine" />
        <div className="vehicleDot" style={{ left: `${Math.max(5, Math.min(92, current.progress * 100))}%` }}>
          {current.type === "train" ? "🚆" : "🚌"}
        </div>
        <span className="mapLabel start">{current.from}</span>
        <span className="mapLabel end">{current.to}</span>
      </div>
      <div className="livePanel">
        <div className="liveBig">{current.etaMin}<span> min</span></div>
        <div className="muted">estimated time to destination</div>
        <div className="infoGrid">
          <Info label="Status" value={current.status} />
          <Info label="Next stop" value={current.nextStop || "Updating"} />
          <Info label="Distance" value={`${current.distanceKm ?? "--"} km`} />
          <Info label="Updated" value={current.updatedAt ? new Date(current.updatedAt).toLocaleTimeString() : "Now"} />
        </div>
      </div>
    </>
  );
}

function Alerts({ alerts, loading, onOpen }) {
  return (
    <>
      <div className="screenHeading"><h2>Alerts</h2><p>Service changes and live transport updates.</p></div>
      {loading ? <Loading /> : alerts.map(a => (
        <article className={"alert " + a.priority} key={a.id} onClick={() => a.vehicle && onOpen(a.vehicle)}>
          <span>{a.priority === "urgent" ? "⚠️" : "🔔"}</span>
          <div><strong>{a.title}</strong><p>{a.text}</p><small>{a.time}</small></div>
        </article>
      ))}
    </>
  );
}

function Profile({ user, logout, settings, setSetting, googleDisabled, onGoogleLogin }) {
  useEffect(() => {
    if (googleDisabled || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: response => onGoogleLogin(response.credential),
    });
    const node = document.getElementById("googleButton");
    if (node) {
      node.innerHTML = "";
      window.google.accounts.id.renderButton(node, { theme: "outline", size: "large", width: 280 });
    }
  }, [googleDisabled, onGoogleLogin]);

  return (
    <>
      <div className="profile">
        <div className="avatar">{user?.picture ? <img src={user.picture} alt="" /> : "GU"}</div>
        <div><h2>{user?.name || "Guest User"}</h2><p>{user?.email || "Sign in to save routes and preferences."}</p></div>
      </div>

      {!user ? (
        <div className="authCard">
          <h3>Sign in to TrackRide</h3>
          <p className="muted">Use Google to create your TrackRide account and sync saved journeys.</p>
          <div id="googleButton" className="googleButton" />
          {googleDisabled && <p className="hint">Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google sign-in.</p>}
        </div>
      ) : (
        <button className="secondary full" onClick={logout}>Sign out</button>
      )}

      <div className="sectionTitle">Settings</div>
      <div className="settings">
        <Setting label="Notifications" sub="Arrival and delay alerts" value={settings.notifications} onChange={v => setSetting("notifications", v)} />
        <Setting label="Larger text" sub="Accessibility mode" value={settings.largeText} onChange={v => setSetting("largeText", v)} />
        <div className="settingRow">
          <div><strong>Language</strong><small>App language</small></div>
          <select value={settings.language} onChange={e => setSetting("language", e.target.value)}>
            <option>English</option><option>हिन्दी</option><option>বাংলা</option><option>मराठी</option>
          </select>
        </div>
      </div>
    </>
  );
}

function Setting({ label, sub, value, onChange }) {
  return (
    <div className="settingRow">
      <div><strong>{label}</strong><small>{sub}</small></div>
      <button className={"switch " + (value ? "on" : "")} onClick={() => onChange(!value)} aria-pressed={value}><span /></button>
    </div>
  );
}

function Info({ label, value }) {
  return <div className="info"><small>{label}</small><strong>{value}</strong></div>;
}
function Loading() { return <div className="empty">Loading…</div>; }
function Empty({ text }) { return <div className="empty"><b>Nothing here yet</b><span>{text}</span></div>; }
function ErrorBox({ message }) { return <div className="error">{message}</div>; }

export default App;
