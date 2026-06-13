import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/guest/HomePage";
import SearchPage from "./pages/guest/SearchPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import RegisterCafePage from "./pages/owner/RegisterCafePage";
import EditCafePage from "./pages/owner/EditCafePage";
import OwnerCafeListPage from "./pages/owner/OwnerCafeListPage";
import OwnerDashboardPage from "./pages/owner/OwnerDashboardPage";
import ReservationPage from "./pages/ReservationPage";
import ReservationHistoryPage from "./pages/guest/ReservationHistoryPage";
import ReviewPage from "./pages/guest/ReviewPage";
import ReviewHistoryPage from "./pages/guest/ReviewHistoryPage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/booking", element: <ReservationPage /> },
  { path: "/history", element: <ReservationHistoryPage /> },
  { path: "/reviews", element: <ReviewPage /> },
  { path: "/my-reviews", element: <ReviewHistoryPage /> },
  { path: "/dashboard", element: <OwnerDashboardPage /> },
  {
    path: "/cafes",
    children: [
      { index: true, element: <OwnerCafeListPage /> },
      { path: "edit", element: <EditCafePage /> },
      { path: "edit/:id", element: <EditCafePage /> },
      { path: "register", element: <RegisterCafePage /> },
    ],
  },
]);

function App() {
  return (
    <>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: "var(--color-surface, rgba(255, 255, 255, 0.9))",
            color: "var(--color-text-main, #1a1a1a)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--color-surface-border, rgba(255, 255, 255, 0.4))",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            borderRadius: "16px",
            fontFamily: "var(--font-body, 'Inter', sans-serif)",
            fontWeight: 500,
            padding: "16px 24px",
          },
          success: {
            iconTheme: {
              primary: "var(--color-gold, #e2a65d)",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
