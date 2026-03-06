import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import SearchResultsPage from "@/pages/SearchResultsPage";
import ProductDatasheetPage from "@/pages/ProductDatasheetPage";
import DatasheetPrintPage from "@/pages/DatasheetPrintPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminProductDetailPage from "@/pages/AdminProductDetailPage";
import AdminBulkImportPage from "@/pages/AdminBulkImportPage";

function App() {
  return (
    <div className="App min-h-screen bg-[#0A0A0A]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/product/:id" element={<ProductDatasheetPage />} />
          <Route path="/datasheet/:id" element={<DatasheetPrintPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/product/:id" element={<AdminProductDetailPage />} />
          <Route path="/admin/import" element={<AdminBulkImportPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
