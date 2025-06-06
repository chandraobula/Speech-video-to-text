import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "TranscribeAI - AI-Powered Audio Transcription Service",
  description:
    "Upload audio files and get accurate, AI-powered transcriptions in seconds. Support for 10+ languages with professional formatting and multiple download options.",
  keywords:
    "audio transcription, speech to text, AI transcription, upload audio, convert speech, voice to text, transcription service",
  authors: [{ name: "TranscribeAI" }],
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    title: "TranscribeAI - AI-Powered Audio Transcription",
    description: "Turn your audio files into accurate text transcriptions with our AI-powered service",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TranscribeAI - AI-Powered Audio Transcription",
    description: "Turn your audio files into accurate text transcriptions with our AI-powered service",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
