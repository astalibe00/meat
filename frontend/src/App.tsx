import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AdminGuard from "./components/AdminGuard";
import Navigation from "./components/Navigation";
import PageTransition from "./components/PageTransition";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import AdminCategories from "./pages/admin/Categories";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminProductEditor from "./pages/admin/ProductEditor";
import AdminProducts from "./pages/admin/Products";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import { useAppStore } from "./store/useAppStore";

function LaunchHandler() {
  const consumeStartParam = useAppStore((state) => state.consumeStartParam);
  const navigate = useNavigate();

  useEffect(() => {
    const startParam = consumeStartParam();
    if (!startParam) {
      return;
    }

    if (startParam === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    const match = /^product_(.+)$/.exec(startParam);
    if (match) {
      navigate(`/products/${match[1]}`, { replace: true });
    }
  }, [consumeStartParam, navigate]);

  return null;
}

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen pb-20">
      <LaunchHandler />
      <PageTransition>
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<Products />} path="/products" />
          <Route element={<ProductDetail />} path="/products/:id" />
          <Route element={<Cart />} path="/cart" />
          <Route element={<Checkout />} path="/checkout" />
          <Route element={<Orders />} path="/orders" />
          <Route element={<OrderTracking />} path="/orders/:id" />
          <Route element={<Profile />} path="/profile" />
          <Route element={<AdminGuard />} path="/admin">
            <Route element={<AdminDashboard />} index />
            <Route element={<AdminProducts />} path="products" />
            <Route element={<AdminProductEditor />} path="products/new" />
            <Route element={<AdminProductEditor />} path="products/:id" />
            <Route element={<AdminCategories />} path="categories" />
            <Route element={<AdminOrders />} path="orders" />
          </Route>
        </Routes>
      </PageTransition>
      {!isAdminRoute ? <Navigation /> : null}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
