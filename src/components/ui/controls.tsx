import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Route } from "next";
import Link, { type LinkProps } from "next/link";
import { ArrowRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cx } from "@/lib/cx";

import styles from "./controls.module.css";

const buttonVariants = cva(styles.button, {
  variants: {
    variant: {
      primary: styles.primary,
      frame: styles.frame,
      quiet: styles.quiet,
    },
    shape: {
      soft: undefined,
      square: styles.square,
    },
    size: {
      normal: undefined,
      compact: styles.compact,
    },
  },
  defaultVariants: {
    variant: "primary",
    shape: "soft",
    size: "normal",
  },
});

type ButtonVisualProps = VariantProps<typeof buttonVariants> & {
  showArrow?: boolean;
};

type DwelluneButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonVisualProps;

type TypedLinkProps = LinkProps<Route>;

export function DwelluneButton({
  className,
  variant,
  shape,
  size,
  showArrow = false,
  children,
  type = "button",
  ...props
}: DwelluneButtonProps) {
  return (
    <button
      className={cx(buttonVariants({ variant, shape, size }), className)}
      type={type}
      {...props}
    >
      <span>{children}</span>
      {showArrow ? <ArrowRight className={styles.arrow} aria-hidden="true" /> : null}
    </button>
  );
}

type DwelluneButtonLinkProps = TypedLinkProps &
  ButtonVisualProps & {
    children: ReactNode;
    className?: string;
  };

export function DwelluneButtonLink({
  className,
  variant,
  shape,
  size,
  showArrow = false,
  children,
  ...props
}: DwelluneButtonLinkProps) {
  return (
    <Link className={cx(buttonVariants({ variant, shape, size }), className)} {...props}>
      <span>{children}</span>
      {showArrow ? <ArrowRight className={styles.arrow} aria-hidden="true" /> : null}
    </Link>
  );
}

type DwelluneLinkProps = TypedLinkProps & {
  children: ReactNode;
  className?: string;
};

export function DwelluneLink({ className, children, ...props }: DwelluneLinkProps) {
  return (
    <Link className={cx(styles.link, className)} {...props}>
      <span>{children}</span>
      <span className={styles.linkRule} aria-hidden="true" />
      <ArrowRight className={styles.arrow} aria-hidden="true" />
    </Link>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  label: string;
  icon: ReactNode;
  count?: number;
  emphasis?: "plain" | "soft";
};

export function IconButton({
  label,
  icon,
  count,
  emphasis = "plain",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cx(styles.iconButton, className)}
      data-emphasis={emphasis}
      type={type}
      {...props}
    >
      {icon}
      {typeof count === "number" && count > 0 ? (
        <span className={styles.count} aria-label={`${count} items`}>
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}

type DwelluneLineProps = {
  axis?: "horizontal" | "vertical";
  tone?: "ink" | "bronze" | "olive";
  className?: string;
};

export function DwelluneLine({ axis = "horizontal", tone = "ink", className }: DwelluneLineProps) {
  return (
    <span
      className={cx(
        styles.line,
        axis === "horizontal" ? styles.lineHorizontal : styles.lineVertical,
        tone === "ink" ? styles.lineInk : tone === "bronze" ? styles.lineBronze : styles.lineOlive,
        className,
      )}
      aria-hidden="true"
    />
  );
}
