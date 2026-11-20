import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ANIMORA — Phòng khám Thú y Chuẩn Y Khoa & Spa Thú Cưng",
  description:
    "Phòng khám Thú y ANIMORA chuyên khám điều trị thú nhỏ, tiêm phòng, siêu âm, xét nghiệm, spa grooming và tư vấn sản phẩm chăm sóc chó mèo chuẩn y khoa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${plusJakartaSans.variable} ${beVietnamPro.variable}`}
    >
      <body className="min-h-screen bg-[#FAF9F6] text-[#132A2E] antialiased selection:bg-[#0F766E]/15 selection:text-[#0F766E]">
        {children}
      </body>
    </html>
  );
}
