"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertyForm } from "./property-form";
import { ImportOptions } from "./import-options";
import Image from "next/image";

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyModal({ isOpen, onClose }: PropertyModalProps) {
  const [step, setStep] = useState<"form" | "import">("form");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="absolute left-1/2 -translate-x-1/2 -top-20">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6
            }}
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hotel%20settings-s2HKj2MEZjp4XxusrFi9tQTKBnymhj.png"
              alt="Hotel Icon"
              width={100}
              height={100}
              className="w-32 h-32 object-contain"
              priority
            />
          </motion.div>
        </div>
        <DialogHeader className="pt-8">
          <DialogTitle className="text-center">
            {step === "form" ? "Connect Your Property" : "Import Reviews"}
          </DialogTitle>
        </DialogHeader>
        {step === "form" ? (
          <PropertyForm onNext={() => setStep("import")} />
        ) : (
          <ImportOptions onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

