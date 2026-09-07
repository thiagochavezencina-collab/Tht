import React, { useState } from 'react';
import {
  Menu,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Star,
  ArrowLeft,
  RotateCw,
  MoreHorizontal,
  Layers,
} from 'lucide-react';

interface PearsonViewProps {
  onExit: () => void;
  onOpenTabSwitcher?: () => void;
}

export const PearsonView: React.FC<PearsonViewProps> = ({ onExit, onOpenTabSwitcher }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'links'>('products');
  const [productFilter, setProductFilter] = useState<'active' | 'hidden' | 'expired'>('active');
  const [favouritesOpen, setFavouritesOpen] = useState(true);
  const [bigEnglishOpen, setBigEnglishOpen] = useState(false);
  const [goldExperienceOpen, setGoldExperienceOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#f3f4f6] text-[#222222] flex flex-col font-sans select-none pb-16"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
    >
      {/* iOS Top Status Bar (Authentic 7:30 / 4G / 95%) */}
      <div className="bg-white px-5 pt-2 pb-1 flex items-center justify-between text-xs text-black border-b border-[#e1e4e8]">
        <span className="font-semibold text-sm">7:30</span>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-[11px]">4G</span>
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-1 bg-black"></span>
            <span className="w-0.5 h-1.5 bg-black"></span>
            <span className="w-0.5 h-2 bg-black"></span>
            <span className="w-0.5 h-2.5 bg-black"></span>
          </div>
          <div className="flex items-center gap-0.5 ml-1">
            <span className="text-[11px]">95%</span>
            <div className="w-5 h-2.5 border border-black rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-black"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Pearson Portal Header (Exact replica of IMG_5831) */}
      <header className="bg-white px-5 py-3 flex items-center justify-between border-b border-[#e2e5e9] sticky top-0 z-30">
        <div className="flex items-center gap-1.5">
          <span className="text-[#002855] font-black text-2xl tracking-tighter">))</span>
          <span className="text-[#002855] font-bold text-2xl tracking-tight">Pearson</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-[#222222] hover:bg-slate-100 rounded"
          >
            <Menu className="w-6 h-6" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#d2d6dc] shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 font-bold text-slate-800">
                INNOVA PEI - Student
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenTabSwitcher?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 text-[#002855] font-semibold"
              >
                Pestañas de Safari
              </button>
              <button
                onClick={onExit}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-700 font-bold border-t border-slate-100"
              >
                Cerrar sesión (CineStream)
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Banner: INNOVA Schools - PERU */}
      <div className="bg-[#0b1320] text-white p-6 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
            INNOVA Schools - PERU
          </h1>
          <p className="text-sm text-slate-300 font-normal">Hello again!</p>
        </div>
      </div>

      {/* Navigation Tabs: Products / Links */}
      <div className="bg-white border-b border-[#e2e5e9] px-6 flex items-center gap-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3.5 border-b-4 transition-all ${
            activeTab === 'products'
              ? 'border-[#a01a7d] text-[#111111] font-bold'
              : 'border-transparent text-slate-500'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className="py-3.5 border-b-4 border-transparent text-slate-500 flex items-center gap-1"
        >
          <span>Links</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto w-full">
        {/* Section: Tools */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#222222]">Tools</h2>
          <div className="bg-white rounded-md p-4 border border-[#e2e5e9] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#fce7f3] flex items-center justify-center text-xl text-[#9d174d]">
                🎓
              </div>
              <span className="font-bold text-[#222222] text-sm">MyEnglishLab</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </div>
        </section>

        {/* Section: Products with Filters */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#222222]">Products</h2>
            <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d2d6dc] bg-white text-xs font-semibold text-[#444444]">
              <span>Filter</span>
              <span>⊶</span>
            </button>
          </div>

          {/* Filter pills: Active / Hidden / Expired */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProductFilter('active')}
              className={`px-4 py-1 rounded-full text-xs font-bold ${
                productFilter === 'active'
                  ? 'bg-[#fce7f3] text-[#831843]'
                  : 'bg-[#e5e7eb] text-[#555555]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setProductFilter('hidden')}
              className={`px-4 py-1 rounded-full text-xs font-bold ${
                productFilter === 'hidden'
                  ? 'bg-[#fce7f3] text-[#831843]'
                  : 'bg-[#e5e7eb] text-[#555555]'
              }`}
            >
              Hidden
            </button>
            <button
              onClick={() => setProductFilter('expired')}
              className={`px-4 py-1 rounded-full text-xs font-bold ${
                productFilter === 'expired'
                  ? 'bg-[#fce7f3] text-[#831843]'
                  : 'bg-[#e5e7eb] text-[#555555]'
              }`}
            >
              Expired
            </button>
          </div>

          {/* Accordion: Favourites (IMG_5831) */}
          <div className="bg-white border border-[#e2e5e9] rounded-md shadow-2xs overflow-hidden">
            <button
              onClick={() => setFavouritesOpen(!favouritesOpen)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 border-b border-[#f0f2f5]"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#6b21a8] flex items-center justify-center text-white text-xs">
                  ★
                </div>
                <span className="font-bold text-sm text-[#222222]">Favourites</span>
              </div>
              {favouritesOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {favouritesOpen && (
              <div className="p-4 bg-white">
                {/* Big Product Card: PEI Innova B1 (Exact 1:1 replica of IMG_5831) */}
                <div className="border border-[#e2e5e9] p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div className="flex gap-4 items-start">
                    {/* Green Book Cover: INNOVA PEI / LEVEL B1 */}
                    <div className="w-24 shrink-0 aspect-3/4 rounded-xs overflow-hidden border border-[#84cc16] flex flex-col bg-[#a3e635] relative shadow-xs">
                      <div className="bg-[#14532d] text-white p-1 text-center font-bold text-[10px] tracking-wider">
                        INNOVA PEI
                      </div>
                      <div className="flex-1 p-2 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-emerald-950">LEVEL B1</span>
                        <div className="w-full h-10 bg-white/60 rounded flex items-center justify-center text-[10px] font-bold text-emerald-950">
                          📘 Student
                        </div>
                        <span className="text-[8px] font-semibold text-emerald-900 text-right">Pearson</span>
                      </div>
                    </div>

                    {/* Meta & Button */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-6 h-6 rounded-full bg-[#6b21a8] flex items-center justify-center text-white">
                          <Star className="w-3.5 h-3.5 fill-white" />
                        </button>
                      </div>

                      <h3 className="font-bold text-base text-[#222222] leading-tight pt-1">
                        PEI Innova B1
                      </h3>
                      <p className="text-xs text-slate-500">Expires 1 April 2028</p>

                      <div className="pt-2">
                        <button className="px-6 py-1.5 bg-white border border-[#ccd1d8] rounded-xs font-bold text-xs text-[#222222] hover:bg-slate-50 shadow-2xs">
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion: Big English */}
          <div className="bg-white border border-[#e2e5e9] rounded-md shadow-2xs overflow-hidden">
            <button
              onClick={() => setBigEnglishOpen(!bigEnglishOpen)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📕</span>
                <span className="font-bold text-sm text-[#222222]">Big English</span>
              </div>
              {bigEnglishOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>

          {/* Accordion: Gold Experience */}
          <div className="bg-white border border-[#e2e5e9] rounded-md shadow-2xs overflow-hidden">
            <button
              onClick={() => setGoldExperienceOpen(!goldExperienceOpen)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📘</span>
                <span className="font-bold text-sm text-[#222222]">Gold Experience</span>
              </div>
              {goldExperienceOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>

          {/* Accordion: Other */}
          <div className="bg-white border border-[#e2e5e9] rounded-md shadow-2xs overflow-hidden">
            <button
              onClick={() => setOtherOpen(!otherOpen)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🖼️</span>
                <span className="font-bold text-sm text-[#222222]">Other</span>
              </div>
              {otherOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Real Pearson Footer */}
      <footer className="mt-auto py-3 px-4 text-center text-[11px] text-slate-500 border-t border-[#e2e5e9] bg-white">
        Copyright © 2026 Pearson Education Inc. All Rights Reserved.
      </footer>

      {/* Authentic Mobile Safari Bottom URL Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#f8f9fa] border-t border-[#d2d6dc] px-4 py-1.5 flex items-center justify-between text-[#333333]">
        <button onClick={() => {}} className="p-1 text-[#555555]">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenTabSwitcher}
          className="bg-white border border-[#c2c8d0] rounded-full px-4 py-1 flex items-center gap-2 text-xs font-mono text-[#333333] shadow-xs hover:border-[#999999]"
          title="Toca para cambiar de pestaña en Safari"
        >
          <Layers className="w-3.5 h-3.5 text-[#002855]" />
          <span className="text-[11px]">english-dashboard.pearson.com</span>
          <RotateCw className="w-3.5 h-3.5 text-[#888888]" />
        </button>

        <button onClick={onOpenTabSwitcher} className="p-1 text-[#555555]">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
