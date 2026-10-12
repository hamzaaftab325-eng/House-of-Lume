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
  { label: "Home", href: "/" },
  { label: "Lighting", href: "/#lighting" },
  { label: "Plants", href: "/#plants" },
  { label: "Objects", href: "/#objects" },
  { label: "Décor", href: "/#decor" },
  { label: "Shop All", href: "/#shop" },
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
      <div className={styles.announcement} data-home={isHome}>
        Pakistan-wide delivery · Cash on Delivery at launch
      </div>
      <header className={styles.header} data-home={isHome} data-scrolled={scrolled}>
        <div className={styles.headerInner}>
          <div className={styles.mobileMenu}>
            <IconButton label="Open navigation" icon={<Menu />} onClick={() => setMenuOpen(true)} />
          </div>

          <Link className={styles.logo} href="/" aria-label="House of Lume home">
            <span>House of Lume</span>
            <small>Light spaces · brighter lives</small>
          </Link>

          <nav className={styles.desktopNav} aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link key={item.label} className={styles.navLink} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <IconButton label="Search" icon={<Search />} onClick={() => setSearchOpen(true)} />
            <Link className={styles.accountLink} href="/account" aria-label="Customer account">
              <UserRound aria-hidden="true" />
            </Link>
            {!isHome ? (
              <span className={styles.desktopOnly}>
                <IconButton
                  label="Wishlist"
                  icon={<Heart />}
                  count={0}
                  onClick={() => setWishlistOpen(true)}
                />
              </span>
            ) : null}
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
        description="Lighting, greenery, objects, and considered spaces for a warmer home."
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
            <span className={styles.menuIndex}>07</span>
            <span>Account</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </Drawer>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />

      <Drawer
        open={wishlistOpen}
        onOpenChange={setWishlistOpen}
        eyebrow="Saved objects"
        title="Wishlist"
      >
        <EmptyDrawerState title="Nothing saved yet.">
          Wishlist persistence connects to customer data in the commerce phase.
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
        <EmptyDrawerState title="Your bag is quiet.">
          Cart persistence and inventory-aware line items connect in Phase 6.
        </EmptyDrawerState>
      </Drawer>
    </>
  );
}

export function StoreFooter() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (pathname === "/") {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <p className={styles.footerWordmark}>House of Lume</p>
            <p className={styles.footerCopy}>
              Considered lighting, greenery, and objects for rooms that feel lived in—not staged.
            </p>
          </div>
          <nav className={styles.footerNav} aria-label="Footer navigation">
            <div className={styles.footerGroup}>
              <h2>Explore</h2>
              <Link href="/#lighting">Lighting</Link>
              <Link href="/#plants">Living Green</Link>
              <Link href="/#objects">Objects</Link>
            </div>
            <div className={styles.footerGroup}>
              <h2>House</h2>
              <Link href="/system">Design system</Link>
              <Link href="/account">Account</Link>
              <Link href="/crm">CRM</Link>
            </div>
            <div className={styles.footerGroup}>
              <h2>Commerce</h2>
              <span>Cash on Delivery</span>
              <span>Pakistan-wide</span>
              <span>PKR</span>
            </div>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>© {year} House of Lume</span>
          <span>Built for WCAG 2.2 AA and modern Core Web Vitals</span>
        </div>
      </div>
    </footer>
  );
}
