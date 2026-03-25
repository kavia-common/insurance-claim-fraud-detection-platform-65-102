import React from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import DashboardPage from "./pages/DashboardPage";
import QueuePage from "./pages/QueuePage";
import { getApiBaseUrl } from "./api/client";

/**
 * PUBLIC_INTERFACE
 * Root application component with Ocean Professional dashboard shell.
 */
function App() {
  const apiBase = getApiBaseUrl();

  return (
    <BrowserRouter>
      <div className="AppShell">
        <aside className="Sidebar" aria-label="Sidebar navigation">
          <div className="Brand">
            <div className="BrandMark" aria-hidden="true" />
            <div className="BrandTitle">
              <strong>ClaimGuard</strong>
              <span>Ocean Professional</span>
            </div>
          </div>

          <nav className="SidebarNav" aria-label="Primary">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "NavItem NavItemActive" : "NavItem")}
            >
              <span className="NavLeft">
                <span className="NavIcon" aria-hidden="true">
                  D
                </span>
                Dashboard
              </span>
              <span className="NavBadge">Live</span>
            </NavLink>

            <NavLink
              to="/queue"
              className={({ isActive }) => (isActive ? "NavItem NavItemActive" : "NavItem")}
            >
              <span className="NavLeft">
                <span className="NavIcon" aria-hidden="true">
                  Q
                </span>
                High-risk queue
              </span>
            </NavLink>
          </nav>

          <div className="SidebarFooter">
            <div>
              Backend: <span className="Mono">{apiBase}</span>
            </div>
            <div>
              Tip: Press <kbd>Esc</kbd> to close modals
            </div>
          </div>
        </aside>

        <main className="Main">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route
              path="*"
              element={
                <div className="Card">
                  <div className="CardHeader">
                    <div>
                      <div className="CardTitle">Not found</div>
                      <div className="CardSub">The page you requested does not exist.</div>
                    </div>
                  </div>
                  <NavLink to="/" className="Btn BtnPrimary" style={{ display: "inline-flex", width: "fit-content" }}>
                    Go to dashboard
                  </NavLink>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
