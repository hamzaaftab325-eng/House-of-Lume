"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";

import { Drawer, EmptyDrawerState, SearchOverlay } from "@/components/ui/overlays";
import { IconButton, LumeButton } from "@/components/ui/controls";

import styles from "./store-shell.module.css";

type StoreNavItem = {
  label: string;
  href: Route;
};

const navItems: readonly StoreNavItem[] = [
  { label: "Lighting", href: "/#lighting" },
  { label: "Living Green", href: "/#living-green" },
  { label: "Objects", href: "/#objects" },
  { label: "Our Story", href: "/#story" },
];

export function StoreHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className={styles.announcement}>Pakistan-wide delivery · Cash on Delivery at launch</div>
      <header className={styles.header} data-home={isHome} data-scrolled={scrolled}>
        <div className={styles.headerInner}>
          <div className={styles.mobileMenu}>
            <IconButton label="Open navigation" icon={<Menu />} onClick={() => setMenuOpen(true)} />
          </div>
          <nav className={styles.desktopNav} aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link key={item.label} className={styles.navLink} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <Link className={styles.logo} href="/" aria-label="House of Lume home">
            House of Lume
          </Link>

          <div className={styles.actions}>
            <IconButton label="Search" icon={<Search />} onClick={() => setSearchOpen(true)} />
            <Link className={styles.accountLink} href="/account" aria-label="Customer account">
              <UserRound aria-hidden="true" />
            </Link>
            <span className={styles.desktopOnly}>
              <IconButton
                label="Wishlist"
                icon={<Heart />}
                count={0}
                onClick={() => setWishlistOpen(true)}
              />
            </span>
            <IconButton
              label="Shopping bag"
              icon={<ShoppingBag />}
              count={0}
              onClick={() => setBagOpen(true)}
            />
          </div>
        </div>
      </header>

      <Drawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        side="left"
        eyebrow="House of Lume"
        title="Explore"
        description="Lighting, living green and considered objects for warmer spaces."
      >
        <nav className={styles.menuNav} aria-label="Mobile navigation">
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              className={styles.menuLink}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.menuIndex}>{String(index + 1).padStart(2, "0")}</span>
              <span>{item.label}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          ))}
          <Link className={styles.menuLink} href="/account" onClick={() => setMenuOpen(false)}>
            <span className={styles.menuIndex}>05</span>
            <span>Account</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
        <p className={styles.menuMeta}>Pakistan-wide delivery with Cash on Delivery at launch.</p>
      </Drawer>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />

      <Drawer
        open={wishlistOpen}
        onOpenChange={setWishlistOpen}
        eyebrow="Saved objects"
        title="Wishlist"
      >
        <EmptyDrawerState title="Nothing saved yet.">
          Save pieces you want to return to as the catalogue grows.
        </EmptyDrawerState>
      </Drawer>

      <Drawer
        open={bagOpen}
        onOpenChange={setBagOpen}
        eyebrow="Your selection"
        title="Shopping bag"
        footer={
          <LumeButton showArrow onClick={() => setBagOpen(false)}>
            Continue exploring
          </LumeButton>
        }
      >
        <EmptyDrawerState title="Your bag is empty.">
          Explore lighting, living green and objects selected for warmer rooms.
        </EmptyDrawerState>
      </Drawer>
    </>
  );
}

export function StoreFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <p className={styles.footerWordmark}>House of Lume</p>
            <p className={styles.footerCopy}>
              Considered lighting, living green and objects for rooms that feel lived in—not staged.
            </p>
          </div>
          <nav className={styles.footerNav} aria-label="Footer navigation">
            <div className={styles.footerGroup}>
              <h2>Explore</h2>
              <Link href="/#lighting">Lighting</Link>
              <Link href="/#living-green">Living Green</Link>
              <Link href="/#objects">Objects</Link>
              <Link href="/#spaces">Room inspiration</Link>
            </div>
            <div className={styles.footerGroup}>
              <h2>House</h2>
              <Link href="/#story">Our story</Link>
              <Link href="/#journal">House Notes</Link>
              <Link href="/account">Account</Link>
            </div>
            <div className={styles.footerGroup}>
              <h2>Commerce</h2>
              <span>Cash on Delivery</span>
              <span>Pakistan-wide delivery</span>
              <span>Prices in PKR</span>
            </div>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>© {year} House of Lume</span>
          <span>Pakistan-wide delivery · Cash on Delivery at launch</span>
        </div>
      </div>
    </footer>
  );
}
