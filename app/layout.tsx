import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientAuthHashRedirect } from "@/components/auth/ClientAuthHashRedirect";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { UnreadCountProvider } from "@/components/chat/UnreadCountProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "聊天 PWA",
  description: "聊天 PWA 应用，支持安装到主屏与离线使用",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "聊天",
  },
};

export const viewport: Viewport = {
  themeColor: "#343434",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var v=t==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',v);document.documentElement.classList.toggle('dark',t==='dark');})();`,
          }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400..600,0,0"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ClientAuthHashRedirect />
          <UnreadCountProvider>{children}</UnreadCountProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
