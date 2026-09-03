# Real transit provider adapter

Replace `demoProvider.js` with adapters that implement the same functions:

- `searchRoutes({ from, to, type, date })`
- `getVehicles(type)`
- `getTracking(id)`
- `getAlerts()`

Recommended sources:
- GTFS static feeds for scheduled bus/rail routes where agencies publish them.
- GTFS-Realtime for vehicle positions, trip updates and alerts where agencies publish them.
- Authorized railway APIs/providers for Indian Railways schedule/running-status data.
- State/city transport feeds for local buses.

Keep provider credentials on the server. Never put secret API keys in `VITE_*` frontend variables.
