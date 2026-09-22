"use client";

import React, { useRef, useCallback } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { WindowState, APP_META } from "./vm-types";

interface AppWindowProps {
  win: WindowState;
  isDraggingAny: boolean;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function AppWindowComponent({
  win,
  isDraggingAny,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onPositionChange,
  onDragStart,
  onDragEnd,
}: AppWindowProps) {
  const dragState = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const meta = APP_META[win.appId];

  const onTitlebarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (win.isMaximized) return;
      e.preventDefault();
      onFocus(win.id);
      dragState.current = { sx: e.clientX, sy: e.clientY, ox: win.x, oy: win.y };
      onDragStart();

      let animationFrameId: number | null = null;
      let lastX = win.x;
      let lastY = win.y;

      const move = (ev: MouseEvent) => {
        if (!dragState.current) return;
        lastX = dragState.current.ox + ev.clientX - dragState.current.sx;
        lastY = Math.max(44, dragState.current.oy + ev.clientY - dragState.current.sy);

        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(() => {
            onPositionChange(win.id, lastX, lastY);
            animationFrameId = null;
          });
        }
      };

      const up = () => {
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
        dragState.current = null;
        onDragEnd();
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };

      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    },
    [win.id, win.isMaximized, win.x, win.y, onFocus, onPositionChange, onDragStart, onDragEnd]
  );

  const wStyle: React.CSSProperties = win.isMaximized
    ? {
        position: "fixed",
        top: 44,
        left: 0,
        right: 0,
        bottom: 34,
        width: "auto",
        height: "auto",
        zIndex: win.zIndex,
        display: win.isMinimized ? "none" : "flex",
      }
    : {
        position: "fixed",
        top: win.y,
        left: win.x,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
        display: win.isMinimized ? "none" : "flex",
      };

  return (
    <div
      style={wStyle}
      onClick={() => onFocus(win.id)}
      onMouseDown={() => onFocus(win.id)}
      className="flex-col rounded-2xl border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] bg-white overflow-hidden animate-in fade-in zoom-in-98 duration-150 transition-shadow"
    >
      {/* Title Bar */}
      <div
        onMouseDown={onTitlebarMouseDown}
        className="h-11 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/90 px-4 flex items-center justify-between select-none cursor-default shrink-0"
      >
        {/* Left macOS style traffic light window controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose(win.id);
            }}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-90 transition cursor-pointer flex items-center justify-center group"
            title="Close"
          >
            <X className="w-2 h-2 text-[#4c0000] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(win.id);
            }}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-90 transition cursor-pointer flex items-center justify-center group"
            title="Minimize"
          >
            <Minimize2 className="w-1.5 h-1.5 text-[#5c3e00] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize(win.id);
            }}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-90 transition cursor-pointer flex items-center justify-center group"
            title={win.isMaximized ? "Restore" : "Maximize"}
          >
            {win.isMaximized ? (
              <Minimize2 className="w-1.5 h-1.5 text-[#004d1a] opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : (
              <Maximize2 className="w-1.5 h-1.5 text-[#004d1a] opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </div>

        {/* Center: Module Title & Module Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0 px-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700">
            <span className="scale-75 text-slate-700">{meta.icon}</span>
            <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-600">
              {meta.module}
            </span>
          </div>
          <span className="text-slate-300 text-xs">/</span>
          <span className="text-xs font-bold text-slate-900 truncate">
            {win.title}
          </span>
        </div>

        {/* Right spacing */}
        <div className="w-16 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize(win.id);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={win.isMaximized ? "Restore Window" : "Maximize Window"}
          >
            {win.isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Content & Iframe Container */}
      <div className="flex-1 overflow-hidden bg-[#f8fafc] relative">
        {/* Invisible overlay when dragging any window to prevent iframe pointer trapping */}
        {isDraggingAny && <div className="absolute inset-0 z-50 pointer-events-auto" />}
        <iframe
          src={win.src}
          className="w-full h-full border-0"
          title={win.title}
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}

export const AppWindow = React.memo(AppWindowComponent);
