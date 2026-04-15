import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';
import Navigation from './components/Navigation';
import PageTransition from './components/PageTransition';

function App() {
  return (
    <BrowserRouter>
      <div className="pb-20 min-h-screen">
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderTracking />} />
          </Routes>
        </PageTransition>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}

export default App;
