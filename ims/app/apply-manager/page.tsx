"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopNav } from "@/components/navbar/top-nav";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  ShieldAlert,
  RefreshCw,
  ShieldCheck,
  BookOpen,
  Scale,
  UserCheck,
} from "lucide-react";

const MANAGER_RESPONSIBILITIES = [
  {
    title: "Enterprise Creation & Configuration",
    description:
      "You will be responsible for registering new enterprises, configuring their settings, and generating access keys for your team.",
  },
  {
    title: "Staff Onboarding & Access Control",
    description:
      "You will invite, manage, and assign scoped permissions (e.g. stock:view, stock:transfer) to every staff member within your enterprise.",
  },
  {
    title: "Inventory Oversight & Accountability",
    description:
      "All stock movements — receiving, transfers, adjustments, and audits — that occur within your enterprise fall under your managerial oversight.",
  },
  {
    title: "Enterprise Key Security",
    description:
      "You are responsible for keeping your Enterprise Key (ENT-XXXX-XXXX-XXXX) secure. You may rotate the key at any time, but distribution to authorized personnel is your duty.",
  },
  {
    title: "Policy Compliance & Data Integrity",
    description:
      "You agree to follow platform guidelines, ensure accurate inventory reporting, and take accountability for all actions performed under your enterprise scope.",
  },
];

export default function ApplyManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeEnterprise, setActiveEnterprise] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [existingApp, setExistingApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [industry, setIndustry] = useState("Logistics & Supply Chain");
  const [agreedResponsibilities, setAgreedResponsibilities] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const industries = [
    "Logistics & Supply Chain",
    "Retail & E-Commerce",
    "Manufacturing & Assembly",
    "Automotive & Spare Parts",
    "Healthcare & Pharmaceuticals",
    "Food & Beverage Distribution",
    "Other",
  ];

  const fetchStatus = async () => {
    try {
      const ctxRes = await fetch("/api/enterprise/context");
      if (!ctxRes.ok) throw new Error("Unauthorized");
      const ctxData = await ctxRes.json();

      setUser(ctxData.user);
      setActiveEnterprise(ctxData.activeEnterprise);
      setEnterprises(ctxData.enterprises || []);
      setFullName(ctxData.user?.name || "");

      // If user is already a manager, redirect to manager portal
      if (ctxData.user?.role === "manager" || ctxData.user?.role === "superadmin") {
        router.push("/manager");
        return;
      }

      // Check existing application
      try {
        const appRes = await fetch("/api/manager-applications/my");
        if (appRes.ok) {
          const text = await appRes.text();
          if (text && text.trim().length > 0) {
            const appData = JSON.parse(text);
            const application =
              appData.application !== undefined ? appData.application : appData;
            setExistingApp(application || null);
          } else {
            setExistingApp(null);
          }
        }
      } catch (appErr) {
        console.warn("Could not load previous application status", appErr);
        setExistingApp(null);
      }
    } catch {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleNext = () => {
    setErrorMsg("");
    if (currentStep === 1) {
      if (!fullName.trim()) {
        setErrorMsg("Please confirm your full name.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!agreedResponsibilities) {
        setErrorMsg(
          "You must acknowledge all managerial responsibilities before proceeding."
        );
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/manager-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseName: `${fullName.trim()}'s Enterprise`,
          industry,
          businessScale: "Acknowledged",
          reason: "Manager responsibilities reviewed, understood, and accepted.",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit application");

      setExistingApp(data.application);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center text-slate-500 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-slate-200">
      <TopNav
        user={user}
        activeEnterprise={activeEnterprise}
        enterprises={enterprises}
      />

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950">
                Become a Manager
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and acknowledge your responsibilities, then submit for
                SuperAdmin approval to unlock enterprise management capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Existing Application Status Card */}
        {existingApp && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Application Status
            </h2>

            {existingApp.status === "pending" && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      Awaiting SuperAdmin Approval
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold uppercase">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Your application has been submitted. A platform SuperAdmin
                    will review your request and grant the Manager role upon
                    approval.
                  </p>
                  <div className="mt-3 text-[11px] text-amber-700 font-mono">
                    Submitted:{" "}
                    {new Date(existingApp.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {existingApp.status === "approved" && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      Manager Role Granted!
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold uppercase">
                      Approved
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1">
                    Congratulations! You have been promoted to Manager. You can
                    now create enterprises, invite staff, and manage inventory
                    operations — no additional approval needed.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/manager"
                      className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Go to Manager Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {existingApp.status === "rejected" && (
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      Application Not Approved
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-bold uppercase">
                      Rejected
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-1">
                    {existingApp.reviewerNotes
                      ? `Reviewer feedback: ${existingApp.reviewerNotes}`
                      : "The platform SuperAdmin did not approve this request."}
                  </p>
                  <button
                    onClick={() => setExistingApp(null)}
                    className="mt-3 text-xs font-semibold text-rose-900 underline underline-offset-2 cursor-pointer"
                  >
                    Submit a New Application
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step-by-Step Wizard (only when no pending/approved application) */}
        {(!existingApp || existingApp.status === "rejected") &&
          user.role !== "manager" &&
          user.role !== "superadmin" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              {/* Step Indicator */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      currentStep >= 1
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    1
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      currentStep === 1
                        ? "text-slate-900 font-bold"
                        : "text-slate-500"
                    }`}
                  >
                    Your Profile
                  </span>
                </div>
                <div className="h-0.5 flex-1 mx-3 bg-slate-100" />
                <div className="flex items-center gap-2">
                  <span
                    className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      currentStep >= 2
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    2
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      currentStep === 2
                        ? "text-slate-900 font-bold"
                        : "text-slate-500"
                    }`}
                  >
                    Responsibilities
                  </span>
                </div>
                <div className="h-0.5 flex-1 mx-3 bg-slate-100" />
                <div className="flex items-center gap-2">
                  <span
                    className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      currentStep >= 3
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    3
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      currentStep === 3
                        ? "text-slate-900 font-bold"
                        : "text-slate-500"
                    }`}
                  >
                    Submit
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Profile Confirmation */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Step 1: Confirm Your Identity
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Verify your details and select the primary industry you'll be
                    managing inventory for.
                  </p>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Primary Industry
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900">
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">What is a Manager?</span>
                        <p className="text-blue-800 mt-0.5 leading-relaxed">
                          Managers can create enterprises, generate access keys,
                          invite staff with scoped permissions, and oversee all
                          inventory operations. Once approved, enterprise creation
                          does not require any further approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Responsibilities Acknowledgment */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Step 2: Managerial Responsibilities
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Please read and understand the responsibilities that come with
                    the Manager role before submitting your application.
                  </p>

                  <div className="space-y-3">
                    {MANAGER_RESPONSIBILITIES.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-slate-900">
                              {item.title}
                            </span>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedResponsibilities}
                      onChange={(e) =>
                        setAgreedResponsibilities(e.target.checked)
                      }
                      className="mt-0.5 accent-slate-900"
                    />
                    <span className="text-xs text-amber-900 leading-relaxed">
                      <strong>I have read and understand</strong> all of the
                      managerial responsibilities listed above. I accept full
                      accountability for all actions performed within my
                      enterprise scope.
                    </span>
                  </label>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Step 3: Review & Submit for Approval
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Review your information below. Your application will be
                    submitted to a SuperAdmin for review.
                  </p>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Full Name
                      </span>
                      <span className="font-semibold text-slate-900">
                        {fullName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Email
                      </span>
                      <span className="text-slate-800">{user.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Primary Industry
                      </span>
                      <span className="text-slate-800">{industry}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Responsibilities
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        ✓ Acknowledged & Accepted
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">
                          Approval Required
                        </span>
                        <p className="text-blue-800 mt-0.5 leading-relaxed">
                          A SuperAdmin will review your application. Once
                          approved, you'll receive the Manager role and can
                          freely create enterprises without any further approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step Navigation Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep((prev) => (prev - 1) as any)
                    }
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit for SuperAdmin Approval</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
