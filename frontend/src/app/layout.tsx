import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "pyqs Content Studio",
  description: "Internal editorial workspace for PYQS content.",
  icons: { icon: "/theme/assets/logos/favicon-192.png" },
};

const themeInit = `(function(){try{var t=localStorage.getItem('studio.theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${dmSans.variable} font-sans`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
