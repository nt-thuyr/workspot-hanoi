import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/guest/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import RegisterCafePage from "./pages/owner/RegisterCafePage";
import EditCafePage from "./pages/owner/EditCafePage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/login", element: <LoginPage />},
  {
    path: "/cafes",
    children: [
      { path: "edit", element: <EditCafePage /> },
      { path: "register", element: <RegisterCafePage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
