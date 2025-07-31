"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { getUserProfile, updateUserProfileInDatabase } from "@/services/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  email: z.string().email(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Please confirm your new password." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      setIsFetching(true);
      getUserProfile(user.uid)
        .then((profile) => {
          if (profile) {
            form.reset({
              name: profile.name,
              phone: profile.phone,
              email: profile.email,
            });
          }
        })
        .finally(() => setIsFetching(false));
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsLoading(true);
    try {
      // Check if email is being changed
      const isEmailChanged = values.email !== user.email;
      
      if (isEmailChanged) {
        // Import updateEmail from firebase/auth
        const { updateEmail } = await import("firebase/auth");
        
        // Update email in Firebase Auth
        await updateEmail(user, values.email);
        
        toast({
          title: t.emailUpdated || "Email Updated",
          description: "Your email has been updated. Please verify your new email address.",
        });
        
        // Update profile info in database
        await updateUserProfileInDatabase(user, { 
          name: values.name, 
          phone: values.phone, 
          email: values.email 
        });
      } else {
        // Just update name and phone
        await updateUserProfileInDatabase(user, { name: values.name, phone: values.phone });
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      let errorMessage = error.message;
      
      // Handle specific email change errors
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "For security reasons, please log out and log back in before changing your email.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use by another account.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Function to get user-friendly error messages
  const getPasswordErrorMessage = useCallback((errorCode: string): string => {
    switch (errorCode) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return t.incorrectPassword || "The current password you entered is incorrect. Please try again.";
      case 'auth/weak-password':
        return t.weakPassword || "The new password is too weak. Please choose a stronger password with at least 6 characters.";
      case 'auth/requires-recent-login':
        return t.requiresRecentLogin || "For security reasons, please log out and log back in before changing your password.";
      case 'auth/too-many-requests':
        return t.tooManyRequests || "Too many failed attempts. Please wait a few minutes before trying again.";
      case 'auth/network-request-failed':
        return t.networkError || "Network error. Please check your internet connection and try again.";
      case 'auth/user-disabled':
        return t.accountDisabled || "Your account has been disabled. Please contact support.";
      case 'auth/user-not-found':
        return "User account not found. Please try logging in again.";
      case 'auth/invalid-email':
        return "Invalid email address. Please check your account settings.";
      default:
        return "Password change failed. Please try again or contact support if the problem persists.";
    }
  }, [t]);

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    if (!user || !user.email) return;
    setIsPasswordLoading(true);
    try {
      // Re-authenticate the user with current password
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, values.newPassword);
      
      toast({
        title: t.passwordUpdated,
        description: "Your password has been successfully changed.",
      });
      
      // Clear the form
      passwordForm.reset();
    } catch (error: any) {
      console.error('Password update error:', error);
      
      const errorMessage = error.code 
        ? getPasswordErrorMessage(error.code)
        : "An unexpected error occurred while changing your password. Please try again.";
      
      toast({
        variant: "destructive",
        title: t.passwordUpdateFailed,
        description: errorMessage,
      });
    } finally {
      setIsPasswordLoading(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings}</CardTitle>
          <CardDescription>Update your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.name}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.phone}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.email}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      {t.emailChangeWarning || "Changing your email will require verification and you'll need to log in again."}
                    </p>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.save}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.changePassword}</CardTitle>
          <CardDescription>Update your account password for better security.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.currentPassword}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.newPassword}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.confirmPassword}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.changePassword}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
