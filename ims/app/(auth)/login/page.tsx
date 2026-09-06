"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

type AuthMode = "signin" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        if (!email || !password) {
          setStatusMessage({ type: "error", text: "Please provide both email and password." });
          setIsSubmitting(false);
          return;
        }

        const res = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Invalid email or password");
        }

        // Route based on role and enterprise context
        const ctxRes = await fetch("/api/enterprise/context");
        if (ctxRes.ok) {
          const ctxData = await ctxRes.json();
          if (ctxData.user?.role === "superadmin") {
            router.push("/superadmin");
          } else if (ctxData.user?.role === "manager") {
            router.push("/manager");
          } else if (ctxData.activeEnterprise) {
            router.push("/workspace");
          } else {
            router.push("/enter-key");
          }
        } else {
          router.push("/enter-key");
        }
        router.refresh();
      } else if (mode === "register") {
        if (!name || !email || !password) {
          setStatusMessage({ type: "error", text: "All registration fields are required." });
          setIsSubmitting(false);
          return;
        }

        const res = await fetch("/api/auth/sign-up/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Registration failed");
        }

        // Freshly registered user has no enterprise yet -> redirect to /enter-key gate
        router.push("/enter-key");
        router.refresh();
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Authentication failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] text-[#0f172a] flex flex-col items-center justify-center p-4 selection:bg-neutral-200 selection:text-neutral-900 relative">
      {/* Background micro-dot pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 0.75px, transparent 0.75px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white rounded-2xl border border-slate-200/85 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-8 sm:p-9 text-center">
          {/* Brand Header */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mb-3 text-slate-900">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Koll</h1>
            <p className="text-xs text-slate-500 mt-1">
              Multi-Tenant Inventory & Supply Chain Management
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl mb-6 border border-slate-200/60 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setStatusMessage(null);
              }}
              className={`py-1.5 font-medium rounded-lg transition-all cursor-pointer ${
                mode === "signin" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setStatusMessage(null);
              }}
              className={`py-1.5 font-medium rounded-lg transition-all cursor-pointer ${
                mode === "register" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Register
            </button>
          </div>

          {/* Feedback Status */}
          {statusMessage && (
            <div
              className={`mb-5 p-3 rounded-xl text-xs flex items-center justify-center gap-2 border text-center ${
                statusMessage.type === "error"
                  ? "bg-rose-50/80 border-rose-200 text-rose-800"
                  : "bg-emerald-50/80 border-emerald-200 text-emerald-800"
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 transition"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 transition pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
