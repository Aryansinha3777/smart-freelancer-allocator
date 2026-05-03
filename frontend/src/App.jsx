import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

// Lazy loaded — these are heavy dashboard pages, loaded only when visited
const ClientDashboard = lazy(() => import("./pages/ClientDashboard.jsx"));
const FreelancerDashboard = lazy(() => import("./pages/FreelancerDashboard.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));

const App = () => {
  return (
    <Router>
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/client-dashboard"
            element={
              <PrivateRoute roles={["client"]}>
                <ClientDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/freelancer-dashboard"
            element={
              <PrivateRoute roles={["freelancer"]}>
                <FreelancerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute roles={["admin"]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <div className="flex items-center justify-center min-h-screen text-slate-500">
                Access denied.
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;