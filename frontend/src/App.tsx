import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { CatalogPage } from "@/pages/CatalogPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AccountPage } from "@/pages/AccountPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { OrderSuccessPage } from "@/pages/OrderSuccessPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProductsPage } from "@/pages/admin/AdminProductsPage";
import { AdminProductFormPage } from "@/pages/admin/AdminProductFormPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { SplashIntro } from "@/components/layout/SplashIntro";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SplashIntro />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="katalog" element={<CatalogPage />} />
          <Route path="urun/:slug" element={<ProductDetailPage />} />
          <Route path="sepet" element={<CartPage />} />
          <Route path="odeme" element={<CheckoutPage />} />
          <Route path="siparis-onay/:orderNumber" element={<OrderSuccessPage />} />
          <Route path="giris" element={<LoginPage />} />
          <Route path="kayit" element={<RegisterPage />} />
          <Route path="hesabim" element={<AccountPage />} />
          <Route path="favoriler" element={<FavoritesPage />} />

          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="urunler" replace />} />
            <Route path="urunler" element={<AdminProductsPage />} />
            <Route path="urunler/yeni" element={<AdminProductFormPage />} />
            <Route path="urunler/:id" element={<AdminProductFormPage />} />
            <Route path="siparisler" element={<AdminOrdersPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
