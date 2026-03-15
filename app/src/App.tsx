import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppHeader } from "@/components/layout/AppHeader";
import { EditorPage } from "@/pages/EditorPage";
import { ReaderPage } from "@/pages/ReaderPage";

const isDevMode = import.meta.env.VITE_DEV_MODE === "true";

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <Routes>
            <Route path="/" element={<ReaderPage />} />
            <Route path="/chapter/:slug" element={<ReaderPage />} />
            <Route
              path="/edit"
              element={isDevMode ? <EditorPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/edit/:slug"
              element={isDevMode ? <EditorPage /> : <Navigate to="/" replace />}
            />
          </Routes>
        </div>
      </TooltipProvider>
    </BrowserRouter>
  );
}
