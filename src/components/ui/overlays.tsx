"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Search, X } from "lucide-react";

import { cx } from "@/lib/cx";

import { IconButton, LumeButton } from "./controls";
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

type LumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  size?: "default" | "search";
};

export function LumeDialog({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  children,
  size = "default",
}: LumeDialogProps) {
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

type DrawerProps = Omit<LumeDialogProps, "size"> & {
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

type AccordionProps = { children: ReactNode; className?: string };

export function Accordion({ children, className }: AccordionProps) {
  return <div className={cx(styles.accordion, className)}>{children}</div>;
}

type AccordionItemProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  return (
    <details className={styles.accordionItem} open={defaultOpen || undefined}>
      <summary className={styles.accordionSummary}>
        <span>{title}</span>
        <ChevronDown className={styles.accordionChevron} aria-hidden="true" />
      </summary>
      <div className={styles.accordionContent}>{children}</div>
    </details>
  );
}

type TabItem = { id: string; label: string; content: ReactNode };

type TabsProps = {
  label: string;
  items: TabItem[];
  defaultValue?: string;
};

export function Tabs({ label, items, defaultValue }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.id ?? "");
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    const item = items[nextIndex];
    if (!item) return;
    setActive(item.id);
    refs.current[nextIndex]?.focus();
  };

  const activeItem = items.find((item) => item.id === active) ?? items[0];

  return (
    <div>
      <div className={styles.tabsList} role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            className={styles.tab}
            id={`${baseId}-${item.id}-tab`}
            role="tab"
            type="button"
            aria-controls={`${baseId}-${item.id}-panel`}
            aria-selected={activeItem?.id === item.id}
            tabIndex={activeItem?.id === item.id ? 0 : -1}
            onClick={() => setActive(item.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {activeItem ? (
        <div
          className={styles.tabPanel}
          id={`${baseId}-${activeItem.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-${activeItem.id}-tab`}
          tabIndex={0}
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}

type SearchOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const searchDestinations = [
  ["01", "Warm lighting", "/#lighting"],
  ["02", "Living green", "/#living-green"],
  ["03", "Objects & materials", "/#objects"],
] as const;

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  return (
    <LumeDialog
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Search House of Lume"
      title="Find an object by name."
      description="Search checks the live published catalogue and returns only products currently available to the storefront."
      size="search"
    >
      <form className={styles.searchForm} action="/search" method="get" role="search">
        <div>
          <label className="sr-only" htmlFor="global-search">
            Search House of Lume
          </label>
          <input
            autoFocus
            className={styles.searchInput}
            id="global-search"
            name="q"
            type="search"
            placeholder="Try ‘lamp’ or ‘olive’"
            minLength={2}
            maxLength={80}
            autoComplete="off"
            required
          />
        </div>
        <LumeButton type="submit" showArrow>
          Search
        </LumeButton>
      </form>
      <nav className={styles.searchSuggestions} aria-label="Quick search destinations">
        {searchDestinations.map(([index, label, href]) => (
          <Link
            key={index}
            className={styles.searchSuggestion}
            href={href}
            onClick={() => onOpenChange(false)}
          >
            <span className={styles.searchIndex}>{index}</span>
            <span>{label}</span>
            <Search aria-hidden="true" size={16} />
          </Link>
        ))}
      </nav>
    </LumeDialog>
  );
}

export function EmptyDrawerState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
