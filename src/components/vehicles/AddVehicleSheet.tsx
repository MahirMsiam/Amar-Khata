
"use client";

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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { addVehicle, updateVehicle } from "@/services/actions";
import type { Vehicle } from "@/services/vehicleService";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  name: z.string().min(2, { message: "Vehicle name is required." }),
  plateNumber: z.string().min(1, { message: "Vehicle plate number is required." }),
  driverPhone: z.string().optional(),
  status: z.enum(["Active", "Maintenance", "Inactive"]),
});

type VehicleSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicleToEdit?: Vehicle | null;
}

export function VehicleSheet({ open, onOpenChange, vehicleToEdit }: VehicleSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const isEditMode = !!vehicleToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      plateNumber: "",
      driverPhone: "",
      status: "Active",
    },
  });

  useEffect(() => {
      if(vehicleToEdit) {
          form.reset({
              name: vehicleToEdit.name,
              plateNumber: vehicleToEdit.plateNumber,
              driverPhone: vehicleToEdit.driverPhone || "",
              status: vehicleToEdit.status,
          });
      } else {
          form.reset({
            name: "",
            plateNumber: "",
            driverPhone: "",
            status: "Active",
          });
      }
  }, [vehicleToEdit, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsLoading(true);
    try {
        if(isEditMode && vehicleToEdit) {
            await updateVehicle(user.uid, vehicleToEdit.id, values);
            toast({
                title: "Vehicle Updated",
                description: `${values.name} has been successfully updated.`,
            });
        } else {
            await addVehicle(user.uid, values);
            toast({
                title: "Vehicle Added",
                description: `${values.name} has been successfully added.`,
            });
        }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditMode ? "Failed to update vehicle." : "Failed to add vehicle.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Vehicle" : t.addVehicle}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update the vehicle details below." : "Fill in the details below to add a new vehicle to your fleet."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Rezaul Karim" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver NID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="driverPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 01712345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.save}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
