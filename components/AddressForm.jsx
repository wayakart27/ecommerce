"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(11, { message: "Please enter a valid phone number" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
});

export const AddressForm = ({ 
  onSubmit, 
  onCancel, 
  defaultValues, 
  isProcessing 
}) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Doe"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
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
                <FormLabel className="text-gray-700">Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="08012345678"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main Street"
                  className="bg-white border-gray-300 text-gray-700"
                  disabled={isProcessing}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Damaturu"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">State</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Yobe"
                    className="bg-white border-gray-300 text-gray-700"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            className="text-gray-700"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white"
          >
            {defaultValues ? "Update Address" : "Save Address"}
          </Button>
        </div>
      </form>
    </Form>
  );
};