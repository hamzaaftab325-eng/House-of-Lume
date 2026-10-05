import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import styles from "./editorial.module.css";

export type ProductStageProps = {
  children: ReactNode;
  label?: string;
  action?: ReactNode;
  ratio?: "portrait" | "square" | "landscape";
  tone?: "canvas" | "paper" | "chalk" | "ink" | "olive";
  className?: string;
};

export function ProductStage({
  children,
  label,
  action,
  ratio = "portrait",
  tone = "chalk",
  className,
}: ProductStageProps) {
  const ratioClass = ratio === "portrait" ? styles.stagePortrait : ratio === "square" ? styles.stageSquare : styles.stageLandscape;
  const toneClass =
    tone === "canvas"
      ? styles.stageCanvas
      : tone === "paper"
        ? styles.stagePaper
        : tone === "ink"
          ? styles.stageInk
          : tone === "olive"
            ? styles.stageOlive
            : styles.stageChalk;

  return (
    <div className={cx(styles.stage, ratioClass, toneClass, className)}>
      {label ? <p className={styles.stageLabel}>{label}</p> : null}
      <div className={styles.stageContent}>{children}</div>
      {action ? <div className={styles.stageAction}>{action}</div> : null}
    </div>
  );
}

type ProductUnitProps = ProductStageProps & {
  index?: string;
  name: string;
  context: string;
  price: string;
};

export function ProductUnit({ index, name, context, price, ...stageProps }: ProductUnitProps) {
  return (
    <article className={styles.productUnit}>
      <ProductStage {...stageProps} />
      <div className={styles.productMeta}>
        <div>
          {index ? <p className={styles.productIndex}>{index}</p> : null}
          <h3 className={styles.productName}>{name}</h3>
          <p className={styles.productContext}>{context}</p>
        </div>
        <p className={styles.productPrice}>{price}</p>
      </div>
    </article>
  );
}

export function ShelfGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.shelf, className)}>{children}</div>;
}

type SplitPlaneProps = {
  primary: ReactNode;
  secondary: ReactNode;
  secondaryTone?: "ink" | "olive" | "bronze";
  className?: string;
};

export function SplitPlane({ primary, secondary, secondaryTone = "ink", className }: SplitPlaneProps) {
  return (
    <section
      className={cx(
        styles.splitPlane,
        secondaryTone === "olive" && styles.splitOlive,
        secondaryTone === "bronze" && styles.splitBronze,
        className,
      )}
    >
      <div className={styles.splitPrimary}>{primary}</div>
      <div className={styles.splitSecondary}>{secondary}</div>
    </section>
  );
}

export function CropWindow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.cropWindow, className)}>{children}</div>;
}

type EditorialChapterProps = {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
  media: ReactNode;
  className?: string;
};

export function EditorialChapter({ eyebrow, title, body, action, media, className }: EditorialChapterProps) {
  return (
    <section className={cx(styles.chapter, className)}>
      <div className={styles.chapterCopy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.chapterTitle}>{title}</h2>
        <p className={styles.chapterBody}>{body}</p>
        {action ? <div className={styles.chapterAction}>{action}</div> : null}
      </div>
      <div className={styles.chapterMedia}>{media}</div>
    </section>
  );
}

type StoryProps = {
  eyebrow: string;
  title: string;
  body: string;
  media: ReactNode;
  className?: string;
};

export function MaterialStory({ eyebrow, title, body, media, className }: StoryProps) {
  return (
    <section className={cx(styles.materialStory, className)}>
      <div>{media}</div>
      <div className={styles.materialCopy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.storyTitle}>{title}</h2>
        <p className={styles.storyBody}>{body}</p>
      </div>
    </section>
  );
}

export function RoomStory({ eyebrow, title, body, media, className }: StoryProps) {
  return (
    <section className={cx(styles.roomStory, className)}>
      <div className={styles.roomCopy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.storyTitle}>{title}</h2>
        <p className={styles.storyBody}>{body}</p>
      </div>
      <div>{media}</div>
    </section>
  );
}

export function DemoLampArt() {
  return (
    <div className={cx(styles.demoArt, styles.lampArt)} aria-hidden="true">
      <span className={styles.lampShade} />
      <span className={styles.lampStem} />
      <span className={styles.lampBase} />
    </div>
  );
}

export function DemoPlantArt() {
  return (
    <div className={cx(styles.demoArt, styles.plantArt)} aria-hidden="true">
      <span className={styles.plantLeaf} />
      <span className={styles.plantPot} />
    </div>
  );
}

export function DemoObjectArt() {
  return <div className={cx(styles.demoArt, styles.objectArt)} aria-hidden="true" />;
}
