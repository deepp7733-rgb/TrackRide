import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { useAsync, useLiveTracking, useSearch } from "./hooks";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";

const NAV = [
  { id: "home", icon: "⌂", label: "Home" },
  { id: "search", icon: "⌕", label: "Search" },
  { id: "tickets", icon: "🎫", label: "Tickets" },
  { id: "more", icon: "•••", label: "More" },
];

function App() {
  const [showSplash, setShowSplash] = useState(
    () => localStorage.getItem("trackride_started") !== "yes"
  );

  const [tab, setTab] = useState("home");

  const [mode, setMode] = useState("both");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [journey, setJourney] = useState(null);

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

  const vehicles =
    vehiclesState.data?.vehicles ||
    vehiclesState.data ||
    [];

  const results =
    searchState.data?.results ||
    [];

  const alerts =
    alertsState.data?.alerts ||
    alertsState.data ||
    [];

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
    }
  }, [user]);

  function startApp() {
    localStorage.setItem("trackride_started", "yes");
    setShowSplash(false);
  }

  function updateSetting(key, value) {
    setSettings((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function openVehicle(vehicle) {
    setSelectedVehicle(vehicle);
    setTab("home");
    setJourney({
      type: "live",
      vehicle,
    });
  }

  function searchJourneys() {
    setTab("search");
  }

  function openJourney(result) {
    setJourney({
      type: result.type || "train",
      result,
    });
  }

  function closeJourney() {
    setJourney(null);
  }

  function goTab(id) {
    setJourney(null);

    if (id === "tickets") {
      setTab("tickets");
      return;
    }

    if (id === "more") {
      setTab("more");
      return;
    }

    setTab(id);
  }

  if (showSplash) {
    return <SplashScreen onStart={startApp} />;
  }

  if (journey) {
    if (journey.type === "live") {
      return (
        <LiveTracking
          vehicle={
            liveState.data?.vehicle ||
            journey.vehicle
          }
          state={liveState}
          onBack={closeJourney}
        />
      );
    }

    return (
      <JourneyDetails
        result={journey.result}
        onBack={closeJourney}
        onLive={() => {
          if (journey.result?.vehicle) {
            openVehicle(journey.result.vehicle);
          }
        }}
      />
    );
  }

  return (
    <div className="app-page">
      <div className="app-container">

        <Header
          user={user}
          onProfile={() => setTab("more")}
        />

        <main className="screen-content">

          {tab === "home" && (
            <Home
              user={user}
              from={from}
              to={to}
              date={date}
              mode={mode}
              setFrom={setFrom}
              setTo={setTo}
              setDate={setDate}
              setMode={setMode}
              onSearch={searchJourneys}
              vehicles={vehicles}
              onOpenVehicle={openVehicle}
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
              onSearch={searchJourneys}
              state={searchState}
              results={results}
              onOpen={openJourney}
            />
          )}

          {tab === "tickets" && (
            <TicketsScreen />
          )}

          {tab === "more" && (
            <MoreScreen
              user={user}
              settings={settings}
              updateSetting={updateSetting}
              onLogout={() => {
                localStorage.removeItem(
                  "trackride_user"
                );
                setUser(null);
              }}
            />
          )}

        </main>

        <BottomNav
          tab={tab}
          onChange={goTab}
        />

      </div>
    </div>
  );
}


/* =====================================================
   SPLASH
===================================================== */

function SplashScreen({ onStart }) {
  return (
    <div className="splash">

      <div className="splash-overlay">

        <div className="logo-circle">
          🚆
        </div>

        <h1>TrackRide</h1>

        <p className="splash-sub">
          Trains. Buses. Beyond.
        </p>

        <div className="splash-route">
          Different routes.
          <br />
          Same destination.
        </div>

        <button
          className="blue-button splash-button"
          onClick={onStart}
        >
          Get Started →
        </button>

        <p className="splash-bottom">
          Travel smarter. Go further.
        </p>

      </div>

    </div>
  );
}


/* =====================================================
   HEADER
===================================================== */

function Header({ user, onProfile }) {
  return (
    <header className="header">

      <div>
        <div className="greeting">
          Good Evening,
        </div>

        <div className="username">
          {user?.name || "Traveller"}
        </div>
      </div>

      <div className="header-actions">

        <button className="round-icon">
          ♧
        </button>

        <button
          className="profile-avatar"
          onClick={onProfile}
        >
          {user?.picture ? (
            <img
              src={user.picture}
              alt=""
            />
          ) : (
            "GU"
          )}
        </button>

      </div>

    </header>
  );
}


/* =====================================================
   HOME
===================================================== */

function Home({
  user,
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
}) {
  return (
    <div className="fade-in">

      <section className="home-heading">

        <div className="eyebrow">
          YOUR JOURNEY STARTS HERE
        </div>

        <h2>
          Where do you
          <br />
          want to go?
        </h2>

      </section>

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

      <section>

        <div className="section-header">
          <h3>Quick Actions</h3>
        </div>

        <div className="quick-grid">

          <QuickAction
            icon="📍"
            title="Live Tracking"
            onClick={() => {
              if (vehicles[0]) {
                onOpenVehicle(vehicles[0]);
              }
            }}
          />

          <QuickAction
            icon="🎫"
            title="PNR / Ticket"
          />

          <QuickAction
            icon="◷"
            title="Timetables"
          />

          <QuickAction
            icon="📍"
            title="Nearby Stations"
          />

        </div>

      </section>

      <ExploreCard />

      <RecentSearches />

    </div>
  );
}


/* =====================================================
   SEARCH CARD
===================================================== */

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

      <div className="transport-tabs">

        <button
          className={
            mode === "both" ? "active" : ""
          }
          onClick={() => setMode("both")}
        >
          All
        </button>

        <button
          className={
            mode === "train" ? "active" : ""
          }
          onClick={() => setMode("train")}
        >
          🚆 Trains
        </button>

        <button
          className={
            mode === "bus" ? "active" : ""
          }
          onClick={() => setMode("bus")}
        >
          🚌 Buses
        </button>

      </div>

      <div className="location-input">

        <span className="location-dot blue">
          ●
        </span>

        <div>
          <label>FROM</label>

          <input
            value={from}
            onChange={(e) =>
              setFrom(e.target.value)
            }
            placeholder="Enter source"
          />
        </div>

      </div>

      <button
        className="swap-button"
        onClick={() => {
          setFrom(to);
          setTo(from);
        }}
      >
        ↕
      </button>

      <div className="location-input">

        <span className="location-dot dark">
          ●
        </span>

        <div>
          <label>TO</label>

          <input
            value={to}
            onChange={(e) =>
              setTo(e.target.value)
            }
            placeholder="Enter destination"
          />
        </div>

      </div>

      <div className="date-input">

        <span>▣</span>

        <input
          type="date"
          value={date}
          onChange={(e) =>
            setDate(e.target.value)
          }
        />

      </div>

      <button
        className="blue-button search-button"
        onClick={onSearch}
      >
        Search Journeys →
      </button>

    </div>
  );
}


/* =====================================================
   QUICK ACTION
===================================================== */

function QuickAction({
  icon,
  title,
  onClick,
}) {
  return (
    <button
      className="quick-action"
      onClick={onClick}
    >
      <span className="quick-icon">
        {icon}
      </span>

      <span>{title}</span>
    </button>
  );
}


/* =====================================================
   EXPLORE
===================================================== */

function ExploreCard() {
  return (
    <section className="explore-section">

      <div className="section-header">
        <h3>Explore India</h3>
      </div>

      <div className="explore-card">

        <div className="explore-overlay">

          <strong>
            One journey at a time.
          </strong>

          <span>
            Discover cities, routes and
            new places.
          </span>

        </div>

      </div>

    </section>
  );
}


/* =====================================================
   RECENT SEARCHES
===================================================== */

function RecentSearches() {
  const searches = [
    ["Kolkata", "Dhanbad"],
    ["Howrah", "Asansol"],
    ["Delhi", "Jaipur"],
  ];

  return (
    <section className="recent-section">

      <div className="section-header">
        <h3>Recent Searches</h3>
        <button>Clear</button>
      </div>

      <div className="recent-list">

        {searches.map(
          ([a, b], index) => (
            <div
              className="recent-item"
              key={index}
            >
              <span>↔</span>

              <div>
                <strong>
                  {a} → {b}
                </strong>

                <small>
                  Search again
                </small>
              </div>

              <span>›</span>
            </div>
          )
        )}

      </div>

    </section>
  );
}


/* =====================================================
   SEARCH RESULTS
===================================================== */

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
  onOpen,
}) {
  return (
    <div className="fade-in">

      <div className="results-top">

        <button
          className="back-small"
          onClick={() => window.history.back()}
        >
          ←
        </button>

        <div>

          <strong>
            {from || "Source"} →{" "}
            {to || "Destination"}
          </strong>

          <small>
            {date || "Today"}
          </small>

        </div>

      </div>

      <div className="transport-tabs result-tabs">

        <button
          className={
            mode === "both" ? "active" : ""
          }
          onClick={() => setMode("both")}
        >
          All
        </button>

        <button
          className={
            mode === "train" ? "active" : ""
          }
          onClick={() => setMode("train")}
        >
          🚆 Trains
        </button>

        <button
          className={
            mode === "bus" ? "active" : ""
          }
          onClick={() => setMode("bus")}
        >
          🚌 Buses
        </button>

      </div>

      <div className="filter-row">

        <button>Sort ▾</button>
        <button>Departure</button>
        <button>Duration</button>
        <button>Price</button>

      </div>

      {state.loading && (
        <Loading text="Finding the best routes..." />
      )}

      {state.error && (
        <div className="error-box">
          Something went wrong.
          <br />
          {state.error.message}
        </div>
      )}

      {!state.loading &&
        !state.error &&
        results.length > 0 && (
          <div className="journey-list">

            {results.map((result) => (
              <JourneyCard
                key={result.id}
                result={result}
                onOpen={onOpen}
              />
            ))}

          </div>
        )}

      {!state.loading &&
        !state.error &&
        from &&
        to &&
        results.length === 0 && (
          <Empty
            title="No journeys found"
            text="Try changing your destination or travel date."
          />
        )}

    </div>
  );
}


/* =====================================================
   JOURNEY CARD
===================================================== */

function JourneyCard({
  result,
  onOpen,
}) {
  const isTrain =
    result.type === "train";

  return (
    <article
      className={
        "journey-card " +
        (isTrain ? "train-card" : "bus-card")
      }
      onClick={() => onOpen(result)}
    >

      <div className="journey-head">

        <div className="transport-label">

          <span>
            {isTrain ? "🚆" : "🚌"}
          </span>

          <strong>
            {result.name ||
              result.number ||
              (isTrain
                ? "Train Service"
                : "Bus Service")}
          </strong>

        </div>

        <span className="on-time">
          {result.status ||
            "ON TIME"}
        </span>

      </div>

      <div className="journey-times">

        <div>
          <strong>
            {result.departure || "--"}
          </strong>

          <small>
            {result.from || "Source"}
          </small>
        </div>

        <div className="journey-duration">

          <span>
            ─────────
          </span>

          <small>
            {result.duration
              ? `${result.duration} min`
              : ""}
          </small>

        </div>

        <div className="right-align">

          <strong>
            {result.arrival || "--"}
          </strong>

          <small>
            {result.to || "Destination"}
          </small>

        </div>

      </div>

      <div className="journey-footer">

        <span>
          {isTrain
            ? "Train"
            : "Bus"}
        </span>

        <span>
          View details →
        </span>

      </div>

    </article>
  );
}


/* =====================================================
   JOURNEY DETAILS
===================================================== */

function JourneyDetails({
  result,
  onBack,
  onLive,
}) {
  const isTrain =
    result.type === "train";

  const stops =
    result.stops ||
    (isTrain
      ? [
          ["16:50", "Howrah (HWH)", "Start"],
          ["17:32", "Bardhaman (BWN)", "2m"],
          ["19:20", "Durgapur (DGR)", "3m"],
          ["21:10", "Asansol (ASN)", "5m"],
          ["01:15", "Dhanbad (DHN)", "End"],
        ]
      : [
          ["18:15", "Esplanade", "Start"],
          ["19:00", "Ultadanga", "5m"],
          ["21:30", "Bardhaman", "10m"],
          ["00:15", "Durgapur", "5m"],
          ["03:00", "Asansol", "5m"],
          ["06:30", "Dhanbad Bus Stand", "End"],
        ]);

  return (
    <div className="details-page">

      <div className="details-header">

        <button
          className="back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <small>
            {isTrain ? "TRAIN" : "BUS"}
          </small>

          <h2>
            {result.name ||
              result.number ||
              (isTrain
                ? "Train"
                : "Bus")}
          </h2>

          <p>
            {result.from} → {result.to}
          </p>
        </div>

        <span className="live-status">
          ON TIME
        </span>

      </div>

      <div className="details-tabs">

        <button className="active">
          {isTrain ? "Schedule" : "Stops"}
        </button>

        <button>
          {isTrain
            ? "Coach"
            : "Amenities"}
        </button>

        <button>Info</button>

      </div>

      <div className="timeline">

        {stops.map(
          ([time, place, label], index) => (
            <div
              className="timeline-row"
              key={index}
            >

              <div className="timeline-time">
                {time}
              </div>

              <div className="timeline-line">

                <span
                  className={
                    "timeline-dot " +
                    (index === 0 ||
                    index === stops.length - 1
                      ? "main"
                      : "")
                  }
                />

              </div>

              <div className="timeline-place">

                <strong>
                  {place}
                </strong>

                <small>
                  {label}
                </small>

              </div>

            </div>
          )
        )}

      </div>

      <div className="detail-actions">

        <button>
          🔔
          <span>Set Alert</span>
        </button>

        <button>
          ↗
          <span>Share</span>
        </button>

        <button>
          ☆
          <span>Save</span>
        </button>

      </div>

      {result.vehicle && (
        <button
          className="blue-button full-button"
          onClick={onLive}
        >
          Track Live
        </button>
      )}

      <button className="blue-button full-button">
        {isTrain
          ? "Check Availability"
          : "Book / Check Availability"}
      </button>

    </div>
  );
}


/* =====================================================
   LIVE TRACKING
===================================================== */

function LiveTracking({
  vehicle,
  state,
  onBack,
}) {
  const isTrain =
    vehicle?.type === "train";

  const lat =
    vehicle?.latitude ??
    22.5726;

  const lng =
    vehicle?.longitude ??
    88.3639;

  return (
    <div className="live-page">

      <div className="live-top">

        <button
          className="back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <small>LIVE TRACKING</small>

          <h2>
            {isTrain ? "Train" : "Bus"}
          </h2>

          <p>
            {vehicle?.name ||
              vehicle?.number ||
              "Transport"}
          </p>
        </div>

        <span className="live-badge">
          ● LIVE
        </span>

      </div>

      <div className="live-transport-tabs">

        <button
          className={isTrain ? "active" : ""}
        >
          🚆 Train
        </button>

        <button
          className={!isTrain ? "active" : ""}
        >
          🚌 Bus
        </button>

      </div>

      <MapView
        latitude={lat}
        longitude={lng}
        vehicle={vehicle}
      />

      <div className="live-sheet">

        <div className="sheet-handle" />

        <div className="sheet-tabs">
          <button className="active">
            Live Location
          </button>

          <button>
            Route
          </button>

          <button>
            Alerts
          </button>
        </div>

        <div className="live-title">

          <div
            className={
              "large-transport-icon " +
              (isTrain ? "train" : "bus")
            }
          >
            {isTrain ? "🚆" : "🚌"}
          </div>

          <div>

            <strong>
              {vehicle?.name ||
                vehicle?.number ||
                "Transport"}
            </strong>

            <span>
              {vehicle?.status ||
                "Live data unavailable"}
            </span>

          </div>

        </div>

        <div className="live-info-grid">

          <Info
            label="Speed"
            value={
              vehicle?.speed != null
                ? `${vehicle.speed} km/h`
                : "--"
            }
          />

          <Info
            label="ETA"
            value={
              vehicle?.etaMin != null
                ? `${vehicle.etaMin} min`
                : "--"
            }
          />

          <Info
            label="Next Stop"
            value={
              vehicle?.nextStop || "--"
            }
          />

          <Info
            label="Updated"
            value={
              vehicle?.updatedAt
                ? "Recently"
                : "--"
            }
          />

        </div>

        {state.error && (
          <div className="error-box">
            Live data unavailable.
          </div>
        )}

      </div>

    </div>
  );
}


/* =====================================================
   MAP
===================================================== */

function MapView({
  latitude,
  longitude,
  vehicle,
}) {
  const position = [
    latitude,
    longitude,
  ];

  const route = [
    [
      latitude - 0.15,
      longitude - 0.25,
    ],
    [
      latitude - 0.05,
      longitude - 0.08,
    ],
    position,
    [
      latitude + 0.10,
      longitude + 0.12,
    ],
    [
      latitude + 0.18,
      longitude + 0.25,
    ],
  ];

  return (
    <div className="map-container">

      <MapContainer
        center={position}
        zoom={8}
        scrollWheelZoom={false}
        className="real-map"
      >

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={route}
        />

        <Marker position={position}>
          <Popup>
            {vehicle?.name ||
              "Current vehicle"}
          </Popup>
        </Marker>

      </MapContainer>

    </div>
  );
}


/* =====================================================
   TIMETABLE / TICKETS
===================================================== */

function TicketsScreen() {
  return (
    <div className="fade-in">

      <div className="page-heading">
        <div className="eyebrow">
          YOUR JOURNEYS
        </div>

        <h2>Tickets</h2>

        <p>
          Your bookings and ticket information
          will appear here.
        </p>
      </div>

      <div className="empty-card">

        <div className="empty-large-icon">
          🎫
        </div>

        <h3>No tickets yet</h3>

        <p>
          Book a journey and your tickets
          will appear here.
        </p>

        <button className="blue-button">
          Find a Journey
        </button>

      </div>

      <div className="feature-list">

        <FeatureRow
          icon="🎫"
          title="PNR / Ticket Status"
        />

        <FeatureRow
          icon="🧾"
          title="Booking History"
        />

        <FeatureRow
          icon="💳"
          title="Saved Payments"
        />

      </div>

    </div>
  );
}


/* =====================================================
   MORE
===================================================== */

function MoreScreen({
  user,
  settings,
  updateSetting,
  onLogout,
}) {
  return (
    <div className="fade-in">

      <div className="profile-card">

        <div className="profile-avatar large">
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
          <h2>
            {user?.name ||
              "Guest User"}
          </h2>

          <p>
            {user?.email ||
              "Not signed in"}
          </p>
        </div>

      </div>

      <div className="section-heading">
        My TrackRide
      </div>

      <div className="menu-card">

        <FeatureRow
          icon="🎫"
          title="My Bookings"
        />

        <FeatureRow
          icon="🧾"
          title="PNR / Ticket Status"
        />

        <FeatureRow
          icon="📍"
          title="Live Tracking"
        />

        <FeatureRow
          icon="★"
          title="Saved Journeys"
        />

        <FeatureRow
          icon="◷"
          title="Timetables"
        />

        <FeatureRow
          icon="📍"
          title="Nearby Stations & Bus Stops"
        />

        <FeatureRow
          icon="₹"
          title="Fare Enquiry"
        />

        <FeatureRow
          icon="🔔"
          title="Travel Alerts"
        />

      </div>

      <div className="section-heading">
        Settings
      </div>

      <div className="menu-card">

        <SettingRow
          icon="🔔"
          title="Notifications"
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
          title="Accessibility"
          value={settings.largeText}
          onChange={(value) =>
            updateSetting(
              "largeText",
              value
            )
          }
        />

        <FeatureRow
          icon="🌐"
          title="Language"
          right={settings.language}
        />

        <FeatureRow
          icon="❓"
          title="Help & Support"
        />

      </div>

      {user && (
        <button
          className="logout-button"
          onClick={onLogout}
        >
          Sign Out
        </button>
      )}

    </div>
  );
}


/* =====================================================
   COMPONENTS
===================================================== */

function BottomNav({
  tab,
  onChange,
}) {
  return (
    <nav className="bottom-navigation">

      {NAV.map((item) => (
        <button
          key={item.id}
          className={
            tab === item.id
              ? "active"
              : ""
          }
          onClick={() =>
            onChange(item.id)
          }
        >

          <span className="nav-icon">
            {item.icon}
          </span>

          <span>
            {item.label}
          </span>

        </button>
      ))}

    </nav>
  );
}


function FeatureRow({
  icon,
  title,
  right = "›",
}) {
  return (
    <div className="feature-row">

      <span className="feature-icon">
        {icon}
      </span>

      <strong>{title}</strong>

      <span className="feature-right">
        {right}
      </span>

    </div>
  );
}


function SettingRow({
  icon,
  title,
  value,
  onChange,
}) {
  return (
    <div className="feature-row">

      <span className="feature-icon">
        {icon}
      </span>

      <strong>{title}</strong>

      <button
        className={
          "toggle " +
          (value ? "on" : "")
        }
        onClick={() =>
          onChange(!value)
        }
      >
        <span />
      </button>

    </div>
  );
}


function Info({
  label,
  value,
}) {
  return (
    <div className="info">

      <small>{label}</small>

      <strong>{value}</strong>

    </div>
  );
}


function Loading({ text }) {
  return (
    <div className="loading-box">

      <div className="spinner" />

      <span>
        {text || "Loading..."}
      </span>

    </div>
  );
}


function Empty({
  title,
  text,
}) {
  return (
    <div className="empty-card">

      <div className="empty-large-icon">
        🔎
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

    </div>
  );
}


export default App;
