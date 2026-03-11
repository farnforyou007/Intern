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

export const metadata: Metadata = {
  title: "TTMED Internship System",
  description: "ระบบประเมินผลการฝึกงานสำหรับนักศึกษาคณะแพทย์แผนไทย มหาวิทยาลัยสงขลานครินทร์",
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
      {/* สำคัญ: ต้องมี prompt.variable ที่นี่ */}
      <body className={`${prompt.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}