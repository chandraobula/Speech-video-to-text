"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Upload, FileAudio, Download, Star, Check, Clock, Play, Volume2, Zap, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import axios from "axios"

// Language options for transcription
const LANGUAGES = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
  { code: "es-ES", name: "Spanish (Spain)", flag: "🇪🇸" },
  { code: "es-MX", name: "Spanish (Mexico)", flag: "🇲🇽" },
  { code: "fr-FR", name: "French", flag: "🇫🇷" },
  { code: "de-DE", name: "German", flag: "🇩🇪" },
  { code: "it-IT", name: "Italian", flag: "🇮🇹" },
  { code: "pt-BR", name: "Portuguese (Brazil)", flag: "🇧🇷" },
  { code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
  { code: "ko-KR", name: "Korean", flag: "🇰🇷" },
]

// Subscription plans with time limits
const PLANS = [
  {
    name: "Free",
    price: 0,
    timeLimit: 180, // 3 hours in minutes
    features: ["3 hours of transcription", "Basic accuracy", "TXT downloads", "Email support"],
    color: "from-gray-400 to-gray-600",
    icon: Clock,
  },
  {
    name: "Pro",
    price: 19.99,
    timeLimit: 1200, // 20 hours in minutes
    features: [
      "20 hours of transcription",
      "High accuracy AI",
      "All download formats",
      "Priority support",
      "Batch processing",
      "Speaker identification",
    ],
    popular: true,
    color: "from-blue-500 to-purple-600",
    icon: Zap,
  },
  {
    name: "Business",
    price: 49.99,
    timeLimit: 6000, // 100 hours in minutes
    features: [
      "100 hours of transcription",
      "Premium AI with timestamps",
      "All download formats",
      "24/7 priority support",
      "API access",
      "Team collaboration",
      "Custom integrations",
      "Advanced analytics",
    ],
    color: "from-purple-600 to-pink-600",
    icon: Users,
  },
]

interface User {
  id: string
  email: string
  name: string
  plan: "free" | "pro" | "business"
  timeUsed: number // in minutes
  timeLimit: number // in minutes
}

interface TranscriptionResult {
  id: string
  filename: string
  transcript: string
  language: string
  confidence: number
  duration: number // in minutes
  timestamp: Date
}

export default function TranscriptionApp() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [selectedLanguage, setSelectedLanguage] = useState("en-US")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileDuration, setFileDuration] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guestTimeUsed, setGuestTimeUsed] = useState(0)
  const [showPricing, setShowPricing] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load user data and guest time from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("transcription_user")
    const savedGuestTime = localStorage.getItem("guest_time_used")

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedGuestTime) {
      setGuestTimeUsed(Number.parseFloat(savedGuestTime))
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("transcription_user", JSON.stringify(user))
    }
    localStorage.setItem("guest_time_used", guestTimeUsed.toString())
  }, [user, guestTimeUsed])

  const handleLogin = (email: string, password: string) => {
    const mockUser: User = {
      id: "user_" + Date.now(),
      email,
      name: email.split("@")[0],
      plan: "free",
      timeUsed: 0,
      timeLimit: 180, // 3 hours
    }
    setUser(mockUser)
    setIsAuthOpen(false)
  }

  const handleSignup = (name: string, email: string, password: string) => {
    const mockUser: User = {
      id: "user_" + Date.now(),
      email,
      name,
      plan: "free",
      timeUsed: 0,
      timeLimit: 180, // 3 hours
    }
    setUser(mockUser)
    setIsAuthOpen(false)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("transcription_user")
    setTranscriptionResult(null)
  }

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement("audio")
      audio.preload = "metadata"
      audio.onloadedmetadata = () => {
        resolve(audio.duration / 60) // Convert to minutes
      }
      audio.onerror = () => {
        resolve(0) // Default to 0 if can't get duration
      }
      audio.src = URL.createObjectURL(file)
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file type
      const allowedTypes = ["audio/mp3", "audio/wav", "audio/m4a", "audio/ogg", "video/mp4", "audio/mpeg"]
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a valid audio file (MP3, WAV, M4A, OGG, MP4)")
        return
      }

      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError("File size must be less than 100MB")
        return
      }

      const duration = await getAudioDuration(file)
      setFileDuration(duration)
      setUploadedFile(file)
      setError(null)
    }
  }

  const handleTranscribe = async () => {
    if (!uploadedFile || !fileDuration) return

    // Check time limits
    const currentTimeUsed = user ? user.timeUsed : guestTimeUsed
    const timeLimit = user ? user.timeLimit : 30 // 30 minutes for guests

    if (currentTimeUsed + fileDuration > timeLimit) {
      const remainingTime = timeLimit - currentTimeUsed
      setError(
        `Not enough time remaining. You need ${fileDuration.toFixed(1)} minutes but only have ${remainingTime.toFixed(1)} minutes left.`,
      )
      setShowPricing(true)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Prepare form data for API
      const formData = new FormData()
      formData.append("file", uploadedFile)

      // Send file to transcription API
      const response = await axios.post("http://13.203.76.137:8000/transcribe/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      console.log("Transcription API response:", response.data)
      console.log("Transcription API response:", response)
      // Handle API response
      if (response.data && response.data.transcription) {
        const result: TranscriptionResult = {
          id: "transcript_" + Date.now(),
          filename: uploadedFile.name,
          transcript: response.data.transcription,
          language: selectedLanguage,
          confidence: response.data.confidence || 0.95,
          duration: fileDuration,
          timestamp: new Date(),
        }
        setTranscriptionResult(result)
        console.log("Transcription result:", transcriptionResult);
        // Update time usage
        if (user) {
          const updatedUser = { ...user, timeUsed: user.timeUsed + fileDuration }
          setUser(updatedUser)
        } else {
          setGuestTimeUsed(guestTimeUsed + fileDuration)
        }
      }
    } catch (err) {
      setError("Failed to transcribe audio. Please try again.")
    } finally {
      setIsProcessing(false)
    }
}

  const downloadTranscript = (format: "txt" | "pdf" | "docx") => {
    if (!transcriptionResult) return

    const { transcript, filename } = transcriptionResult
    const baseFilename = filename.split(".")[0]

    if (format === "txt") {
      const blob = new Blob([transcript], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${baseFilename}_transcript.txt`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === "pdf") {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Transcript - ${filename}</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
              <h1 style="color: #333;">Transcript: ${filename}</h1>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Language:</strong> ${selectedLanguage}</p>
                <p><strong>Duration:</strong> ${fileDuration.toFixed(1)} minutes</p>
                <p><strong>Confidence:</strong> ${Math.round(transcriptionResult.confidence * 100)}%</p>
                <p><strong>Date:</strong> ${transcriptionResult.timestamp.toLocaleDateString()}</p>
              </div>
              <div style="border-top: 2px solid #333; padding-top: 20px;">
                <p style="font-size: 16px;">${transcript}</p>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } else if (format === "docx") {
      const htmlContent = `
        <html>
          <head><meta charset="utf-8"><title>Transcript - ${filename}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Transcript: ${filename}</h1>
            <p><strong>Language:</strong> ${selectedLanguage}</p>
            <p><strong>Duration:</strong> ${fileDuration.toFixed(1)} minutes</p>
            <p><strong>Date:</strong> ${transcriptionResult.timestamp.toLocaleDateString()}</p>
            <hr>
            <p style="line-height: 1.6;">${transcript}</p>
          </body>
        </html>
      `
      const blob = new Blob([htmlContent], { type: "application/msword" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${baseFilename}_transcript.doc`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const canDownloadFormat = (format: "txt" | "pdf" | "docx") => {
    if (!user) return format === "txt"
    if (user.plan === "free") return format === "txt"
    return true
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const currentTimeUsed = user ? user.timeUsed : guestTimeUsed
  const timeLimit = user ? user.timeLimit : 30
  const timeRemaining = Math.max(0, timeLimit - currentTimeUsed)
  const usagePercentage = (currentTimeUsed / timeLimit) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Volume2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  TranscribeAI
                </h1>
                <p className="text-xs text-gray-500">AI-Powered Transcription</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{formatTime(timeRemaining)} left</span>
                    </div>
                    <p className="text-xs text-gray-500">Hi, {user.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPricing(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Upgrade
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{formatTime(timeRemaining)} free</span>
                    </div>
                    <p className="text-xs text-gray-500">No account needed</p>
                  </div>
                  <Button
                    onClick={() => setIsAuthOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  >
                    Get 3 Hours Free
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 pt-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            <span>AI-Powered Transcription</span>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
            Turn Audio into Text
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your audio files and get accurate, AI-powered transcriptions in seconds. Support for 10+ languages
            with professional formatting.
          </p>
        </div>

        {/* Time Usage Card */}
        <Card className="mb-8 bg-gradient-to-r from-white to-blue-50/50 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Transcription Time</h3>
                  <p className="text-sm text-gray-600">
                    {formatTime(currentTimeUsed)} used of {formatTime(timeLimit)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatTime(timeRemaining)}</div>
                <div className="text-sm text-gray-500">remaining</div>
              </div>
            </div>
            <Progress value={usagePercentage} className="h-3" />
            {usagePercentage > 80 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ You're running low on transcription time.{" "}
                  <button onClick={() => setShowPricing(true)} className="font-medium underline hover:no-underline">
                    Upgrade now
                  </button>{" "}
                  to get more hours.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Upload Interface */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    Upload Audio File
                  </CardTitle>

                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-56 bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center space-x-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* File Upload Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    timeRemaining <= 0
                      ? "border-gray-200 bg-gray-50"
                      : "border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-purple-100"
                  }`}
                >
                  <input
                    type="file"
                    accept="audio/*,video/mp4"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={timeRemaining <= 0}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer block ${timeRemaining <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {timeRemaining > 0 ? "Drop your audio file here" : "Time limit reached"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {timeRemaining > 0 ? "or click to browse your files" : "Please upgrade to continue transcribing"}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                      <span className="bg-white/80 px-2 py-1 rounded">MP3</span>
                      <span className="bg-white/80 px-2 py-1 rounded">WAV</span>
                      <span className="bg-white/80 px-2 py-1 rounded">M4A</span>
                      <span className="bg-white/80 px-2 py-1 rounded">OGG</span>
                      <span className="bg-white/80 px-2 py-1 rounded">MP4</span>
                    </div>
                  </label>
                </div>

                {/* Selected File Display */}
                {uploadedFile && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                          <FileAudio className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{uploadedFile.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                            <span>•</span>
                            <span>{formatTime(fileDuration)} duration</span>
                            <span>•</span>
                            <span className="flex items-center">
                              {LANGUAGES.find((l) => l.code === selectedLanguage)?.flag}{" "}
                              {LANGUAGES.find((l) => l.code === selectedLanguage)?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleTranscribe}
                        disabled={isProcessing || timeRemaining < fileDuration}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-2 shadow-lg"
                      >
                        {isProcessing ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Play className="h-4 w-4" />
                            <span>Transcribe</span>
                          </div>
                        )}
                      </Button>
                    </div>
                    {timeRemaining < fileDuration && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          ⚠️ Not enough time remaining. Need {formatTime(fileDuration)} but only have{" "}
                          {formatTime(timeRemaining)} left.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Processing State */}
                {isProcessing && (
                  <div className="text-center py-12">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Volume2 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Transcribing your audio...</h3>
                    <p className="text-gray-600">Our AI is processing your file with high accuracy</p>
                    <div className="mt-4 bg-blue-50 rounded-lg p-3 max-w-md mx-auto">
                      <p className="text-sm text-blue-700">
                        ✨ Using advanced AI models for {LANGUAGES.find((l) => l.code === selectedLanguage)?.name}{" "}
                        transcription
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Features */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Why Choose Us?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">99% Accuracy</h4>
                    <p className="text-sm text-gray-600">Advanced AI models ensure precise transcription</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">10+ Languages</h4>
                    <p className="text-sm text-gray-600">Support for major world languages</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Secure & Private</h4>
                    <p className="text-sm text-gray-600">Your files are processed securely and deleted after use</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Multiple Formats</h4>
                    <p className="text-sm text-gray-600">Download as TXT, PDF, or Word documents</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!user && (
              <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold mb-2">Get 6x More Time!</h3>
                  <p className="text-blue-100 mb-4">Sign up for free and get 3 hours of transcription time</p>
                  <Button
                    onClick={() => setIsAuthOpen(true)}
                    className="bg-white text-blue-600 hover:bg-blue-50 w-full font-semibold"
                  >
                    Sign Up Free
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Transcription Result */}
        {transcriptionResult && (
          <Card className="mb-8 bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    Transcription Complete
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1">
                      <FileAudio className="h-4 w-4" />
                      {transcriptionResult.filename}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(transcriptionResult.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {Math.round(transcriptionResult.confidence * 100)}% confidence
                    </span>
                    <span>{transcriptionResult.timestamp.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadTranscript("txt")} className="bg-white/80">
                    <Download className="h-4 w-4 mr-1" />
                    TXT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTranscript("pdf")}
                    disabled={!canDownloadFormat("pdf")}
                    className="bg-white/80"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF {!canDownloadFormat("pdf") && "🔒"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTranscript("docx")}
                    disabled={!canDownloadFormat("docx")}
                    className="bg-white/80"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Word {!canDownloadFormat("docx") && "🔒"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-6 max-h-96 overflow-y-auto border">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-lg">
                  {transcriptionResult.transcript}
                </p>
              </div>
              {!user && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Star className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Unlock Premium Downloads</h4>
                      <p className="text-sm text-gray-600">
                        Sign up to download as PDF and Word documents, plus get 3 hours of free transcription time!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Auth Dialog */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {authMode === "login" ? "Welcome Back!" : "Get Started Free"}
            </DialogTitle>
          </DialogHeader>
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 mt-6">
              <LoginForm onLogin={handleLogin} />
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-6">
              <SignupForm onSignup={handleSignup} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog */}
      <Dialog open={showPricing} onOpenChange={setShowPricing}>
        <DialogContent className="sm:max-w-5xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Choose Your Plan</DialogTitle>
          </DialogHeader>
          <PricingPlans user={user} onClose={() => setShowPricing(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 bg-white/80"
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 bg-white/80"
          placeholder="Enter your password"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        Login to Account
      </Button>
    </form>
  )
}

function SignupForm({ onSignup }: { onSignup: (name: string, email: string, password: string) => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSignup(name, email, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 bg-white/80"
          placeholder="Enter your full name"
          required
        />
      </div>
      <div>
        <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 bg-white/80"
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 bg-white/80"
          placeholder="Create a password"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
      >
        Create Free Account
      </Button>
      <p className="text-xs text-gray-500 text-center">Get 3 hours of free transcription time instantly!</p>
    </form>
  )
}

function PricingPlans({ user, onClose }: { user: User | null; onClose: () => void }) {
  const handleUpgrade = (planName: string) => {
    alert(`Upgrading to ${planName} plan! This would integrate with Stripe/PayPal in a real app.`)
    onClose()
  }

  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-2">Unlock More Transcription Time</h3>
        <p className="text-gray-600 text-lg">Choose the perfect plan for your needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? "border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-xl"
                  : "border-gray-200 bg-white shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.color} mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-600 text-lg">/month</span>}
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <span className="text-2xl font-bold text-gray-900">{Math.floor(plan.timeLimit / 60)}</span>
                  <span className="text-gray-600 ml-1">hours of transcription</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan.name)}
                className={`w-full py-3 text-lg font-semibold ${
                  plan.popular
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    : "bg-gray-900 hover:bg-gray-800 text-white"
                }`}
                disabled={user?.plan === plan.name.toLowerCase()}
              >
                {user?.plan === plan.name.toLowerCase() ? "Current Plan" : `Choose ${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-2">🔒 Enterprise Solutions Available</h4>
          <p className="text-gray-600">
            Need custom solutions, API access, or higher limits? Contact us for enterprise pricing and features.
          </p>
        </div>
      </div>
    </div>
  )
}
