"use client";

import { useState, useEffect } from "react";
import { useStackApp, useUser } from "@stackframe/stack";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, Home, CheckCircle } from "lucide-react";
import EmailVerificationModal from "@/components/EmailVerificationModal";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

export default function LoginClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [verificationData, setVerificationData] = useState<null | { userId: string; firstName?: string; lastName?: string }>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const app = useStackApp();
  const user = useUser();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (user) {
        try {
          const response = await fetch('/api/auth/session', { credentials: 'include' });
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const userRole = result.data.role;
              switch (userRole) {
                case 'admin':
                  router.replace('/admin/dashboard');
                  return;
                case 'provider':
                  router.replace('/provider/dashboard');
                  return;
                case 'agent':
                  router.replace('/agent/dashboard');
                  return;
                case 'student':
                default:
                  router.replace('/student/dashboard');
                  return;
              }
            }
          }
        } catch (err) {
          console.error('Error checking session:', err);
        }
      }
    };
    checkAuthAndRedirect();
  }, [user, router]);

  useEffect(() => {
    const verified = searchParams.get('verified');
    const errorParam = searchParams.get('error');
    if (verified === 'true') {
      setSuccessMessage("Email verified successfully! You can now sign in.");
      window.history.replaceState({}, '', '/auth/login');
    }
    if (errorParam === 'email-not-verified') {
      setError("Please verify your email before signing in. Check your inbox for the verification link.");
    }
  }, [searchParams]);

  // Remaining login UI and submit handling should mirror the original page implementation
  return (
    <div className="min-h-screen">
      {/* Replace with the original JSX form and modals */}
      <h1 className="text-2xl font-bold">Sign In</h1>
    </div>
  );
}
