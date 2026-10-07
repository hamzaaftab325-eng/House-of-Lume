"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";

import { Drawer, EmptyDrawerState, SearchOverlay } from "@/components/ui/overlays";
import { IconButton, LumeButton } from "@/components/ui/controls";

import styles from "./store-shell.module.css";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Lighting", href: "/#lighting" },
  { label: "Plants", href: "/#plants" },
  { label: "Decor", href: "/#decor" },
  { label: "Rooms", href: "/#rooms" },
  { label: "Our Story", href: "/#philosophy" },
] as const;

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
      {!isHome && (
        <div className={styles.announcement}>
          <span>Pakistan-wide delivery</span>
          <span>Cash on Delivery</span>
          <span>Prices in PKR</span>
          <span>Considered home living</span>
        </div>
      )}
      <header className={styles.header} data-home={isHome} data-scrolled={scrolled}>
        <div className={styles.headerInner}>
          <div className={styles.mobileMenu}>
            <IconButton label="Open navigation" icon={<Menu />} onClick={() => setMenuOpen(true)} />
          </div>

          <Link className={styles.logo} href="/" aria-label="House of Lume home">
            <span className={styles.logoMark} aria-hidden="true" />
            <span className={styles.logoText}>
              <strong>HOUSE OF LUME</strong>
              <small>Lights · Plants · Spaces</small>
            </span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.label}
                className={styles.navLink}
                data-active={item.href === "/" && isHome}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

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
        description="Lighting, living green and timeless objects for warmer homes."
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
        <p className={styles.menuMeta}>Pakistan-wide delivery · Cash on Delivery · PKR pricing</p>
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
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.logoMark} aria-hidden="true" />
              <span className={styles.logoText}>
                <strong>HOUSE OF LUME</strong>
                <small>Lights · Plants · Spaces</small>
              </span>
            </div>
            <p className={styles.footerCopy}>
              Lighting, living green and considered home decor for modern Pakistani homes.
            </p>
          </div>

          <nav className={styles.footerNav} aria-label="Footer navigation">
            <div className={styles.footerGroup}>
              <h2>Explore</h2>
              <Link href="/#lighting">Lighting</Link>
              <Link href="/#plants">Plants</Link>
              <Link href="/#decor">Home Decor</Link>
              <Link href="/#categories">Collections</Link>
            </div>
            <div className={styles.footerGroup}>
              <h2>House</h2>
              <Link href="/#philosophy">Our Story</Link>
              <Link href="/#rooms">Room Inspiration</Link>
              <Link href="/#newsletter-title">House Notes</Link>
              <Link href="/system">Design System</Link>
            </div>
            <div className={styles.footerGroup}>
              <h2>Commerce</h2>
              <Link href="/account">Customer Account</Link>
              <span>Pakistan-wide delivery</span>
              <span>Cash on Delivery</span>
              <span>PKR pricing</span>
            </div>
          </nav>

          <div className={styles.footerSignature}>
            <span>A brighter Pakistan</span>
            <strong>begins at home.</strong>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© {year} House of Lume. All rights reserved.</span>
          <span>Pakistan · PKR · Cash on Delivery</span>
        </div>
      </div>
    </footer>
  );
}
