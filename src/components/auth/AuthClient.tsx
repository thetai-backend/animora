"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Phone,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimoraLogo } from "@/components/AnimoraLogo";

const DEMO_ACCOUNTS = [
  {
    role: "Quản lý",
    email: "quanly@animora.vn",
    desc: "Toàn quyền phòng khám & báo cáo",
    color: "bg-[#0F766E] text-white",
  },
  {
    role: "Lễ tân",
    email: "letan@animora.vn",
    desc: "Điều phối lịch trực & thu ngân POS",
    color: "bg-[#F97316] text-white",
  },
  {
    role: "Bác sĩ",
    email: "bacsi@animora.vn",
    desc: "Khám bệnh & ghi bệnh án S.O.A.P",
    color: "bg-[#0D9488] text-white",
  },
  {
    role: "Khách hàng",
    email: "khachhang@animora.vn",
    desc: "Quản lý hồ sơ & 2 bé thú cưng mẫu",
    color: "bg-[#132A2E] text-white",
  },
];

export function AuthClient({ initialTab = "login" }: { initialTab?: "login" | "register" }) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  // State Đăng nhập
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // State Đăng ký + OTP
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpPreview, setDevOtpPreview] = useState<string | null>(null);

  // Trạng thái chung
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Đăng nhập không thành công.");
        setLoading(false);
        return;
      }
      setSuccessMsg("Đăng nhập thành công! Đang chuyển hướng...");
      router.push(data.redirectTo || "/");
      router.refresh();
    } catch {
      setErrorMsg("Không thể kết nối máy chủ. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    resetMessages();
    if (!regEmail.trim()) {
      setErrorMsg("Vui lòng nhập Email trước khi bấm gửi mã OTP.");
      return;
    }
    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể gửi mã OTP.");
        setSendingOtp(false);
        return;
      }
      setOtpSent(true);
      setDevOtpPreview(data.devOtpCode || null);
      setSuccessMsg(data.message);
    } catch {
      setErrorMsg("Có lỗi khi gửi mã OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          otpCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Đăng ký không thành công.");
        setLoading(false);
        return;
      }
      setSuccessMsg("Đăng ký thành công! Đang đưa bạn vào Trang cá nhân...");
      router.push(data.redirectTo || "/tai-khoan");
      router.refresh();
    } catch {
      setErrorMsg("Có lỗi xảy ra khi đăng ký.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể đăng nhập bằng Google.");
        setLoading(false);
        return;
      }
      if (data.oauthRedirectUrl) {
        window.location.href = data.oauthRedirectUrl;
        return;
      }
      setSuccessMsg(data.message || "Đăng nhập Google thành công!");
      router.push(data.redirectTo || "/tai-khoan");
      router.refresh();
    } catch {
      setErrorMsg("Có lỗi khi kết nối đăng nhập Google.");
      setLoading(false);
    }
  };

  const fillDemoAccount = (email: string) => {
    resetMessages();
    setTab("login");
    setLoginEmail(email);
    setLoginPassword("Animora@123");
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] px-8 py-10">
      <div className="mx-auto max-w-[1220px]">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#0F766E]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0F766E] transition hover:bg-[#0F766E]/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về Trang chủ ANIMORA
          </Link>
          <AnimoraLogo size="sm" interactive />
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Cột trái: Biểu mẫu Đăng nhập / Đăng ký OTP */}
          <div className="col-span-7 rounded-[32px] border border-[#0F766E]/12 bg-white p-10 shadow-xl shadow-[#0F766E]/6">
            <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-[#132A2E]">
                  {tab === "login"
                    ? "Đăng nhập hệ thống ANIMORA"
                    : "Đăng ký tài khoản Khách hàng"}
                </h1>
                <p className="mt-1 text-sm text-[#476268]">
                  {tab === "login"
                    ? "Dành cho Khách hàng, Bác sĩ, Lễ tân và Quản lý phòng khám."
                    : "Tạo tài khoản bằng Email kèm mã xác thực OTP để quản lý hồ sơ thú cưng."}
                </p>
              </div>

              <div className="inline-flex rounded-xl bg-[#FAF9F6] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    resetMessages();
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                    tab === "login"
                      ? "bg-[#0F766E] text-white"
                      : "text-[#476268] hover:text-[#132A2E]"
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("register");
                    resetMessages();
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                    tab === "register"
                      ? "bg-[#0F766E] text-white"
                      : "text-[#476268] hover:text-[#132A2E]"
                  }`}
                >
                  Đăng ký OTP
                </button>
              </div>
            </div>

            {/* Thông báo lỗi / thành công */}
            {errorMsg && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-medium text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-medium text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Hộp hiện mã OTP trực tiếp ở chế độ thử nghiệm */}
            {tab === "register" && devOtpPreview && (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-[#0F766E] bg-[#0F766E]/6 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                      Mã OTP Email (Hiển thị ở chế độ thử nghiệm)
                    </p>
                    <p className="mt-1 text-xs text-[#476268]">
                      Mã này cũng đã được in ra cửa sổ console máy chủ. Bạn nhập mã bên cạnh vào ô xác thực:
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#0F766E] px-4 py-2 font-mono text-2xl font-extrabold tracking-[0.22em] text-white">
                    {devOtpPreview}
                  </div>
                </div>
              </div>
            )}

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#476268]">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#476268]" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nhap-email@animora.vn"
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] py-3.5 pl-11 pr-4 text-sm font-medium text-[#132A2E] outline-none transition focus:border-[#0F766E] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#476268]">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#476268]" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu của bạn"
                      className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] py-3.5 pl-11 pr-4 text-sm font-medium text-[#132A2E] outline-none transition focus:border-[#0F766E] focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#0F766E] py-3.5 text-sm font-bold text-white shadow-md shadow-[#0F766E]/25 transition hover:bg-[#0B5D56] disabled:opacity-60"
                >
                  {loading ? "Đang xác thực..." : "Đăng nhập ngay"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#476268]">
                      Họ và tên *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#476268]" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Nguyễn Văn An"
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] py-3 pl-10 pr-4 text-sm text-[#132A2E] outline-none focus:border-[#0F766E] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#476268]">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#476268]" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0909 123 456"
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] py-3 pl-10 pr-4 text-sm text-[#132A2E] outline-none focus:border-[#0F766E] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#476268]">
                    Email xác thực *
                  </label>
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#476268]" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email-cua-ban@gmail.com"
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] py-3 pl-10 pr-4 text-sm text-[#132A2E] outline-none focus:border-[#0F766E] focus:bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="shrink-0 rounded-xl bg-[#F97316] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#EA580C] disabled:opacity-60"
                    >
                      {sendingOtp
                        ? "Đang gửi..."
                        : otpSent
                        ? "Gửi lại mã OTP"
                        : "Gửi mã OTP"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#476268]">
                      Mã OTP 6 số *
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#476268]" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="Nhập 6 chữ số OTP"
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] py-3 pl-10 pr-4 font-mono text-sm font-bold tracking-widest text-[#132A2E] outline-none focus:border-[#0F766E] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#476268]">
                      Mật khẩu (tối thiểu 6 ký tự) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#476268]" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Tạo mật khẩu đăng nhập"
                        className="w-full rounded-xl border border-[#132A2E]/15 bg-[#FAF9F6] py-3 pl-10 pr-4 text-sm text-[#132A2E] outline-none focus:border-[#0F766E] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-xl bg-[#0F766E] py-3.5 text-sm font-bold text-white shadow-md shadow-[#0F766E]/25 transition hover:bg-[#0B5D56] disabled:opacity-60"
                >
                  {loading ? "Đang tạo tài khoản..." : "Xác nhận OTP & Hoàn tất Đăng ký"}
                </button>
              </form>
            )}

            {/* Đường phân cách & Nút Google */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#132A2E]/10" />
              <span className="text-xs font-semibold text-[#476268]">
                Hoặc tiếp tục nhanh bằng
              </span>
              <div className="h-px flex-1 bg-[#132A2E]/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#132A2E]/18 bg-white py-3.5 text-sm font-bold text-[#132A2E] transition hover:border-[#0F766E] hover:bg-[#FAF9F6] disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              Đăng nhập bằng Google
            </button>
          </div>

          {/* Cột phải: Bảng 4 Tài khoản mẫu kiểm tra phân quyền */}
          <div className="col-span-5 flex flex-col justify-between rounded-[32px] bg-[#132A2E] p-9 text-white shadow-xl">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E] px-3.5 py-1 text-xs font-bold text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                Kiểm tra Phân quyền (RBAC)
              </span>
              <h2 className="mt-4 text-2xl font-extrabold">
                4 Tài khoản mẫu sẵn sàng dùng thử
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Bấm vào bất kỳ vai trò nào bên dưới để tự động điền Email & Mật khẩu (<code className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-xs text-[#FDBA74]">Animora@123</code>), sau đó nhấn <strong>Đăng nhập ngay</strong> để kiểm tra phân quyền.
              </p>

              <div className="mt-6 space-y-3">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemoAccount(acc.email)}
                    className="group flex w-full items-center justify-between rounded-2xl border border-white/12 bg-white/6 p-4 text-left transition hover:border-[#5EEAD4]/60 hover:bg-white/12"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${acc.color}`}
                        >
                          {acc.role}
                        </span>
                        <span className="font-mono text-xs text-white/90">
                          {acc.email}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-white/70">{acc.desc}</p>
                    </div>
                    <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-[#5EEAD4] transition group-hover:bg-[#0F766E] group-hover:text-white">
                      Điền nhanh
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/12 bg-white/6 p-4 text-xs leading-relaxed text-white/75">
              <div className="flex items-center gap-2 font-bold text-[#FDBA74]">
                <Sparkles className="h-4 w-4" />
                Kiến trúc thông báo mở rộng
              </div>
              <p className="mt-1">
                Hệ thống xác thực OTP qua Email được tách lớp riêng, sẵn sàng kết nối Email SMTP thật và Zalo OA (ZNS) cho lịch nhắc tiêm phòng/tái khám ở giai đoạn tiếp theo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
