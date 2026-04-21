import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { LoginPage } from "../features/auth/LoginPage";
import { getToken } from "../lib/api";

function ProtectedRoute() {
  return getToken() ? <DashboardPage /> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <ProtectedRoute /> },
  { path: "/login", element: <LoginPage /> }
]);
