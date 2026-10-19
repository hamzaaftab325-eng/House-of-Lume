"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { cx } from "@/lib/cx";

import { IconButton } from "./controls";
import styles from "./overlays.module.css";

function useNativeDialog(open: boolean, onOpenChange: (open: boolean) => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => onOpenChange(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onOpenChange]);

  return ref;
}

type DwelluneDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  size?: "default" | "search";
};

export function DwelluneDialog({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  children,
  size = "default",
}: DwelluneDialogProps) {
  const ref = useNativeDialog(open, onOpenChange);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cx(styles.dialog, size === "search" && styles.dialogSearch)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <header className={styles.dialogHeader}>
        <div>
          {eyebrow ? <p className={styles.dialogEyebrow}>{eyebrow}</p> : null}
          <h2 className={styles.dialogTitle} id={titleId}>
            {title}
          </h2>
          {description ? (
            <p className={styles.dialogDescription} id={descriptionId}>
              {description}
            </p>
          ) : null}
        </div>
        <IconButton label={`Close ${title}`} icon={<X />} onClick={() => onOpenChange(false)} />
      </header>
      <div className={styles.dialogBody}>{children}</div>
    </dialog>
  );
}

type DrawerProps = Omit<DwelluneDialogProps, "size"> & {
  side?: "left" | "right";
  footer?: ReactNode;
};

export function Drawer({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  children,
  footer,
  side = "right",
}: DrawerProps) {
  const ref = useNativeDialog(open, onOpenChange);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cx(styles.drawer, side === "right" ? styles.drawerRight : styles.drawerLeft)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <header className={styles.drawerHeader}>
        <div>
          {eyebrow ? <p className={styles.drawerEyebrow}>{eyebrow}</p> : null}
          <h2 className={styles.drawerTitle} id={titleId}>
            {title}
          </h2>
          {description ? (
            <p className={styles.drawerDescription} id={descriptionId}>
              {description}
            </p>
          ) : null}
        </div>
        <IconButton label={`Close ${title}`} icon={<X />} onClick={() => onOpenChange(false)} />
      </header>
      <div className={styles.drawerBody}>
        {children}
        {footer ? <div className={styles.drawerFooter}>{footer}</div> : null}
      </div>
    </dialog>
  );
}
