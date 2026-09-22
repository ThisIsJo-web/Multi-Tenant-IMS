"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
} from "lucide-react";
import { WalkthroughStep } from "./walkthrough-steps";

interface GuidedWalkthroughProps {
  tourKey: string;
  steps: WalkthroughStep[];
  autoStart?: boolean;
  onComplete?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function GuidedWalkthrough({
  tourKey,
  steps,
  autoStart = true,
  onComplete,
  isOpen: controlledIsOpen,
  onClose,
}: GuidedWalkthroughProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isTourActive = isControlled ? controlledIsOpen : internalIsOpen;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const storageKey = `ims_walkthrough_${tourKey}_v1`;

  // Determine if tour should start automatically on mount
  useEffect(() => {
    if (!isControlled && autoStart) {
      try {
        const completed = localStorage.getItem(storageKey);
        if (!completed) {
          const timer = setTimeout(() => {
            setInternalIsOpen(true);
          }, 600);
          return () => clearTimeout(timer);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [tourKey, autoStart, isControlled, storageKey]);

  const currentStep = steps[currentStepIndex];

  // Calculate target element rect and scroll into view smoothly
  const updateTargetPosition = useCallback(() => {
    if (!isTourActive || !currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      }, 150);
    } else {
      setTargetRect(null);
    }
  }, [isTourActive, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition, true);
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition, true);
    };
  }, [updateTargetPosition]);

  const handleFinishTour = () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // Ignore
    }
    if (isControlled && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
    setCurrentStepIndex(0);
    if (onComplete) onComplete();
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinishTour();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleFinishTour();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourActive, currentStepIndex, steps.length]);

  if (!isTourActive || !currentStep) return null;

  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  // Position tooltip relative to targetRect
  let cardStyle: React.CSSProperties = {};
  const padding = 16;
  const cardWidth = 360;

  if (targetRect) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    if (isMobile) {
      cardStyle = {
        position: "fixed",
        bottom: "20px",
        left: "16px",
        right: "16px",
        maxWidth: "calc(100vw - 32px)",
        zIndex: 9999,
      };
    } else {
      const pos = currentStep.position || "bottom";

      let top = 0;
      let left = 0;

      if (pos === "bottom") {
        top = targetRect.bottom + padding;
        left = Math.max(16, targetRect.left + targetRect.width / 2 - cardWidth / 2);
      } else if (pos === "top") {
        top = targetRect.top - 220 - padding;
        left = Math.max(16, targetRect.left + targetRect.width / 2 - cardWidth / 2);
      } else if (pos === "right") {
        top = Math.max(16, targetRect.top + targetRect.height / 2 - 80);
        left = targetRect.right + padding;
      } else if (pos === "left") {
        top = Math.max(16, targetRect.top + targetRect.height / 2 - 80);
        left = Math.max(16, targetRect.left - cardWidth - padding);
      }

      const maxLeft = typeof window !== "undefined" ? window.innerWidth - cardWidth - 20 : 800;
      left = Math.min(Math.max(16, left), maxLeft);

      cardStyle = {
        position: "fixed",
        top: `${Math.max(16, top)}px`,
        left: `${left}px`,
        width: `${cardWidth}px`,
        zIndex: 9999,
      };
    }
  } else {
    cardStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: `${cardWidth}px`,
      maxWidth: "calc(100vw - 32px)",
      zIndex: 9999,
    };
  }

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-auto">
      {/* Subtle overlay without blur - clear background visibility */}
      <div className="absolute inset-0 bg-slate-900/25 pointer-events-auto transition-opacity duration-200" />

      {/* Target Focus Border */}
      {targetRect && (
        <div
          className="fixed rounded-xl border-2 border-slate-900 shadow-[0_0_0_9999px_rgba(15,23,42,0.25)] pointer-events-none transition-all duration-200"
          style={{
            top: `${Math.max(0, targetRect.top - 4)}px`,
            left: `${Math.max(0, targetRect.left - 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            zIndex: 9992,
          }}
        />
      )}

      {/* Clean White Tour Card */}
      <div
        ref={cardRef}
        style={cardStyle}
        className="bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl p-5 transition-all duration-200 animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold">
              {currentStep.badge || "Guide"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              {currentStepIndex + 1} / {steps.length}
            </span>
            <button
              onClick={handleFinishTour}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
              title="Close Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimalist Progress Indicator */}
        <div className="w-full bg-slate-100 rounded-full h-1 mb-3 overflow-hidden">
          <div
            className="bg-slate-900 h-full rounded-full transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Text Content */}
        <h3 className="text-sm font-bold text-slate-950 mb-1">
          {currentStep.title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <button
            onClick={handleFinishTour}
            className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <span>{currentStepIndex === steps.length - 1 ? "Done" : "Next"}</span>
              {currentStepIndex === steps.length - 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Clean White Palette Tour Button
 */
export function GuidedTourTrigger({
  onTrigger,
  label = "Tour",
  className = "",
}: {
  onTrigger: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onTrigger}
      type="button"
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition cursor-pointer ${
        className ||
        "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs"
      }`}
      title="Start guided tour"
    >
      <Sparkles className="w-3.5 h-3.5 text-slate-600" />
      <span>{label}</span>
    </button>
  );
}
