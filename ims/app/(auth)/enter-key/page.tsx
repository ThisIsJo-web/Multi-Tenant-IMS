"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  Building2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileCheck,
  LogOut,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function EnterKeyGatePage() {
  const router = useRouter();
  const [enterpriseKey, setEnterpriseKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [managerApp, setManagerApp] = useState<any>(null);

  const fetchUserRequests = async () => {
    try {
      const res = await fetch("/api/enterprise/my-requests");
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchManagerApplication = async () => {
    try {
      const res = await fetch("/api/manager-applications/my");
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          setManagerApp(data.application || null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetch("/api/enterprise/context")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Unauthorized");
      })
      .then((data) => {
        setCurrentUser(data.user);
        if (data.user?.role === "superadmin") {
          router.push("/superadmin");
        } else if (data.user?.role === "manager") {
          router.push("/manager");
        } else if (data.activeEnterprise) {
          router.push("/workspace");
        }
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setIsLoadingUser(false);
      });

    fetchUserRequests();
    fetchManagerApplication();
  }, [router]);

  const handleKeyInputChange = (value: string) => {
    let clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean.startsWith("ENT")) {
      clean = "ENT" + clean.replace(/^E(N(T)?)?/, "");
    }
    const chunks = [];
    chunks.push(clean.slice(0, 3));
    if (clean.length > 3) chunks.push(clean.slice(3, 7));
    if (clean.length > 7) chunks.push(clean.slice(7, 11));
    if (clean.length > 11) chunks.push(clean.slice(11, 15));
    setEnterpriseKey(chunks.join("-"));
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enterpriseKey.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your Enterprise Key." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/enterprise/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid Enterprise Key.");
      }

      if (data.status === "active") {
        setStatusMessage({ type: "success", text: `Access granted to ${data.enterprise.name}! Redirecting...` });
        setTimeout(() => {
          router.push("/workspace");
          router.refresh();
        }, 700);
      } else if (data.status === "request_created" || data.status === "pending") {
        setStatusMessage({
          type: "info",
          text: data.message || `Join request submitted for ${data.enterprise.name}. Pending manager approval.`,
        });
        setEnterpriseKey("");
        fetchUserRequests();
      } else {
        setStatusMessage({ type: "success", text: data.message || "Request processed." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to submit Enterprise Key." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center text-slate-500 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

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

      {/* Top right sign out */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <span className="text-xs text-slate-500">{currentUser?.email}</span>
        <button
          onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        <div className="bg-white rounded-2xl border border-slate-200/85 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-8 sm:p-9 text-center">
          {/* Key Icon */}
          <div className="flex flex-col items-center justify-center mb-5">
            <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-3 shadow-xs">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Enter Enterprise Key</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Enter your organization's Enterprise Access Key to submit a join request or enter your workspace.
            </p>
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5 text-left border ${
                statusMessage.type === "error"
                  ? "bg-rose-50/90 border-rose-200 text-rose-800"
                  : statusMessage.type === "info"
                  ? "bg-blue-50/90 border-blue-200 text-blue-800"
                  : "bg-emerald-50/90 border-emerald-200 text-emerald-800"
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Enterprise Key Form */}
          <form onSubmit={handleKeySubmit} className="space-y-4 text-left">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700">Enterprise Access Key</label>
                <span className="text-[10px] font-mono text-slate-600">ENT-XXXX-XXXX-XXXX</span>
              </div>
              <input
                type="text"
                required
                maxLength={19}
                value={enterpriseKey}
                onChange={(e) => handleKeyInputChange(e.target.value)}
                placeholder="ENT-XXXX-XXXX-XXXX"
                className="w-full font-mono text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 transition uppercase tracking-wider text-center"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <span>Submit Key / Join Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* My Join Requests Status Card */}
          {myRequests.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-left">
              <h3 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>My Enterprise Access Requests</span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{req.enterpriseName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Requested: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      {req.status === "pending" && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Manager
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Managerial Role Application Callout / Status */}
          {managerApp?.status === "pending" ? (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-left">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-amber-900">
                        Manager Application Pending
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                        Awaiting Review
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                      Your application for the Manager role is awaiting SuperAdmin review. Once approved, you can create and manage enterprises.
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-amber-200/60">
                      <span className="text-[10px] text-amber-700 font-mono">
                        Submitted: {new Date(managerApp.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        href="/apply-manager"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-950 underline underline-offset-2"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : managerApp?.status === "approved" ? (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-left">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-emerald-900">
                        Manager Role Approved!
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                        Approved
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                      Congratulations! Your manager application has been approved. You can now create and manage enterprises.
                    </p>
                    <Link
                      href="/manager"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-900 hover:text-emerald-950 mt-2 underline underline-offset-2"
                    >
                      <span>Go to Manager Portal</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                <div className="flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">Want to create an Enterprise?</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Users need the Manager role to create and manage enterprises.
                    </p>
                    <Link
                      href="/apply-manager"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-700 mt-2 cursor-pointer underline underline-offset-2"
                    >
                      <span>Apply for Managerial Role</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
