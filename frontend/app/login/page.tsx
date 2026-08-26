"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { registerUser, loginUser, socialLoginUser } from "@/lib/auth";
import {
  Sparkles,
  Link2,
  BarChart3,
  ClipboardList,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    desc: "Extract patterns and hidden insights using natural language.",
  },
  {
    icon: Link2,
    title: "Discover Associations",
    desc: "Find powerful product relationships that drive sales.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Decisions",
    desc: "Turn insights into smarter actions and better business outcomes.",
  },
  {
    icon: ClipboardList,
    title: "Everything in One Place",
    desc: "Upload data, analyze, and track results seamlessly.",
  },
];

function LeafSprig({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 40 40"
      className={className}
      style={{ width: 16, height: 16, display: "inline-block", flexShrink: 0 }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M4 36C10 24 14 14 30 4" stroke="#7C8A5E" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 27c2.5-3 6-4 9-3" stroke="#7C8A5E" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M19 18c2.5-3 6-4 9-3" stroke="#7C8A5E" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <ellipse cx="9" cy="30" rx="3.4" ry="1.9" transform="rotate(-40 9 30)" fill="#7C8A5E" />
      <ellipse cx="16.5" cy="22.5" rx="3.4" ry="1.9" transform="rotate(-40 16.5 22.5)" fill="#7C8A5E" />
      <ellipse cx="24" cy="15" rx="3.4" ry="1.9" transform="rotate(-40 24 15)" fill="#7C8A5E" />
    </svg>
  );
}

function BasketLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 48 48"
      className={className}
      style={{ width: 28, height: 28, display: "block" }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M14 20 Q14 8 24 8 Q34 8 34 20" stroke="#D08A5C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M24 8 L24 4" stroke="#A9B48C" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M24 5.5 Q21.5 4 20.5 5.5" stroke="#A9B48C" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M24 5 Q26.5 3.3 27.5 5" stroke="#A9B48C" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="4" r="1.4" fill="#A9B48C" />
      <path d="M11 20 L37 20 L34 39 Q24 42 14 39 Z" stroke="#D08A5C" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M11 20 L37 20" stroke="#D08A5C" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 24 L15 37" stroke="#D08A5C" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <path d="M22 24 L21.5 40" stroke="#D08A5C" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <path d="M27 24 L27.5 40" stroke="#D08A5C" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <path d="M33 24 L34 37" stroke="#D08A5C" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

function LeafBranch({ className = "" }: { className?: string }) {
  const leaf = (cx: number, cy: number, rot: number) => (
    <ellipse
      key={`${cx}-${cy}-${rot}`}
      cx={cx}
      cy={cy}
      rx="16"
      ry="7"
      transform={`rotate(${rot} ${cx} ${cy})`}
      stroke="rgba(169, 180, 140, 0.35)"
      strokeWidth="1.3"
      fill="none"
    />
  );
  return (
    <svg
      width="192"
      height="288"
      viewBox="0 0 220 340"
      className={className}
      style={{ width: 192, height: 288, maxWidth: "100%", pointerEvents: "none" }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M110 330 C104 240 130 160 150 30" stroke="rgba(169, 180, 140, 0.35)" strokeWidth="1.4" fill="none" />
      {leaf(122, 298, -35)}
      {leaf(140, 270, 38)}
      {leaf(118, 246, -38)}
      {leaf(144, 218, 40)}
      {leaf(124, 192, -38)}
      {leaf(148, 164, 40)}
      {leaf(130, 138, -35)}
      {leaf(152, 110, 40)}
      {leaf(138, 82, -32)}
      {leaf(155, 55, 38)}
      {leaf(145, 28, -28)}
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0 pointer-events-none">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.6 34.5 26.9 35.5 24 35.5c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 39.6 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5C41.4 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0 pointer-events-none">
      <path d="M16.365 1.43c0 1.14-.415 2.07-1.245 2.79-.83.72-1.83 1.11-3 1.14-.06-1.11.42-2.07 1.245-2.85.825-.78 1.83-1.14 3-1.08zM20.7 17.19c-.42.99-.93 1.92-1.53 2.79-.81 1.17-1.47 1.98-1.98 2.43-.78.75-1.62 1.14-2.52 1.17-.66.03-1.44-.18-2.34-.63-.9-.45-1.71-.66-2.43-.66-.75 0-1.59.21-2.52.66-.93.45-1.68.69-2.25.72-.87.03-1.71-.36-2.52-1.17-.54-.51-1.23-1.35-2.07-2.52-.9-1.26-1.65-2.73-2.22-4.41-.63-1.83-.945-3.6-.945-5.31 0-1.95.42-3.63 1.26-5.04.66-1.14 1.53-2.04 2.61-2.7 1.08-.66 2.25-.99 3.51-1.02.72 0 1.68.24 2.85.72 1.17.48 1.92.72 2.25.72.24 0 1.05-.24 2.43-.72s2.52-.66 3.42-.6c1.98.15 3.48.9 4.47 2.28-1.77 1.08-2.64 2.58-2.64 4.5 0 1.5.54 2.76 1.62 3.75.48.48 1.02.84 1.62 1.11-.15.36-.3.66-.42.93z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 pointer-events-none">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F35325" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#81BC06" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#05A6F0" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFBA08" />
    </svg>
  );
}

function CheckboxField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-ink/80 cursor-pointer select-none">
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only cursor-pointer"
        />
        <span className="w-[18px] h-[18px] rounded-[5px] border border-black/20 bg-white peer-checked:bg-clay peer-checked:border-clay flex items-center justify-center transition-colors">
          <Check size={12} strokeWidth={3} className={checked ? "text-white" : "text-transparent"} />
        </span>
      </span>
      {label}
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const navigateToDashboard = () => {
    try {
      router.push("/dashboard");
    } catch {}
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginUser(signInEmail.trim(), signInPassword);
      navigateToDashboard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!agree) {
      setErrorMsg("Please accept the Terms of Service to proceed.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const name = fullName.trim() || "User";
      const email = signUpEmail.trim() || "user@basketiq.io";
      await registerUser(name, email, signUpPassword);
      navigateToDashboard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account.";
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await socialLoginUser(provider);
      navigateToDashboard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to sign in with ${provider}.`;
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-cream flex items-center justify-center p-4 sm:p-6 select-text">
      <div className="w-full max-w-[1080px] h-full max-h-[640px] flex rounded-[24px] overflow-hidden shadow-2xl border border-black/[0.04] bg-white">
        {/* Left — dark hero panel */}
        <div className="hidden lg:flex w-[45%] shrink-0 h-full relative flex-col justify-between overflow-hidden bg-gradient-to-br from-forest via-forest to-forest-light px-9 py-7">
          <LeafBranch className="absolute -top-4 -right-6 pointer-events-none opacity-40" />

          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 shadow-inner">
              <BasketLogo className="w-7 h-7" />
            </div>
            <div>
              <div className="font-display text-[21px] font-semibold leading-none text-cream">BasketIQ</div>
              <div className="text-[11.5px] text-cream/55 mt-1.5 tracking-wide">Market Basket Intelligence</div>
            </div>
          </div>

          {/* Headline + Features */}
          <div className="relative z-10 py-2">
            <div className="max-w-sm">
              <h1 className="font-display text-[1.85rem] font-bold leading-[1.18] text-cream">
                Smarter baskets,
                <br />
                stronger <span className="text-clay">decisions.</span>
              </h1>
              <p className="text-cream/65 text-[13px] mt-2 leading-relaxed max-w-[280px]">
                Leverage AI and NLP to analyze baskets, discover associations, and delight your customers.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.06] rounded-xl px-3.5 py-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-clay shrink-0">
                    <Icon size={15} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-[12.5px] font-display font-semibold text-cream leading-none">{title}</div>
                    <div className="text-[11px] text-cream/55 mt-0.5 leading-tight">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-6 relative">
            <svg
              className="absolute bottom-0 left-0 w-full h-16 pointer-events-none"
              viewBox="0 0 600 140"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 90 Q100 40 220 80 T600 60 L600 140 L0 140 Z" fill="#3B4530" opacity="0.5" />
              <path d="M0 110 Q140 70 280 105 T600 95 L600 140 L0 140 Z" fill="#4B5740" opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Right — form panel */}
        <div className="flex-1 h-full flex items-center justify-center px-6 sm:px-10 py-5 sm:py-6 bg-white overflow-y-auto">
          <div className="w-full max-w-[400px]">
            {/* Tabs */}
            <div className="flex items-center border-b border-black/[0.08] mb-4">
              <button
                type="button"
                aria-label="Login tab"
                onClick={() => { setTab("signin"); setErrorMsg(null); }}
                className={`flex-1 pb-2.5 text-[13.5px] font-semibold text-center border-b-2 transition-all cursor-pointer ${
                  tab === "signin" ? "text-clay border-clay" : "text-muted border-transparent hover:text-ink"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                aria-label="Signup tab"
                onClick={() => { setTab("signup"); setErrorMsg(null); }}
                className={`flex-1 pb-2.5 text-[13.5px] font-semibold text-center border-b-2 transition-all cursor-pointer ${
                  tab === "signup" ? "text-clay border-clay" : "text-muted border-transparent hover:text-ink"
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-start gap-2 animate-fade-in">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {tab === "signin" ? (
              <>
                <div className="mb-3">
                  <h2 className="font-display text-[22px] font-bold text-ink flex items-center gap-1.5">
                    Welcome back! <LeafSprig className="w-4 h-4" />
                  </h2>
                  <p className="text-muted text-[12.5px] mt-0.5">Sign in to continue your journey with BasketIQ.</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-2.5">
                  <div>
                    <label className="text-[12px] font-medium text-ink block mb-1">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-black/[0.1] bg-white text-[13px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-clay/50 focus:ring-2 focus:ring-clay/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-ink block mb-1">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-black/[0.1] bg-white text-[13px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-clay/50 focus:ring-2 focus:ring-clay/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <CheckboxField checked={remember} onChange={setRemember} label="Remember me" />
                    <a href="#" className="text-[12px] text-clay hover:underline font-medium">
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#C2703E] to-clay hover:brightness-105 active:scale-[0.99] text-white text-[14px] font-medium py-2.5 rounded-xl transition-all shadow-md shadow-clay/20 hover:shadow-lg disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2.5 py-0.5">
                    <div className="flex-1 h-px bg-black/[0.08]" />
                    <span className="text-[11px] text-muted tracking-wide">or continue with</span>
                    <div className="flex-1 h-px bg-black/[0.08]" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSocialLogin("Google")}
                      className="flex items-center justify-center gap-1.5 border border-black/[0.1] bg-white hover:bg-cream-soft active:scale-95 text-ink text-[12px] font-medium py-2 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      <GoogleIcon /> Google
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSocialLogin("Apple")}
                      className="flex items-center justify-center gap-1.5 border border-black/[0.1] bg-white hover:bg-cream-soft active:scale-95 text-ink text-[12px] font-medium py-2 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      <AppleIcon /> Apple
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSocialLogin("Microsoft")}
                      className="flex items-center justify-center gap-1.5 border border-black/[0.1] bg-white hover:bg-cream-soft active:scale-95 text-ink text-[12px] font-medium py-2 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      <MicrosoftIcon /> Microsoft
                    </button>
                  </div>

                  <p className="text-center text-[12px] text-ink/70 pt-0.5">
                    New here?{" "}
                    <button type="button" onClick={() => setTab("signup")} className="text-clay font-medium hover:underline cursor-pointer">
                      Create an account
                    </button>
                  </p>
                  <p className="flex items-center justify-center gap-1 text-[11px] text-muted pt-0.5">
                    <ShieldCheck size={12} /> Your data is secure and private.
                  </p>
                </form>
              </>
            ) : (
              <>
                <div className="mb-3.5">
                  <h2 className="font-display text-[22px] font-bold text-ink flex items-center gap-1.5">
                    Create your account <LeafSprig className="w-4 h-4" />
                  </h2>
                  <p className="text-muted text-[12.5px] mt-0.5">Start turning baskets into intelligence.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-3">
                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">Full name</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/[0.12] bg-white text-[13.5px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/[0.12] bg-white text-[13.5px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-black/[0.12] bg-white text-[13.5px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <CheckboxField
                      checked={agree}
                      onChange={setAgree}
                      label="I agree to the Terms of Service and Privacy Policy"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#C2703E] to-clay hover:brightness-105 active:scale-[0.99] text-white text-[14px] font-semibold py-3 rounded-xl transition-all shadow-md shadow-clay/20 hover:shadow-lg disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2.5 py-1">
                    <div className="flex-1 h-px bg-black/[0.08]" />
                    <span className="text-[11px] text-muted uppercase tracking-wider font-medium">or continue with</span>
                    <div className="flex-1 h-px bg-black/[0.08]" />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSocialLogin("Google")}
                      className="flex items-center justify-center gap-1.5 border border-black/[0.1] bg-white hover:bg-cream-soft active:scale-95 text-ink text-[12.5px] font-medium py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer shadow-sm"
                    >
                      <GoogleIcon /> Google
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSocialLogin("Apple")}
                      className="flex items-center justify-center gap-1.5 border border-black/[0.1] bg-white hover:bg-cream-soft active:scale-95 text-ink text-[12.5px] font-medium py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer shadow-sm"
                    >
                      <AppleIcon /> Apple
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSocialLogin("Microsoft")}
                      className="flex items-center justify-center gap-1.5 border border-black/[0.1] bg-white hover:bg-cream-soft active:scale-95 text-ink text-[12.5px] font-medium py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer shadow-sm"
                    >
                      <MicrosoftIcon /> Microsoft
                    </button>
                  </div>

                  <p className="text-center text-[12.5px] text-ink/75 pt-1">
                    Already have an account?{" "}
                    <button type="button" onClick={() => setTab("signin")} className="text-clay font-semibold hover:underline cursor-pointer">
                      Sign in
                    </button>
                  </p>
                  <p className="flex items-center justify-center gap-1 text-[11px] text-muted pt-0.5">
                    <ShieldCheck size={13} /> Your credentials are encrypted and secure.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
