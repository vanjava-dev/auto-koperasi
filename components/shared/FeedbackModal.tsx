"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedbackType = "success" | "warning" | "error";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: FeedbackType;
  title: string;
  description?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

/**
 * FeedbackModal — Komponen global pengganti mutlak fungsi `alert()` peramban.
 * Mengusung estetika Tabler UI dengan pusat ikon raksasa semitransparan di tengah atas.
 * Mematuhi SOP UI/UX Koperasi-AI Dokumen 09 Bagian 3.2.
 */
export function FeedbackModal({
  isOpen,
  onClose,
  type,
  title,
  description,
  primaryActionLabel = "Tutup",
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: FeedbackModalProps) {
  // Menentukan warna dan ikon berdasarkan tipe feedback
  const config = {
    success: {
      icon: CheckCircle2,
      bgClass: "bg-emerald-50 text-emerald-600",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    warning: {
      icon: AlertTriangle,
      bgClass: "bg-amber-50 text-amber-600",
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    error: {
      icon: XCircle,
      bgClass: "bg-rose-50 text-rose-600",
      btnClass: "bg-rose-600 hover:bg-rose-700 text-white",
    },
  }[type];

  const IconComponent = config.icon;

  const handlePrimaryClick = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      onClose();
    }
  };

  const handleSecondaryClick = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 text-center border-none shadow-2xl">
        {/* Ikon Visual Raksasa di Tengah Atas */}
        <div className="flex justify-center mb-2">
          <div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 scale-100 animate-in zoom-in-90",
              config.bgClass
            )}
          >
            <IconComponent className="w-10 h-10 stroke-[2]" />
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-slate-900">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-center text-slate-500 mt-2 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2 mt-6 w-full">
          {secondaryActionLabel && (
            <Button
              variant="outline"
              className="w-full sm:w-auto min-w-[120px]"
              onClick={handleSecondaryClick}
            >
              {secondaryActionLabel}
            </Button>
          )}
          <Button
            className={cn("w-full sm:w-auto min-w-[120px]", config.btnClass)}
            onClick={handlePrimaryClick}
          >
            {primaryActionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
