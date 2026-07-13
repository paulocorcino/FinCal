"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return (
    <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
  );
}

function AlertDialogTrigger({
  ...props
}: AlertDialogPrimitive.Trigger.Props) {
  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      {...props}
    />
  );
}

function AlertDialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <DialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border bg-popover bg-clip-padding p-6 text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </AlertDialogPortal>
  );
}

function AlertDialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-base font-medium text-foreground", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}: DialogPrimitive.Close.Props) {
  return (
    <DialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      render={
        <Button type="button" variant="outline" className={className} />
      }
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="submit"
      data-slot="alert-dialog-action"
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
        className
      )}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
};
