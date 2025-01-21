"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { Button } from "@/components/ui/button";
import { PropertyModal } from "./property-modal";

export function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const titles = useMemo(
    () => ["Monitor", "Predict", "Automate", "Save money"],
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleNumber((prev) => (prev + 1) % titles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [titles.length]);

  return (
    <HeroHighlight>
      <div className="w-full">
        <div className="container mx-auto">
          <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
            <div className="flex gap-4 flex-col items-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular"
              >
                <span className="text-spektr-cyan-50">Replai</span>
              </motion.h1>
              <div className="text-3xl md:text-5xl max-w-2xl tracking-tighter text-center font-regular mt-4">
                <span className="relative inline-block w-64 h-12 overflow-hidden">
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="absolute left-0 right-0"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{
                        opacity: titleNumber === index ? 1 : 0,
                        y: titleNumber === index ? 0 : 50,
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <Highlight>{title}</Highlight>
                    </motion.span>
                  ))}
                </span>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center mt-4"
              >
                Connect your first property to start managing your reviews
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Button
                  size="lg"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-8"
                >
                  Connect property
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <PropertyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </HeroHighlight>
  );
}

