import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AdminGuard from "./components/AdminGuard";
import Navigation from "./components/Navigation";
import PageTransition from "./components/PageTransition";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Favorites from "./pages/Favorites";
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
import Support from "./pages/Support";
import Wholesale from "./pages/Wholesale";
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

    if (startParam === "home") {
      navigate("/", { replace: true });
      return;
    }

    if (startParam === "catalog") {
      navigate("/products", { replace: true });
      return;
    }

    if (startParam === "cart") {
      navigate("/cart", { replace: true });
      return;
    }

    if (startParam === "orders") {
      navigate("/orders", { replace: true });
      return;
    }

    if (startParam === "profile") {
      navigate("/profile", { replace: true });
      return;
    }

    if (startParam === "support") {
      navigate("/support", { replace: true });
      return;
    }

    if (startParam === "favorites") {
      navigate("/favorites", { replace: true });
      return;
    }

    if (startParam === "wholesale") {
      navigate("/wholesale", { replace: true });
      return;
    }

    const match = /^product_(.+)$/.exec(startParam);
    if (match) {
      navigate(`/products/${match[1]}`, { replace: true });
      return;
    }

    const orderMatch = /^order_(.+)$/.exec(startParam);
    if (orderMatch) {
      navigate(`/orders/${orderMatch[1]}`, { replace: true });
    }
  }, [consumeStartParam, navigate]);

  return null;
}

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen pb-24">
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
          <Route element={<Favorites />} path="/favorites" />
          <Route element={<Support />} path="/support" />
          <Route element={<Wholesale />} path="/wholesale" />
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
