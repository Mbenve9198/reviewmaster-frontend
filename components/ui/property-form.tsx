"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PropertyFormProps {
  onNext: () => void;
}

export function PropertyForm({ onNext }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    managerSignature: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Property Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="type">Property Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="b&b">B&B</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your property and its unique features"
          rows={4}
        />
      </div>
      <div>
        <Label htmlFor="managerSignature">Manager Signature</Label>
        <Input
          id="managerSignature"
          name="managerSignature"
          value={formData.managerSignature}
          onChange={handleChange}
          placeholder="This will be used to personalize AI-generated review responses"
          required
        />
      </div>
      <Button type="submit" className="w-full">Next</Button>
    </form>
  );
}

