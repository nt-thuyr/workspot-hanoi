import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/guest/HomePage";
import SearchPage from "./pages/guest/SearchPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import RegisterCafePage from "./pages/owner/RegisterCafePage";
import EditCafePage from "./pages/owner/EditCafePage";
import ReservationPage from "./pages/ReservationPage";
import ReservationHistoryPage from "./pages/guest/ReservationHistoryPage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/booking", element: <ReservationPage /> },
  { path: "/history", element: <ReservationHistoryPage /> },
  {
    path: "/cafes",
    children: [
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
