"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  FileAudio,
  Download,
  Star,
  Check,
  Clock,
  Play,
  Volume2,
  Zap,
  Shield,
  Users,
  X,
  Settings,
  Mic,
  Brain,
} from "lucide-react";
import "./App.css";

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
];

// Subscription plans with time limits
const PLANS = [
  {
    name: "Free",
    price: 0,
    timeLimit: 180, // 3 hours in minutes
    features: [
      "3 hours of transcription",
      "Basic accuracy",
      "TXT downloads",
      "Email support",
    ],
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
];

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Custom Components
const Button = ({
  children,
  onClick,
  disabled,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost:
      "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500",
    gradient:
      "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl focus:ring-green-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    outline: "border border-gray-300 text-gray-700",
    success: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

const Progress = ({ value, className = "" }) => (
  <div className={`w-full bg-gray-200 rounded-full h-3 ${className}`}>
    <div
      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const Select = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
  >
    {children}
  </select>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    {...props}
  />
);

const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
  >
    {children}
  </label>
);

const Alert = ({ children, className = "" }) => (
  <div className={`p-4 rounded-lg border ${className}`}>{children}</div>
);

const Modal = ({ isOpen, onClose, children, title, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div
          className={`inline-block w-full ${sizeClasses[size]} p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const Tabs = ({ activeTab, onTabChange, children }) => {
  return <div>{children}</div>;
};

const TabsList = ({ children, activeTab, onTabChange }) => (
  <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
    {React.Children.map(children, (child, index) =>
      React.cloneElement(child, {
        isActive: activeTab === child.props.value,
        onClick: () => onTabChange(child.props.value),
      })
    )}
  </div>
);

const TabsTrigger = ({ children, value, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
      isActive
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-600 hover:text-gray-900"
    }`}
  >
    {children}
  </button>
);

const TabsContent = ({ children, value, activeTab }) => {
  if (value !== activeTab) return null;
  return <div className="mt-4">{children}</div>;
};

const Checkbox = ({ checked, onChange, label, className = "" }) => (
  <label className={`flex items-center space-x-2 cursor-pointer ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileDuration, setFileDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [error, setError] = useState(null);
  const [guestTimeUsed, setGuestTimeUsed] = useState(0);
  const [showPricing, setShowPricing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // New state for advanced features
  const [transcriptionModel, setTranscriptionModel] = useState("whisper");
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [grammarCorrection, setGrammarCorrection] = useState(true);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    models_loaded: false,
  });

  // Load user data and guest time from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("transcription_user");
    const savedGuestTime = localStorage.getItem("guest_time_used");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedGuestTime) {
      setGuestTimeUsed(Number.parseFloat(savedGuestTime));
    }

    // Check backend status
    checkBackendStatus();
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("transcription_user", JSON.stringify(user));
    }
    localStorage.setItem("guest_time_used", guestTimeUsed.toString());
  }, [user, guestTimeUsed]);

  // Poll for transcription progress
  useEffect(() => {
    let interval;
    if (currentJobId && isProcessing) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/transcribe/${currentJobId}/status`
          );
          if (response.ok) {
            const jobStatus = await response.json();
            setTranscriptionProgress(jobStatus.progress || 0);

            if (jobStatus.status === "completed") {
              setTranscriptionResult({
                id: jobStatus.id,
                filename: jobStatus.filename,
                transcript: jobStatus.transcription,
                language: selectedLanguage,
                confidence: 0.95, // Mock confidence
                duration: fileDuration,
                timestamp: new Date(jobStatus.completed_at),
                jobId: currentJobId,
              });
              setIsProcessing(false);
              setCurrentJobId(null);

              // Update time usage
              if (user) {
                const updatedUser = {
                  ...user,
                  timeUsed: user.timeUsed + fileDuration,
                };
                setUser(updatedUser);
              } else {
                setGuestTimeUsed(guestTimeUsed + fileDuration);
              }
            } else if (jobStatus.status === "failed") {
              setError(jobStatus.error || "Transcription failed");
              setIsProcessing(false);
              setCurrentJobId(null);
            }
          }
        } catch (err) {
          console.error("Error checking job status:", err);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    currentJobId,
    isProcessing,
    fileDuration,
    selectedLanguage,
    user,
    guestTimeUsed,
  ]);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response.ok) {
        const status = await response.json();
        setBackendStatus({
          connected: true,
          models_loaded: status.whisper_loaded && status.grammar_tool_loaded,
        });
      }
    } catch (err) {
      setBackendStatus({ connected: false, models_loaded: false });
    }
  };

  const handleLogin = (email, password) => {
    const mockUser = {
      id: "user_" + Date.now(),
      email,
      name: email.split("@")[0],
      plan: "free",
      timeUsed: 0,
      timeLimit: 180, // 3 hours
    };
    setUser(mockUser);
    setIsAuthOpen(false);
  };

  const handleSignup = (name, email, password) => {
    const mockUser = {
      id: "user_" + Date.now(),
      email,
      name,
      plan: "free",
      timeUsed: 0,
      timeLimit: 180, // 3 hours
    };
    setUser(mockUser);
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("transcription_user");
    setTranscriptionResult(null);
  };

  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        resolve(audio.duration / 60); // Convert to minutes
      };
      audio.onerror = () => {
        resolve(0); // Default to 0 if can't get duration
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        "audio/mp3",
        "audio/wav",
        "audio/m4a",
        "audio/ogg",
        "video/mp4",
        "audio/mpeg",
        "audio/flac",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(
          "Please upload a valid audio file (MP3, WAV, M4A, OGG, MP4, FLAC)"
        );
        return;
      }

      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError("File size must be less than 100MB");
        return;
      }

      const duration = await getAudioDuration(file);
      setFileDuration(duration);
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleTranscribe = async () => {
    if (!uploadedFile || !fileDuration) return;

    // Check backend connection
    if (!backendStatus.connected) {
      setError("Backend server is not available. Please try again later.");
      return;
    }

    // Check if models are loaded for Whisper
    if (transcriptionModel === "whisper" && !backendStatus.models_loaded) {
      setError(
        "AI models are still loading. Please wait a moment and try again."
      );
      return;
    }

    // Check time limits
    const currentTimeUsed = user ? user.timeUsed : guestTimeUsed;
    const timeLimit = user ? user.timeLimit : 30; // 30 minutes for guests

    if (currentTimeUsed + fileDuration > timeLimit) {
      const remainingTime = timeLimit - currentTimeUsed;
      setError(
        `Not enough time remaining. You need ${fileDuration.toFixed(
          1
        )} minutes but only have ${remainingTime.toFixed(1)} minutes left.`
      );
      setShowPricing(true);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setTranscriptionProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("audio", uploadedFile);
      formData.append("model", transcriptionModel);
      formData.append("noise_reduction", noiseReduction.toString());
      formData.append("grammar_correction", grammarCorrection.toString());

      // Start transcription job
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start transcription");
      }

      const result = await response.json();
      setCurrentJobId(result.job_id);
    } catch (err) {
      setError(err.message || "Failed to transcribe audio. Please try again.");
      setIsProcessing(false);
    }
  };

  const downloadTranscript = async (format) => {
    if (!transcriptionResult) return;

    if (format === "txt") {
      // Download from backend if available
      if (transcriptionResult.jobId) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/transcribe/${transcriptionResult.jobId}/download`
          );
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${transcriptionResult.filename}_transcript.txt`;
            a.click();
            URL.revokeObjectURL(url);
            return;
          }
        } catch (err) {
          console.error("Error downloading from backend:", err);
        }
      }

      // Fallback to client-side download
      const { transcript, filename } = transcriptionResult;
      const baseFilename = filename.split(".")[0];
      const blob = new Blob([transcript], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseFilename}_transcript.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "pdf") {
      const { transcript, filename } = transcriptionResult;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Transcript - ${filename}</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
              <h1 style="color: #333;">Transcript: ${filename}</h1>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Language:</strong> ${selectedLanguage}</p>
                <p><strong>Duration:</strong> ${fileDuration.toFixed(
                  1
                )} minutes</p>
                <p><strong>Model:</strong> ${transcriptionModel}</p>
                <p><strong>Confidence:</strong> ${Math.round(
                  transcriptionResult.confidence * 100
                )}%</p>
                <p><strong>Date:</strong> ${transcriptionResult.timestamp.toLocaleDateString()}</p>
              </div>
              <div style="border-top: 2px solid #333; padding-top: 20px;">
                <p style="font-size: 16px; white-space: pre-wrap;">${transcript}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } else if (format === "docx") {
      const { transcript, filename } = transcriptionResult;
      const baseFilename = filename.split(".")[0];
      const htmlContent = `
        <html>
          <head><meta charset="utf-8"><title>Transcript - ${filename}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Transcript: ${filename}</h1>
            <p><strong>Language:</strong> ${selectedLanguage}</p>
            <p><strong>Duration:</strong> ${fileDuration.toFixed(1)} minutes</p>
            <p><strong>Model:</strong> ${transcriptionModel}</p>
            <p><strong>Date:</strong> ${transcriptionResult.timestamp.toLocaleDateString()}</p>
            <hr>
            <p style="line-height: 1.6; white-space: pre-wrap;">${transcript}</p>
          </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseFilename}_transcript.doc`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const canDownloadFormat = (format) => {
    if (!user) return format === "txt";
    if (user.plan === "free") return format === "txt";
    return true;
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const currentTimeUsed = user ? user.timeUsed : guestTimeUsed;
  const timeLimit = user ? user.timeLimit : 30;
  const timeRemaining = Math.max(0, timeLimit - currentTimeUsed);
  const usagePercentage = (currentTimeUsed / timeLimit) * 100;

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
                  TranscribeAI Pro
                </h1>
                <p className="text-xs text-gray-500">
                  AI-Powered Transcription with Whisper & Gemini
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Backend Status Indicator */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    backendStatus.connected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-xs text-gray-500">
                  {backendStatus.connected
                    ? backendStatus.models_loaded
                      ? "Ready"
                      : "Loading..."
                    : "Offline"}
                </span>
              </div>

              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {formatTime(timeRemaining)} left
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Hi, {user.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="bg-white/80"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
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
                      <span className="text-sm font-medium text-gray-700">
                        {formatTime(timeRemaining)} free
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">No account needed</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="bg-white/80"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                  <Button onClick={() => setIsAuthOpen(true)}>
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
            <Brain className="h-4 w-4" />
            <span>Advanced AI Transcription</span>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
            Professional Audio Transcription
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your audio files and get accurate, AI-powered transcriptions
            using Whisper and Gemini models. Features noise reduction, grammar
            correction, and voice commands.
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
                  <h3 className="font-semibold text-gray-900">
                    Transcription Time
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatTime(currentTimeUsed)} used of{" "}
                    {formatTime(timeLimit)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-gray-500">remaining</div>
              </div>
            </div>
            <Progress value={usagePercentage} className="h-3" />
            {usagePercentage > 80 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ You're running low on transcription time.{" "}
                  <button
                    onClick={() => setShowPricing(true)}
                    className="font-medium underline hover:no-underline"
                  >
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
                  <div className="flex items-center gap-3 text-xl font-semibold">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    Upload Audio File
                  </div>

                  <div className="flex items-center gap-4">
                    <Select
                      value={selectedLanguage}
                      onChange={setSelectedLanguage}
                      className="w-48 bg-white/80"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </Select>

                    <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-lg border">
                      {transcriptionModel === "whisper" ? (
                        <Mic className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Brain className="h-4 w-4 text-purple-600" />
                      )}
                      <span className="text-sm font-medium capitalize">
                        {transcriptionModel}
                      </span>
                    </div>
                  </div>
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
                    //accept="audio/*,video/mp4"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={timeRemaining <= 0}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer block ${
                      timeRemaining <= 0 ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {timeRemaining > 0 ? "" : "Time limit reached"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {timeRemaining > 0
                        ? "or click to browse your files"
                        : "Please upgrade to continue transcribing"}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                      <span className="bg-white/80 px-2 py-1 rounded">MP3</span>
                      <span className="bg-white/80 px-2 py-1 rounded">WAV</span>
                      <span className="bg-white/80 px-2 py-1 rounded">M4A</span>
                      <span className="bg-white/80 px-2 py-1 rounded">OGG</span>
                      <span className="bg-white/80 px-2 py-1 rounded">MP4</span>
                      <span className="bg-white/80 px-2 py-1 rounded">
                        FLAC
                      </span>
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
                          <h4 className="font-semibold text-gray-900">
                            {uploadedFile.name}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>
                              {(uploadedFile.size / (1024 * 1024)).toFixed(1)}{" "}
                              MB
                            </span>
                            <span>•</span>
                            <span>{formatTime(fileDuration)} duration</span>
                            <span>•</span>
                            <span className="flex items-center">
                              {
                                LANGUAGES.find(
                                  (l) => l.code === selectedLanguage
                                )?.flag
                              }{" "}
                              {
                                LANGUAGES.find(
                                  (l) => l.code === selectedLanguage
                                )?.name
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleTranscribe}
                        disabled={
                          isProcessing ||
                          timeRemaining < fileDuration ||
                          !backendStatus.connected
                        }
                        variant="gradient"
                        className="px-6 py-2 shadow-lg"
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
                          ⚠️ Not enough time remaining. Need{" "}
                          {formatTime(fileDuration)} but only have{" "}
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
                        {transcriptionModel === "whisper" ? (
                          <Mic className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Brain className="h-6 w-6 text-purple-600" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Transcribing with{" "}
                      {transcriptionModel === "whisper" ? "Whisper" : "Gemini"}
                      ...
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {transcriptionModel === "whisper"
                        ? "Using OpenAI Whisper for high-accuracy transcription"
                        : "Using Google Gemini for advanced AI transcription"}
                    </p>

                    {/* Progress Bar */}
                    <div className="max-w-md mx-auto mb-4">
                      <Progress value={transcriptionProgress} className="h-2" />
                      <p className="text-sm text-gray-500 mt-2">
                        {transcriptionProgress}% complete
                      </p>
                    </div>

                    <div className="mt-4 bg-blue-50 rounded-lg p-3 max-w-md mx-auto">
                      <p className="text-sm text-blue-700">
                        ✨ Processing with{" "}
                        {noiseReduction
                          ? "noise reduction"
                          : "standard quality"}
                        {grammarCorrection && " + grammar correction"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <p className="text-red-700">{error}</p>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Features */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Advanced Features
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Whisper & Gemini AI
                    </h4>
                    <p className="text-sm text-gray-600">
                      Choose between OpenAI Whisper and Google Gemini models
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Noise Reduction
                    </h4>
                    <p className="text-sm text-gray-600">
                      Advanced audio preprocessing for cleaner transcription
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Grammar Correction
                    </h4>
                    <p className="text-sm text-gray-600">
                      Automatic grammar and punctuation correction
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Voice Commands
                    </h4>
                    <p className="text-sm text-gray-600">
                      Support for "full stop", "comma", "next paragraph"
                      commands
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!user && (
              <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold mb-2">Get 6x More Time!</h3>
                  <p className="text-blue-100 mb-4">
                    Sign up for free and get 3 hours of transcription time
                  </p>
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
                  <div className="flex items-center gap-3 text-xl font-semibold">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    Transcription Complete
                  </div>
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
                      {transcriptionModel === "whisper" ? (
                        <Mic className="h-4 w-4" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                      {transcriptionModel === "whisper" ? "Whisper" : "Gemini"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {Math.round(transcriptionResult.confidence * 100)}%
                      confidence
                    </span>
                    <span>
                      {transcriptionResult.timestamp.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTranscript("txt")}
                    className="bg-white/80"
                  >
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
                      <h4 className="font-semibold text-gray-900">
                        Unlock Premium Downloads
                      </h4>
                      <p className="text-sm text-gray-600">
                        Sign up to download as PDF and Word documents, plus get
                        3 hours of free transcription time!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Auth Modal */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title={authMode === "login" ? "Welcome Back!" : "Get Started Free"}
      >
        <Tabs activeTab={authMode} onTabChange={setAuthMode}>
          <TabsList activeTab={authMode} onTabChange={setAuthMode}>
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" activeTab={authMode}>
            <LoginForm onLogin={handleLogin} />
          </TabsContent>
          <TabsContent value="signup" activeTab={authMode}>
            <SignupForm onSignup={handleSignup} />
          </TabsContent>
        </Tabs>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Transcription Settings"
        size="lg"
      >
        <SettingsPanel
          transcriptionModel={transcriptionModel}
          setTranscriptionModel={setTranscriptionModel}
          noiseReduction={noiseReduction}
          setNoiseReduction={setNoiseReduction}
          grammarCorrection={grammarCorrection}
          setGrammarCorrection={setGrammarCorrection}
          backendStatus={backendStatus}
        />
      </Modal>

      {/* Pricing Modal */}
      <Modal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        title="Choose Your Plan"
        size="xl"
      >
        <PricingPlans user={user} onClose={() => setShowPricing(false)} />
      </Modal>
    </div>
  );
}

// Settings Panel Component
function SettingsPanel({
  transcriptionModel,
  setTranscriptionModel,
  noiseReduction,
  setNoiseReduction,
  grammarCorrection,
  setGrammarCorrection,
  backendStatus,
}) {
  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          AI Model Selection
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setTranscriptionModel("whisper")}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
              transcriptionModel === "whisper"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <Mic className="h-6 w-6 text-blue-600" />
              <h4 className="font-semibold text-gray-900">OpenAI Whisper</h4>
            </div>
            <p className="text-sm text-gray-600">
              State-of-the-art speech recognition with high accuracy for
              multiple languages
            </p>
            <div className="mt-2">
              <Badge
                variant={backendStatus.models_loaded ? "success" : "outline"}
              >
                {backendStatus.models_loaded ? "Ready" : "Loading..."}
              </Badge>
            </div>
          </div>

          <div
            onClick={() => setTranscriptionModel("gemini")}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
              transcriptionModel === "gemini"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Google Gemini</h4>
            </div>
            <p className="text-sm text-gray-600">
              Advanced multimodal AI with superior context understanding and
              formatting
            </p>
            <div className="mt-2">
              <Badge variant="success">Ready</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Options */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Processing Options
        </h3>
        <div className="space-y-4">
          <Checkbox
            checked={noiseReduction}
            onChange={setNoiseReduction}
            label="Enable Noise Reduction"
            className="p-3 border rounded-lg hover:bg-gray-50"
          />
          <p className="text-sm text-gray-600 ml-6">
            Automatically remove background noise and enhance audio quality
            before transcription
          </p>

          <Checkbox
            checked={grammarCorrection}
            onChange={setGrammarCorrection}
            label="Enable Grammar Correction"
            className="p-3 border rounded-lg hover:bg-gray-50"
          />
          <p className="text-sm text-gray-600 ml-6">
            Automatically correct grammar, punctuation, and formatting in the
            final transcript
          </p>
        </div>
      </div>

      {/* Voice Commands Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Supported Voice Commands
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>"full stop"</strong> → .
              </p>
              <p>
                <strong>"comma"</strong> → ,
              </p>
              <p>
                <strong>"question mark"</strong> → ?
              </p>
            </div>
            <div>
              <p>
                <strong>"next paragraph"</strong> → ¶
              </p>
              <p>
                <strong>"semicolon"</strong> → ;
              </p>
              <p>
                <strong>"colon"</strong> → :
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Status */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Status
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Backend Connection</span>
            <Badge variant={backendStatus.connected ? "success" : "outline"}>
              {backendStatus.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">AI Models</span>
            <Badge
              variant={backendStatus.models_loaded ? "success" : "outline"}
            >
              {backendStatus.models_loaded ? "Loaded" : "Loading..."}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

// Login Form Component
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Login to Account
      </Button>
    </form>
  );
}

// Signup Form Component
function SignupForm({ onSignup }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSignup(name, email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          required
        />
      </div>
      <div>
        <Label htmlFor="signup-email">Email Address</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          required
        />
      </div>
      <Button type="submit" variant="gradient" className="w-full">
        Create Free Account
      </Button>
      <p className="text-xs text-gray-500 text-center">
        Get 3 hours of free transcription time instantly!
      </p>
    </form>
  );
}

// Pricing Plans Component
function PricingPlans({ user, onClose }) {
  const handleUpgrade = (planName) => {
    alert(
      `Upgrading to ${planName} plan! This would integrate with Stripe/PayPal in a real app.`
    );
    onClose();
  };

  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-2">
          Unlock More Transcription Time
        </h3>
        <p className="text-gray-600 text-lg">
          Choose the perfect plan for your needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
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
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.color} mb-4`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600 text-lg">/month</span>
                  )}
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.floor(plan.timeLimit / 60)}
                  </span>
                  <span className="text-gray-600 ml-1">
                    hours of transcription
                  </span>
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
                {user?.plan === plan.name.toLowerCase()
                  ? "Current Plan"
                  : `Choose ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-2">
            🔒 Enterprise Solutions Available
          </h4>
          <p className="text-gray-600">
            Need custom solutions, API access, or higher limits? Contact us for
            enterprise pricing and features.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
