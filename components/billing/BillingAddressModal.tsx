import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Phone, Edit, PlusCircle } from 'lucide-react';
import BillingAddressForm from './BillingAddressForm';
import * as z from 'zod';

export type BillingAddress = {
  id?: string;
  name: string;
  company?: string;
  vatId?: string;
  taxId?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  isDefault: boolean;
};

interface BillingAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingAddress?: BillingAddress | null;
  onAddressUpdate: (address: BillingAddress) => void;
}

export function BillingAddressModal({ 
  isOpen, 
  onClose, 
  billingAddress,
  onAddressUpdate
}: BillingAddressModalProps) {
  const [isEditing, setIsEditing] = useState(!billingAddress);

  const handleSuccess = (updatedAddress: BillingAddress) => {
    onAddressUpdate(updatedAddress);
    setIsEditing(false);
  };

  // Find the full country name based on ISO code
  const getCountryName = (countryCode: string): string => {
    const countries = [
      { value: 'IT', label: 'Italy' },
      { value: 'DE', label: 'Germany' },
      { value: 'FR', label: 'France' },
      { value: 'ES', label: 'Spain' },
      { value: 'GB', label: 'United Kingdom' },
      { value: 'US', label: 'United States' },
      { value: 'CA', label: 'Canada' },
    ];
    
    const country = countries.find(c => c.value === countryCode);
    return country ? country.label : countryCode;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEditing 
              ? billingAddress 
                ? 'Edit Billing Address' 
                : 'Add Billing Address'
              : 'Billing Address'
            }
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Enter your billing address details for receipts and invoices'
              : 'This address will be used for your receipts and invoices'
            }
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <BillingAddressForm 
            defaultAddress={billingAddress || undefined}
            onSuccess={handleSuccess}
            onCancel={() => {
              if (billingAddress) {
                setIsEditing(false);
              } else {
                onClose();
              }
            }}
            isModal
          />
        ) : billingAddress ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{billingAddress.name}</h3>
                  {billingAddress.company && (
                    <div className="flex items-center text-gray-600 mt-1">
                      <Building2 className="w-4 h-4 mr-2" />
                      <span>{billingAddress.company}</span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
              
              {(billingAddress.vatId || billingAddress.taxId) && (
                <div className="space-y-1 border-t pt-2">
                  {billingAddress.vatId && (
                    <p className="text-sm">
                      <span className="font-semibold">VAT Number:</span> {billingAddress.vatId}
                    </p>
                  )}
                  {billingAddress.taxId && (
                    <p className="text-sm">
                      <span className="font-semibold">Tax ID:</span> {billingAddress.taxId}
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-2 mt-4 border-t pt-3">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 mr-2" />
                  <div>
                    <p>{billingAddress.address.line1}</p>
                    {billingAddress.address.line2 && <p>{billingAddress.address.line2}</p>}
                    <p>
                      {billingAddress.address.postalCode} {billingAddress.address.city}
                      {billingAddress.address.state && `, ${billingAddress.address.state}`}
                    </p>
                    <p>{getCountryName(billingAddress.address.country)}</p>
                  </div>
                </div>
                
                {billingAddress.phone && (
                  <div className="flex items-center mt-2">
                    <Phone className="w-4 h-4 text-gray-500 mr-2" />
                    <span>{billingAddress.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={onClose}
                className="bg-primary hover:bg-primary/90"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <PlusCircle className="w-16 h-16 text-primary/30 mb-4" />
            <p className="text-lg text-gray-500 mb-6">
              No billing address configured
            </p>
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:bg-primary/90"
            >
              Add Address
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 