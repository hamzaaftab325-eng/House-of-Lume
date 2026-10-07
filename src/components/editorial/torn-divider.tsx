import styles from "./torn-divider.module.css";

type TornDividerProps = {
  edge?: "top" | "bottom";
  variant?: "fine" | "wide" | "rough";
  className?: string;
};

const paths = {
  fine: "M0 23 L35 19 L72 24 L118 18 L164 22 L214 17 L262 25 L310 19 L358 23 L408 16 L456 22 L510 18 L562 25 L616 17 L670 21 L724 18 L778 24 L834 16 L890 22 L946 18 L1002 25 L1058 17 L1114 22 L1172 16 L1230 24 L1288 18 L1346 23 L1404 17 L1462 22 L1520 18 L1560 24 L1600 20 L1600 52 L0 52 Z",
  wide: "M0 25 L42 16 L88 23 L134 13 L182 24 L232 18 L280 27 L330 14 L380 22 L430 17 L482 26 L536 13 L590 23 L646 17 L704 25 L760 12 L816 22 L874 18 L932 28 L990 15 L1048 22 L1108 14 L1168 26 L1228 18 L1288 25 L1348 13 L1408 23 L1468 16 L1528 27 L1570 18 L1600 22 L1600 52 L0 52 Z",
  rough:
    "M0 26 L24 17 L51 24 L83 13 L119 21 L151 16 L187 29 L224 18 L260 24 L298 12 L336 27 L374 16 L414 23 L454 14 L496 28 L538 18 L580 25 L624 13 L668 27 L714 17 L760 24 L806 12 L852 28 L900 18 L948 25 L996 13 L1046 27 L1096 17 L1146 24 L1198 12 L1250 28 L1302 18 L1356 25 L1410 13 L1464 27 L1518 17 L1564 25 L1600 18 L1600 52 L0 52 Z",
} as const;

export function TornDivider({ edge = "bottom", variant = "wide", className }: TornDividerProps) {
  const classes = [styles.divider, className].filter(Boolean).join(" ");

  return (
    <span className={classes} data-edge={edge} aria-hidden="true">
      <svg viewBox="0 0 1600 52" preserveAspectRatio="none" focusable="false">
        <path d={paths[variant]} />
      </svg>
    </span>
  );
}
