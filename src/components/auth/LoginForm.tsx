// Login form component with authentication logic
"use client";

import { auth } from "@/lib/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission and sign in with Firebase Auth
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Call Firebase Auth API to sign in
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      // Get the ID token
      const token = await user.getIdToken();
      // Set the token as a cookie with proper options
      document.cookie = `token=${token}; path=/; max-age=3600; SameSite=Lax;${window.location.protocol === 'https:' ? ' Secure;' : ''}`;
      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (error: any) {
      // Show error toast if sign in fails
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === "auth/user-disabled") {
        description = "Your account has been disabled. Please contact support for assistance.";
      } else if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        description = "Invalid email or password.";
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#232946]">
      <div className="backdrop-blur-sm bg-white/10 border border-white/10 rounded-2xl p-8 w-full max-w-lg flex flex-col items-center"> {/* Increased width to max-w-lg */}
        <img src="/logo.svg" alt="Amar Khata Logo" className="h-16 w-16 mb-4" />
        <h2 className="text-lg font-semibold text-white mb-1">Welcome back</h2>
        <h1 className="text-3xl font-bold font-headline text-white mb-6">{t.login}</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
            {/* Email input field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">{t.email}</FormLabel>
                  <FormControl>
                    <Input placeholder="m@example.com" {...field} className="bg-white/10 text-white placeholder-white/60 border-white/30 focus:ring-2 focus:ring-[#1CA24C]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Password input field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">{t.password}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="bg-white/10 text-white placeholder-white/60 border-white/30 focus:ring-2 focus:ring-[#1CA24C]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Submit button */}
            <Button type="submit" className="w-full bg-[#1CA24C] hover:bg-[#17913e] text-white font-semibold py-3 rounded-lg transition-all duration-150" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.login}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm text-white/80">
          {t.loginPrompt} {" "}
          <Link href="/signup" className="underline text-white font-semibold">
            {t.signup}
          </Link>
        </div>
      </div>
    </div>
  );
}
