"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { useStoreCommerce } from "@/components/providers/store-commerce";
import { SearchOverlay } from "@/components/search/search-overlay";
import { IconButton } from "@/components/ui/controls";
import { Drawer } from "@/components/ui/overlays";

import { CommerceDrawers } from "./commerce-drawers";
import styles from "./store-shell.module.css";

type StoreNavItem = {
  label: string;
  href: Route;
};

const navItems: readonly StoreNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Lighting", href: "/categories/lighting" as Route },
  { label: "Plants", href: "/categories/plants" as Route },
  { label: "Objects", href: "/shop?category=decor" as Route },
  { label: "Décor", href: "/categories/decor" as Route },
  { label: "Shop All", href: "/shop" as Route },
];

export function StoreHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const commerce = useStoreCommerce();
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
                  count={commerce.wishlistCount}
                  onClick={() => setWishlistOpen(true)}
                />
              </span>
            ) : null}
            <IconButton
              label="Shopping bag"
              icon={<ShoppingBag />}
              count={commerce.bagCount}
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
      <CommerceDrawers
        bagOpen={bagOpen}
        onBagOpenChange={setBagOpen}
        wishlistOpen={wishlistOpen}
        onWishlistOpenChange={setWishlistOpen}
      />
    </>
  );
}

export function StoreFooter() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} data-home={isHome}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <p className={styles.footerEyebrow}>Objects for a brighter home</p>
            <p className={styles.footerWordmark}>House of Lume</p>
            <p className={styles.footerCopy}>
              Warm lighting, living greenery, and considered objects for a more beautiful home —
              inside and out.
            </p>
          </div>

          <nav className={styles.footerNav} aria-label="Footer navigation">
            <div className={styles.footerGroup}>
              <h2>Explore</h2>
              <Link href={"/categories/lighting" as Route}>Lighting</Link>
              <Link href={"/categories/plants" as Route}>Plants</Link>
              <Link href={"/categories/planters" as Route}>Planters</Link>
              <Link href={"/categories/decor" as Route}>Décor</Link>
            </div>

            <div className={styles.footerGroup}>
              <h2>Discover</h2>
              <Link href={"/collections/new-arrivals" as Route}>New arrivals</Link>
              <Link href={"/collections/warm-lighting" as Route}>Warm lighting</Link>
              <Link href={"/collections/living-green" as Route}>Living green</Link>
              <Link href={"/shop" as Route}>Shop all</Link>
            </div>

            <div className={styles.footerGroup}>
              <h2>House</h2>
              <Link href="/">Home</Link>
              <Link href="/#why-title">Why House of Lume</Link>
              <Link href="/account">Account</Link>
            </div>
          </nav>
        </div>

        <div className={styles.footerBottom}>
          <span>© {year} House of Lume</span>
          <span>Pakistan-wide · Cash on Delivery · PKR</span>
        </div>
      </div>
    </footer>
  );
}
