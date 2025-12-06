"use client";

import { useState, useEffect } from "react";
import { useStackApp, useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building, Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Home } from "lucide-react";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

export default function ProviderRegistrationClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [state, setState] = useState<{ error?: string; success?: boolean; message?: string }>();
  const [isPending, setIsPending] = useState(false);
  const [emailCheckMessage, setEmailCheckMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const app = useStackApp();
  const router = useRouter();
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
        } catch (error) {
          console.error('Error checking session:', error);
        }
      }
    };
    checkAuthAndRedirect();
  }, [user, router]);

  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-bold">Provider Sign Up</h1>
    </div>
  );
}