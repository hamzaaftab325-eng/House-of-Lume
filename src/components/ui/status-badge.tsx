import { cva, type VariantProps } from "class-variance-authority";

import { cx } from "@/lib/cx";

import styles from "./status-badge.module.css";

const badgeVariants = cva(styles.badge, {
  variants: {
    tone: {
      neutral: styles.neutral,
      success: styles.success,
      warning: styles.warning,
      error: styles.error,
      info: styles.info,
      bronze: styles.bronze,
    },
  },
  defaultVariants: { tone: "neutral" },
});

type StatusBadgeProps = VariantProps<typeof badgeVariants> & {
  children: React.ReactNode;
  className?: string;
};

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return <span className={cx(badgeVariants({ tone }), className)}>{children}</span>;
}
