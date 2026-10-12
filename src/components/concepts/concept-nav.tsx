import Link from "next/link";

import styles from "./concept-nav.module.css";

const concepts = [
  { id: "bento", index: "01", label: "Bento Grid", href: "/concepts/bento" },
  { id: "editorial", index: "02", label: "Editorial", href: "/concepts/editorial" },
  { id: "showroom", index: "03", label: "Showroom", href: "/concepts/showroom" },
] as const;

type ConceptNavProps = {
  active: (typeof concepts)[number]["id"];
};

export function ConceptNav({ active }: ConceptNavProps) {
  return (
    <nav className={styles.nav} aria-label="Homepage concepts">
      <Link className={styles.back} href="/">
        ← All concepts
      </Link>
      <div className={styles.options}>
        {concepts.map((concept) => (
          <Link
            key={concept.id}
            className={styles.option}
            data-active={active === concept.id}
            href={concept.href}
          >
            <span>{concept.index}</span>
            {concept.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
