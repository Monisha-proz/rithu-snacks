import type { Metadata } from "next";
import { Inter, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/logos/logo.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logos/logo.svg",
    apple: "/logos/logo.svg",
  },
  title: "RithuSnacks - Premium Snacks",
  description: "Premium snacks delivered to your doorstep. Quality you can taste.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} ${inter.variable} ${hanken.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

