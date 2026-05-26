import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sirwan = localFont({
  variable: "--font-sirwan",
  display: "swap",
  src: [
    { path: "../public/fonts/UniSIRWAN Expo Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/UniSIRWAN Expo Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/UniSIRWAN Expo Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/UniSIRWAN Expo Bold.ttf", weight: "700", style: "normal" },
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Caffe 24",
  description: "Caffe 24 | Order Your Coffee and Drinks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
                if (!localStorage.getItem('theme')) {
                  localStorage.setItem('theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
        <link rel="icon" type="image/png" href="/image/2.png" />
      </head>
      <body className={`${sirwan.variable} font-sirwan antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
