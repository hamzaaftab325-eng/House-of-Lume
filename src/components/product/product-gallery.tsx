"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, ImageOff } from "lucide-react";
import { useState, type TouchEvent } from "react";

import { IconButton } from "@/components/ui/controls";
import { DwelluneDialog } from "@/components/ui/overlays";
import type { ProductMediaItem } from "@/lib/product-detail";

import styles from "./product-detail.module.css";

type ProductGalleryProps = {
  media: ProductMediaItem[];
  productName: string;
};

export function ProductGallery({ media, productName }: ProductGalleryProps) {
  const usable = media.filter((item) => item.url);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const active = usable[activeIndex] ?? null;

  const select = (index: number) => {
    if (!usable.length) return;
    setActiveIndex((index + usable.length) % usable.length);
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart === null || usable.length < 2) return;
    const end = event.changedTouches[0]?.clientX;
    if (end === undefined) return;
    const delta = end - touchStart;
    if (Math.abs(delta) > 48) select(activeIndex + (delta < 0 ? 1 : -1));
    setTouchStart(null);
  };

  if (!active) {
    return (
      <section className={styles.gallery} aria-label={`${productName} gallery`}>
        <div className={styles.mediaPlaceholder}>
          <ImageOff aria-hidden="true" />
          <span>Product imagery is being prepared.</span>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.gallery} aria-label={`${productName} gallery`}>
      <div
        className={styles.mainMedia}
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={onTouchEnd}
      >
        {active.mediaType === "image" && active.url ? (
          <Image
            alt={active.altText ?? productName}
            className={styles.heroImage}
            fill
            priority
            sizes="(max-width: 62rem) 100vw, 58vw"
            src={active.url}
          />
        ) : active.mediaType === "video" && active.url ? (
          <video
            className={styles.heroVideo}
            controls
            playsInline
            preload="metadata"
            src={active.url}
          />
        ) : null}

        <div className={styles.galleryActions}>
          {usable.length > 1 ? (
            <>
              <IconButton
                label="Previous product media"
                icon={<ChevronLeft />}
                emphasis="soft"
                onClick={() => select(activeIndex - 1)}
              />
              <span aria-live="polite">
                {activeIndex + 1} / {usable.length}
              </span>
              <IconButton
                label="Next product media"
                icon={<ChevronRight />}
                emphasis="soft"
                onClick={() => select(activeIndex + 1)}
              />
            </>
          ) : null}
          {active.mediaType === "image" ? (
            <IconButton
              label="Open image zoom"
              icon={<Expand />}
              emphasis="soft"
              onClick={() => setZoomOpen(true)}
            />
          ) : null}
        </div>
      </div>

      {usable.length > 1 ? (
        <div className={styles.thumbnails} role="list" aria-label="Product media thumbnails">
          {usable.map((item, index) => (
            <button
              aria-label={`Show media ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={styles.thumbnail}
              key={item.id}
              onClick={() => select(index)}
              type="button"
            >
              {item.mediaType === "image" && item.url ? (
                <Image alt="" fill sizes="88px" src={item.url} />
              ) : (
                <span>Video</span>
              )}
            </button>
          ))}
        </div>
      ) : null}

      <DwelluneDialog
        open={zoomOpen}
        onOpenChange={setZoomOpen}
        eyebrow="Object detail"
        title={`${productName} — close view`}
        size="search"
      >
        {active.mediaType === "image" && active.url ? (
          <div className={styles.zoomMedia}>
            <Image alt={active.altText ?? productName} fill sizes="90vw" src={active.url} />
          </div>
        ) : null}
      </DwelluneDialog>
    </section>
  );
}
