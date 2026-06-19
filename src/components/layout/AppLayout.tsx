import { HashRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { Home as HomeIcon, BookOpen, BookMarked, Newspaper } from "lucide-react";
import NavLinkItem from "./NavLinkItem";
import HomePage from "@/pages/HomePage";
import PracticeListPage from "@/pages/PracticeListPage";
import MistakesPage from "@/pages/MistakesPage";
import MistakesReviewPage from "@/pages/MistakesReviewPage";
import PracticeDetailPage from "@/pages/PracticeDetailPage";
import AnalysisPage from "@/pages/AnalysisPage";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-paper-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary-100/60 shadow-soft">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-serif text-lg font-bold text-primary-800 tracking-tight">
                  媒体倾向识别练习器
                </h1>
                <p className="text-xs text-primary-400 -mt-0.5">
                  Media Tendency Analysis Trainer
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              <NavLinkItem to="/" icon={<HomeIcon className="w-4 h-4" />}>
                首页
              </NavLinkItem>
              <NavLinkItem to="/practice" icon={<BookOpen className="w-4 h-4" />}>
                案例练习
              </NavLinkItem>
              <NavLinkItem to="/mistakes" icon={<BookMarked className="w-4 h-4" />}>
                错题本
              </NavLinkItem>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-primary-100/60 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-primary-500">
              <span>© 2025 媒体倾向识别练习器</span>
              <span className="text-primary-300">|</span>
              <span>面向新闻传播专业的实训工具</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-primary-400">
              <span>基于 React + TypeScript + Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AppLayout() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="practice" element={<PracticeListPage />} />
          <Route path="practice/:id" element={<PracticeDetailPage />} />
          <Route path="analysis/:id" element={<AnalysisPage />} />
          <Route path="mistakes" element={<MistakesPage />} />
          <Route path="mistakes/review/:type" element={<MistakesReviewPage />} />
          <Route path="*" element={<div className="text-center text-primary-500 py-20">404 页面未找到</div>} />
        </Route>
      </Routes>
    </Router>
  );
}
