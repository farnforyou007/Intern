import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "TTMED Internship System",
//   description: "ระบบประเมินผลการฝึกงานสำหรับนักศึกษาคณะแพทย์แผนไทย มหาวิทยาลัยสงขลานครินทร์",
// };

export const metadata: Metadata = {
  title: {
    default: "TTMED Internship System | คณะการแพทย์แผนไทย ม.สงขลานครินทร์",
    template: "%s | TTMED PSU" // ถ้าหน้าอื่นมี title ระบบจะต่อท้ายให้เองอัตโนมัติ
  },
  description: "ระบบประเมินผลและจัดการการฝึกงาน สำหรับนักศึกษาคณะการแพทย์แผนไทย มหาวิทยาลัยสงขลานครินทร์ (PSU) เพื่อประสิทธิภาพในการติดตามผล",
  keywords: ["ฝึกงาน", "แพทย์แผนไทย", "ม.สงขลานครินทร์", "PSU", "TTMED", "ระบบประเมินผลการฝึกงาน"],
  authors: [{ name: "TTMED IT Team" }],
  // ส่วนของ Open Graph (เวลาแชร์ลิงก์ใน LINE/Facebook จะมีรูปและคำอธิบายสวยๆ)
  openGraph: {
    title: "TTMED Internship System",
    description: "ระบบจัดการการฝึกงาน คณะการแพทย์แผนไทย ม.สงขลานครินทร์",
    url: 'https://ttmed-intern.vercel.app', // ใส่ URL เว็บคุณที่นี่
    siteName: 'TTMED Internship System',
    images: [
      {
        url: '/og-image.png', // เอารูป Preview ไปใส่ในโฟลเดอร์ public
        width: 1200,
        height: 630,
        alt: 'TTMED Internship System Preview',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
};



export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
import { Prompt } from 'next/font/google'

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-prompt',
});



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* Explicit viewport for LINE In-App Browser compatibility */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      {/* สำคัญ: ต้องมี prompt.variable ที่นี่ */}
      <body className={`${prompt.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}