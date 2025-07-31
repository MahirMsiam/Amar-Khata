// Signup form component with authentication and user profile logic
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
import { auth } from "@/lib/firebase";
import { updateUserProfileInDatabase } from "@/services/actions";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Loader2 } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
    },
  });

  // Function to get user-friendly error messages for signup
  const getSignupErrorMessage = useCallback((errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return t.emailAlreadyInUse || "An account with this email already exists. Please use a different email or try logging in.";
      case 'auth/weak-password':
        return t.weakPassword || "The password is too weak. Please choose a stronger password with at least 6 characters.";
      case 'auth/invalid-email':
        return "Please enter a valid email address.";
      case 'auth/operation-not-allowed':
        return "Email/password accounts are not enabled. Please contact support.";
      case 'auth/network-request-failed':
        return t.networkError || "Network error. Please check your internet connection and try again.";
      case 'auth/too-many-requests':
        return t.tooManyRequests || "Too many signup attempts. Please wait a few minutes before trying again.";
      case 'auth/admin-restricted-operation':
        return "This operation is restricted. Please contact an administrator.";
      default:
        return "Signup failed. Please try again or contact support if the problem persists.";
    }
  }, [t]);

  // Handle form submission and sign up with Firebase Auth
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Call Firebase Auth API to create a new user
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      // Update the user's display name in Firebase Auth
      await updateProfile(user, { displayName: values.name });
      
      // Save additional user profile info in the database
      await updateUserProfileInDatabase(user, {
        name: values.name,
        email: values.email,
        phone: values.phone,
      });
      
      toast({
        title: "Account Created",
        description: "Your account has been successfully created. Welcome!",
      });
      
      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Safely get error message without causing infinite loops
      let errorMessage = "An unexpected error occurred during signup. Please try again.";
      
      if (error?.code && typeof error.code === 'string') {
        try {
          errorMessage = getSignupErrorMessage(error.code);
        } catch (msgError) {
          console.error('Error getting signup message:', msgError);
          errorMessage = "An unexpected error occurred during signup. Please try again.";
        }
      }
      
      // Show error toast if sign up fails
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#232946]">
      <div className="backdrop-blur-sm bg-white/10 border border-white/10 rounded-2xl p-8 w-full max-w-lg flex flex-col items-center">
        <h1 className="text-3xl font-bold font-headline text-white mb-6">{t.signup}</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
            {/* Name input field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">{t.name}</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} className="bg-white/10 text-white placeholder-white/60 border-white/30 focus:ring-2 focus:ring-[#1CA24C]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Phone input field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">{t.phone}</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} className="bg-white/10 text-white placeholder-white/60 border-white/30 focus:ring-2 focus:ring-[#1CA24C]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              {t.signup}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm text-white/80">
          {t.signupPrompt} {" "}
          <Link href="/login" className="underline text-white font-semibold">
            {t.login}
          </Link>
        </div>
      </div>
    </div>
  );
}
