import { useState, useEffect } from 'react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/lib/utils";

// List of countries (showing only the most common ones for brevity)
const countries = [
  { value: 'IT', label: 'Italy' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  // Add other countries as needed
].sort((a, b) => a.label.localeCompare(b.label));

// Validation schema
const billingAddressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
  vatId: z.string().optional(),
  taxId: z.string().optional(),
  address: z.object({
    line1: z.string().min(3, "Address must be at least 3 characters"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().optional(),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(2, "Country is required"),
  }),
  phone: z.string().optional(),
  isDefault: z.boolean().default(true),
});

type BillingAddressFormValues = z.infer<typeof billingAddressSchema>;

interface BillingAddressFormProps {
  onSuccess?: (address: BillingAddressFormValues) => void;
  onCancel?: () => void;
  defaultAddress?: Partial<BillingAddressFormValues>;
  isModal?: boolean;
}

export default function BillingAddressForm({ 
  onSuccess, 
  onCancel, 
  defaultAddress, 
  isModal = false 
}: BillingAddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form setup
  const form = useForm<BillingAddressFormValues>({
    resolver: zodResolver(billingAddressSchema),
    defaultValues: {
      name: defaultAddress?.name || "",
      company: defaultAddress?.company || "",
      vatId: defaultAddress?.vatId || "",
      taxId: defaultAddress?.taxId || "",
      address: {
        line1: defaultAddress?.address?.line1 || "",
        line2: defaultAddress?.address?.line2 || "",
        city: defaultAddress?.address?.city || "",
        state: defaultAddress?.address?.state || "",
        postalCode: defaultAddress?.address?.postalCode || "",
        country: defaultAddress?.address?.country || "IT",
      },
      phone: defaultAddress?.phone || "",
      isDefault: defaultAddress?.isDefault ?? true,
    },
  });

  // Submit handler
  const onSubmit = async (values: BillingAddressFormValues) => {
    setIsSubmitting(true);
    try {
      const token = getCookie('token');
      if (!token) {
        throw new Error('You are not authenticated. Please log in.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/billing-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error saving billing address');
      }

      toast.success('Billing address saved successfully');
      
      if (onSuccess) {
        onSuccess(values);
      }
    } catch (error) {
      console.error('Error saving billing address:', error);
      toast.error(error instanceof Error ? error.message : 'Error saving address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Full Name*</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Full Name" 
                    className="rounded-xl h-11 focus:border-primary" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Company</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Company name (optional)" 
                    className="rounded-xl h-11 focus:border-primary" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vatId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">VAT Number</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="VAT number (optional)" 
                    className="rounded-xl h-11 focus:border-primary" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Tax ID</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Tax ID (optional)" 
                    className="rounded-xl h-11 focus:border-primary" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-semibold text-gray-800">Address</h3>
          
          <FormField
            control={form.control}
            name="address.line1"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Address Line 1*</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Street address" 
                    className="rounded-xl h-11 focus:border-primary" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address.line2"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Address Line 2</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Apartment, suite, etc. (optional)" 
                    className="rounded-xl h-11 focus:border-primary" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">City*</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="City" 
                      className="rounded-xl h-11 focus:border-primary" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">State/Province</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="State or province (optional)" 
                      className="rounded-xl h-11 focus:border-primary" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Postal Code*</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Postal Code" 
                      className="rounded-xl h-11 focus:border-primary" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Country*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Phone</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Phone number (optional)" 
                  className="rounded-xl h-11 focus:border-primary" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-gray-50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-gray-700">Set as default billing address</FormLabel>
                <p className="text-sm text-gray-500">
                  This address will be used for all future invoices
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              onClick={onCancel} 
              variant="outline"
              disabled={isSubmitting}
              className="rounded-xl h-11"
            >
              Cancel
            </Button>
          )}
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 rounded-xl h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Save Address
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 