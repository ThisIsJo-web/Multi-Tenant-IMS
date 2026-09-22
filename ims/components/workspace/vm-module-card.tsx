"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { AppId, AppMetaItem } from "./vm-types";

interface ModuleCardProps {
  appId: AppId;
  meta: AppMetaItem;
  enabled: boolean;
  badge?: string;
  onLaunch: () => void;
}

function ModuleCardComponent({
  meta,
  enabled,
  badge,
  onLaunch,
}: ModuleCardProps) {
  return (
    <div
      role="button"
      tabIndex={enabled ? 0 : -1}
      onClick={() => enabled && onLaunch()}
      onKeyDown={(e) => {
        if (enabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onLaunch();
        }
      }}
      className={`group relative flex flex-col text-left rounded-2xl border p-6 transition-all duration-200 ${
        enabled
          ? "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md cursor-pointer"
          : "bg-slate-50/60 border-slate-200/50 opacity-60 cursor-not-allowed"
      }`}
    >
      {/* Top row with icon and status tag */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors duration-200 ${
            enabled
              ? "bg-slate-100 border-slate-200/80 text-slate-800 group-hover:bg-slate-900 group-hover:text-white"
              : "bg-slate-100 text-slate-400 border-slate-200/50"
          }`}
        >
          {meta.icon}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={`text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                badge === "LIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : badge === "RESTRICTED"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {badge}
            </span>
          )}
          {enabled && (
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          )}
        </div>
      </div>

      {/* Module Info */}
      <div className="mb-2">
        <div className="text-base font-bold text-slate-950 group-hover:text-slate-900 transition-colors">
          {meta.label}
        </div>
        <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
          {meta.module}
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed flex-1 mb-4">
        {meta.description}
      </p>

      {/* Sub-items / Features */}
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
        {meta.subItems.map((item) => (
          <span
            key={item}
            className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export const ModuleCard = React.memo(ModuleCardComponent);
