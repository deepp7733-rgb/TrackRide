import React, { useEffect, useState } from "react";
import { api } from "./api";
import { useAsync, useLiveTracking, useSearch } from "./hooks";

const TABS = [
  ["home", "⌂", "Home"],
  ["search", "⌕", "Search"],
  ["live", "◉", "Live"],
  ["alerts", "!", "Alerts"],
  ["profile", "●", "Profile"],
];

const googleDisabled = !import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [tab, setTab] = useState("home");

  const [mode, setMode] = useState("both");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("trackride_user") || "null")
  );

  const [settings, setSettings] = useState(() =>
    JSON.parse(
      localStorage.getItem("trackride_settings") ||
        JSON.stringify({
          notifications: true,
          largeText: false,
          language: "English",
        })
    )
  );

  /* ---------------- BACKEND HOOKS ---------------- */

  const vehiclesState = useAsync(
    () => api.vehicles(mode),
    [mode]
  );

  const alertsState = useAsync(api.alerts, []);

  const searchState = useSearch({
    from,
    to,
    type: mode,
    date,
  });

  const liveState = useLiveTracking(
    selectedVehicle?.id,
    Boolean(selectedVehicle)
  );

  const vehicles = vehiclesState.data?.vehicles || [];
  const results = searchState.data?.results || [];
  const alerts = alertsState.data?.alerts || alertsState.data || [];

  const liveVehicle =
    liveState.data?.vehicle || selectedVehicle;

  /* ---------------- SETTINGS ---------------- */

  useEffect(() => {
    document.documentElement.classList.toggle(
      "large-text",
      settings.largeText
    );

    localStorage.setItem(
      "trackride_settings",
      JSON.stringify(settings)
    );
  }, [settings]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        "trackride_user",
        JSON.stringify(user)
      );
    } else {
      localStorage.removeItem("trackride_user");
    }
  }, [user]);

  /* ---------------- ACTIONS ---------------- */

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const openVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setTab("live");
  };

  const startSearch = () => {
    setTab("search");
  };

  const loginWithGoogle = async (credential) => {
    try {
      const data = await api.googleLogin(credential);
      setUser(data.user);
    } catch (error) {
      alert(error.message);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const goTab = (nextTab) => {
    setTab(nextTab);
  };

  return (
    <div className="page-wrap">
      <div className="app-shell">

        {/* HEADER */}
        <header className="topbar">
          <div className="topbar-row">

            <div className="brand">
              <div className="brand-mark">
                TrackRide
              </div>

              <div className="brand-tag">
                Your city. Your route. In real time.
              </div>
            </div>

            <button
              className="icon-btn"
              onClick={() => setTab("profile")}
              aria-label="Profile"
            >
              {user?.picture ? (
                <img src={user.picture} alt="" />
              ) : (
                "👤"
              )}
            </button>

          </div>

          {tab !== "home" && (
            <h1 className="screen-title">
              {TABS.find((item) => item[0] === tab)?.[2]}
            </h1>
          )}
        </header>

        {/* CONTENT */}
        <main className="content">

          {tab === "home" && (
            <HomeScreen
              from={from}
              to={to}
              date={date}
              mode={mode}
              setFrom={setFrom}
              setTo={setTo}
              setDate={setDate}
              setMode={setMode}
              onSearch={startSearch}
              vehicles={vehicles}
              onOpenVehicle={openVehicle}
              loading={vehiclesState.loading}
            />
          )}

          {tab === "search" && (
            <SearchScreen
              from={from}
              to={to}
              date={date}
              mode={mode}
              setFrom={setFrom}
              setTo={setTo}
              setDate={setDate}
              setMode={setMode}
              onSearch={startSearch}
              state={searchState}
              results={results}
              onOpenVehicle={openVehicle}
            />
          )}

          {tab === "live" && (
            <LiveScreen
              vehicle={liveVehicle}
              vehicles={vehicles}
              state={liveState}
              onOpenVehicle={openVehicle}
            />
          )}

          {tab === "alerts" && (
            <AlertsScreen
              alerts={alerts}
              loading={alertsState.loading}
              onOpenVehicle={openVehicle}
            />
          )}

          {tab === "profile" && (
            <ProfileScreen
              user={user}
              googleDisabled={googleDisabled}
              onGoogleLogin={loginWithGoogle}
              logout={logout}
              settings={settings}
              updateSetting={updateSetting}
            />
          )}

        </main>

        {/* BOTTOM NAVIGATION */}
        <nav className="bottom-nav">
          {TABS.map(([id, icon, label]) => (
            <button
              key={id}
              className={
                "nav-btn " +
                (tab === id ? "active" : "")
              }
              onClick={() => goTab(id)}
            >
              <span className="ni">{icon}</span>
              <span className="nl">{label}</span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  );
}


/* =========================================================
   HOME
========================================================= */

function HomeScreen({
  from,
  to,
  date,
  mode,
  setFrom,
  setTo,
  setDate,
  setMode,
  onSearch,
  vehicles,
  onOpenVehicle,
  loading,
}) {
  return (
    <div className="fadein">

      <div className="hero">
        <div className="eyebrow">
          ONE SEARCH. EVERY RIDE.
        </div>

        <h2>
          Where do you
          <br />
          want to go?
        </h2>

        <p>
          Find buses and trains across India
          from one place.
        </p>
      </div>

      <SearchCard
        from={from}
        to={to}
        date={date}
        mode={mode}
        setFrom={setFrom}
        setTo={setTo}
        setDate={setDate}
        setMode={setMode}
        onSearch={onSearch}
      />

      <div className="quick-actions">

        <button
          className="quick-btn"
          onClick={() => {
            setMode("bus");
            onOpenVehicle(vehicles[0]);
          }}
        >
          <span className="qi">🚌</span>
          <span className="ql">Nearby Buses</span>
        </button>

        <button
          className="quick-btn"
          onClick={() => {
            setMode("train");
            onOpenVehicle(vehicles[0]);
          }}
        >
          <span className="qi">🚆</span>
          <span className="ql">Nearby Trains</span>
        </button>

        <button
          className="quick-btn"
          onClick={() => {
            document
              .querySelector(".search-input")
              ?.focus();
          }}
        >
          <span className="qi">📍</span>
          <span className="ql">Search Places</span>
        </button>

      </div>

      <div className="section-heading">
        Nearby live transport
      </div>

      {loading ? (
        <Loading />
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon="🚌"
          title="No live vehicles yet"
          text="Live buses and trains will appear here when the backend has transport data."
        />
      ) : (
        <div className="card-list">
          {vehicles.slice(0, 5).map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onOpen={onOpenVehicle}
            />
          ))}
        </div>
      )}

    </div>
  );
}


/* =========================================================
   SEARCH
========================================================= */

function SearchCard({
  from,
  to,
  date,
  mode,
  setFrom,
  setTo,
  setDate,
  setMode,
  onSearch,
}) {
  return (
    <div className="search-card">

      <div className="transport-switch">

        <button
          className={mode === "both" ? "selected" : ""}
          onClick={() => setMode("both")}
        >
          All
        </button>

        <button
          className={mode === "bus" ? "selected" : ""}
          onClick={() => setMode("bus")}
        >
          🚌 Bus
        </button>

        <button
          className={mode === "train" ? "selected" : ""}
          onClick={() => setMode("train")}
        >
          🚆 Train
        </button>

      </div>

      <label className="search-field">
        <span className="search-dot from">●</span>

        <div>
          <small>FROM</small>

          <input
            className="search-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="City, station or stop"
          />
        </div>
      </label>

      <div className="search-divider" />

      <label className="search-field">
        <span className="search-dot to">●</span>

        <div>
          <small>TO</small>

          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Where do you want to go?"
          />
        </div>
      </label>

      <div className="search-divider" />

      <label className="date-field">
        <span>📅</span>

        <div>
          <small>DATE</small>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </label>

      <button
        className="primary-btn"
        onClick={onSearch}
      >
        Find buses & trains
      </button>

    </div>
  );
}


/* =========================================================
   SEARCH RESULTS
========================================================= */

function SearchScreen({
  from,
  to,
  date,
  mode,
  setFrom,
  setTo,
  setDate,
  setMode,
  onSearch,
  state,
  results,
  onOpenVehicle,
}) {
  return (
    <div className="fadein">

      <div className="page-intro">
        <div className="eyebrow">
          PLAN YOUR JOURNEY
        </div>

        <h2>Find a ride</h2>

        <p>
          Search buses and trains by city,
          station or stop.
        </p>
      </div>

      <SearchCard
        from={from}
        to={to}
        date={date}
        mode={mode}
        setFrom={setFrom}
        setTo={setTo}
        setDate={setDate}
        setMode={setMode}
        onSearch={onSearch}
      />

      {state.loading && <Loading />}

      {state.error && (
        <ErrorState message={state.error.message} />
      )}

      {!state.loading &&
        !state.error &&
        results.length > 0 && (
          <>
            <div className="section-heading">
              {results.length} transport options
            </div>

            <div className="card-list">
              {results.map((result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  onOpen={onOpenVehicle}
                />
              ))}
            </div>
          </>
        )}

      {!state.loading &&
        !state.error &&
        from &&
        to &&
        results.length === 0 && (
          <EmptyState
            icon="🔎"
            title="No rides found"
            text="Try another city, station or transport type."
          />
        )}

    </div>
  );
}


/* =========================================================
   VEHICLE CARD
========================================================= */

function VehicleCard({ vehicle, onOpen }) {
  const isTrain = vehicle.type === "train";

  return (
    <article
      className="vehicle-card"
      onClick={() => onOpen(vehicle)}
    >

      <div
        className={
          "vehicle-badge " +
          (isTrain ? "train" : "bus")
        }
      >
        {isTrain ? "🚆" : "🚌"}
      </div>

      <div className="vehicle-info">

        <div className="vehicle-name">
          {vehicle.name || vehicle.number || "Transport"}
        </div>

        <div className="vehicle-route">
          {vehicle.from || "Unknown"} →{" "}
          {vehicle.to || "Unknown"}
        </div>

        <div className="vehicle-meta">
          {isTrain ? "TRAIN" : "BUS"}
          {vehicle.status && (
            <> · {vehicle.status}</>
          )}
        </div>

      </div>

      <div className="vehicle-arrow">
        ›
      </div>

    </article>
  );
}


/* =========================================================
   RESULT CARD
========================================================= */

function ResultCard({ result, onOpen }) {
  const isTrain = result.type === "train";

  return (
    <article className="result-card">

      <div className="result-top">

        <div
          className={
            "transport-badge " +
            (isTrain ? "train" : "bus")
          }
        >
          {isTrain ? "🚆 TRAIN" : "🚌 BUS"}
        </div>

        <span className="result-duration">
          {result.duration
            ? `${result.duration} min`
            : ""}
        </span>

      </div>

      <h3>
        {result.name ||
          result.number ||
          "Transport service"}
      </h3>

      <div className="result-route">
        {result.from} → {result.to}
      </div>

      <div className="result-times">

        <div>
          <small>DEPARTURE</small>
          <strong>
            {result.departure || "--"}
          </strong>
        </div>

        <div className="time-line">
          ─────────
        </div>

        <div className="right">
          <small>ARRIVAL</small>
          <strong>
            {result.arrival || "--"}
          </strong>
        </div>

      </div>

      <div className="result-bottom">
        <span>
          {result.status || "Schedule available"}
        </span>

        {result.vehicle && (
          <button
            className="small-btn"
            onClick={() =>
              onOpen(result.vehicle)
            }
          >
            Live tracking
          </button>
        )}
      </div>

    </article>
  );
}


/* =========================================================
   LIVE
========================================================= */

function LiveScreen({
  vehicle,
  vehicles,
  state,
  onOpenVehicle,
}) {
  if (!vehicle) {
    return (
      <div className="fadein">

        <div className="page-intro">
          <div className="eyebrow">
            REAL-TIME TRANSPORT
          </div>

          <h2>Live tracking</h2>

          <p>
            Select a bus or train to see its
            latest movement.
          </p>
        </div>

        {vehicles.length === 0 ? (
          <EmptyState
            icon="📍"
            title="No live vehicles"
            text="Live transport positions will appear here."
          />
        ) : (
          <div className="card-list">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onOpen={onOpenVehicle}
              />
            ))}
          </div>
        )}

      </div>
    );
  }

  const current =
    state.data?.vehicle || vehicle;

  const isTrain = current.type === "train";

  return (
    <div className="fadein">

      <div className="live-header">

        <div>
          <div className="eyebrow">
            LIVE NOW
          </div>

          <h2>
            {isTrain ? "Train" : "Bus"} tracking
          </h2>

          <p>
            {current.name ||
              current.number ||
              "Selected vehicle"}
          </p>
        </div>

        <span className="live-dot">
          ● LIVE
        </span>

      </div>

      {/* MAP AREA */}
      <div className="map-card">

        <div className="map-header">
          <strong>
            Live location
          </strong>

          <span>
            {current.updatedAt
              ? new Date(
                  current.updatedAt
                ).toLocaleTimeString()
              : "Updating"}
          </span>
        </div>

        <div className="map-area">

          <div className="map-grid" />

          <div className="map-route-line">
            <span className="map-stop first" />
            <span className="map-stop second" />
            <span className="map-stop third" />
            <span className="map-stop fourth" />
          </div>

          <div className="vehicle-marker">
            {isTrain ? "🚆" : "🚌"}
          </div>

          <div className="location-label">
            Current location
          </div>

        </div>

      </div>

      {state.error && (
        <ErrorState message={state.error.message} />
      )}

      {/* LIVE INFORMATION */}
      <div className="live-card">

        <div className="live-vehicle-row">

          <div
            className={
              "vehicle-badge " +
              (isTrain ? "train" : "bus")
            }
          >
            {isTrain ? "🚆" : "🚌"}
          </div>

          <div className="vehicle-info">

            <strong>
              {current.name ||
                current.number ||
                "Transport"}
            </strong>

            <span>
              {current.from || "--"} →{" "}
              {current.to || "--"}
            </span>

          </div>

        </div>

        <div className="live-stats">

          <InfoBox
            label="ETA"
            value={
              current.etaMin != null
                ? `${current.etaMin} min`
                : "--"
            }
          />

          <InfoBox
            label="Distance"
            value={
              current.distanceKm != null
                ? `${current.distanceKm} km`
                : "--"
            }
          />

          <InfoBox
            label="Speed"
            value={
              current.speed != null
                ? `${current.speed} km/h`
                : "--"
            }
          />

          <InfoBox
            label="Status"
            value={
              current.status || "Active"
            }
          />

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   ALERTS
========================================================= */

function AlertsScreen({
  alerts,
  loading,
  onOpenVehicle,
}) {
  return (
    <div className="fadein">

      <div className="page-intro">
        <div className="eyebrow">
          STAY UPDATED
        </div>

        <h2>Service alerts</h2>

        <p>
          Delays, service changes and live
          transport updates.
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : alerts.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No alerts"
          text="You're all clear for now."
        />
      ) : (
        alerts.map((alert) => (
          <article
            className={
              "alert-card " +
              (alert.priority || "normal")
            }
            key={alert.id}
            onClick={() =>
              alert.vehicle &&
              onOpenVehicle(alert.vehicle)
            }
          >

            <div className="alert-icon">
              {alert.priority === "urgent"
                ? "⚠️"
                : "🔔"}
            </div>

            <div className="alert-content">

              <div className="alert-title">
                {alert.title ||
                  alert.message ||
                  "Transport update"}
              </div>

              <p>
                {alert.text ||
                  alert.message ||
                  "New service information available."}
              </p>

              <small>
                {alert.time ||
                  alert.created_at ||
                  "Recently"}
              </small>

            </div>

          </article>
        ))
      )}

    </div>
  );
}


/* =========================================================
   PROFILE
========================================================= */

function ProfileScreen({
  user,
  googleDisabled,
  onGoogleLogin,
  logout,
  settings,
  updateSetting,
}) {
  useEffect(() => {
    if (
      googleDisabled ||
      !window.google
    ) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id:
        import.meta.env.VITE_GOOGLE_CLIENT_ID,

      callback: (response) =>
        onGoogleLogin(response.credential),
    });

    const node =
      document.getElementById("googleButton");

    if (node) {
      node.innerHTML = "";

      window.google.accounts.id.renderButton(
        node,
        {
          theme: "outline",
          size: "large",
          width: 280,
        }
      );
    }
  }, [googleDisabled, onGoogleLogin]);

  return (
    <div className="fadein">

      <div className="profile-header">

        <div className="avatar">
          {user?.picture ? (
            <img
              src={user.picture}
              alt=""
            />
          ) : (
            "GU"
          )}
        </div>

        <div>
          <div className="profile-name">
            {user?.name || "Guest User"}
          </div>

          <div className="profile-sub">
            {user?.email ||
              "Sign in to sync your TrackRide account"}
          </div>
        </div>

      </div>

      {!user ? (
        <div className="auth-card">

          <div className="section-heading">
            Your TrackRide account
          </div>

          <p>
            Sign in with Google to save routes,
            preferences and journeys.
          </p>

          <div
            id="googleButton"
            className="google-button"
          />

          {googleDisabled && (
            <small>
              Google sign-in will be enabled after
              VITE_GOOGLE_CLIENT_ID is configured.
            </small>
          )}

        </div>
      ) : (
        <button
          className="secondary-btn full"
          onClick={logout}
        >
          Sign out
        </button>
      )}

      <div className="section-heading">
        Preferences
      </div>

      <div className="settings-card">

        <SettingRow
          icon="🔔"
          title="Notifications"
          subtitle="Arrival and delay alerts"
          value={settings.notifications}
          onChange={(value) =>
            updateSetting(
              "notifications",
              value
            )
          }
        />

        <SettingRow
          icon="🔠"
          title="Larger text"
          subtitle="Accessibility mode"
          value={settings.largeText}
          onChange={(value) =>
            updateSetting(
              "largeText",
              value
            )
          }
        />

        <div className="setting-row">

          <span className="setting-icon">
            🌐
          </span>

          <div className="setting-info">
            <strong>Language</strong>
            <small>
              Choose your preferred language
            </small>
          </div>

          <select
            value={settings.language}
            onChange={(e) =>
              updateSetting(
                "language",
                e.target.value
              )
            }
          >
            <option>English</option>
            <option>हिन्दी</option>
            <option>বাংলা</option>
            <option>मराठी</option>
          </select>

        </div>

      </div>

      <div className="about-card">
        <strong>TrackRide</strong>

        <p>
          One place for buses, trains,
          routes and real-time transport
          information across India.
        </p>
      </div>

    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}) {
  return (
    <div className="setting-row">

      <span className="setting-icon">
        {icon}
      </span>

      <div className="setting-info">

        <strong>{title}</strong>

        <small>{subtitle}</small>

      </div>

      <button
        className={
          "switch " +
          (value ? "on" : "")
        }
        onClick={() => onChange(!value)}
      >
        <span />
      </button>

    </div>
  );
}


function InfoBox({ label, value }) {
  return (
    <div className="info-box">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}


function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      Loading transport data…
    </div>
  );
}


function EmptyState({
  icon,
  title,
  text,
}) {
  return (
    <div className="empty-state">

      <div className="empty-icon">
        {icon}
      </div>

      <strong>{title}</strong>

      <p>{text}</p>

    </div>
  );
}


function ErrorState({ message }) {
  return (
    <div className="error-state">
      ⚠️ {message}
    </div>
  );
}


export default App;
