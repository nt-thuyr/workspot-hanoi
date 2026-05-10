import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import CafeEditPage from "./pages/CafeEditPage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/cafes/edit", element: <CafeEditPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
