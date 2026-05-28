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
      <Toaster position="top-right" />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
