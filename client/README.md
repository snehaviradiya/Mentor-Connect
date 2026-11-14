# Mentor Connect — Web Client

The client is a React application built with Vite. In development, Vite proxies `/api` requests to `http://localhost:5000`; start the backend before using account, discovery, booking, dashboard, or session features.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). To create a production build:

```bash
npm run build
npm run preview
```

## Checks

```bash
npm test
npm run lint
```

The client tests use local fixtures to isolate component behavior. The running application fetches the mentor directory and availability from the backend; it does not silently substitute mock records on API failures.

Authentication tokens and the current user are stored in `sessionStorage` to survive page refreshes in the current browser session. Signing out clears those values.
