import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppHeader } from "@/components/layout/AppHeader";
import { EditorPage } from "@/pages/EditorPage";
import { ReaderPage } from "@/pages/ReaderPage";

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <Routes>
            <Route path="/" element={<ReaderPage />} />
            <Route path="/chapter/:slug" element={<ReaderPage />} />
            <Route path="/edit" element={<EditorPage />} />
            <Route path="/edit/:slug" element={<EditorPage />} />
          </Routes>
        </div>
      </TooltipProvider>
    </BrowserRouter>
  );
}
