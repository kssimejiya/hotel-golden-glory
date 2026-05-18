import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "./Container";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <Container>
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          {items.map((item, i) => (
            <li key={item.label} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-soft-gray/60" />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-soft-gray transition-colors hover:text-gold"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-charcoal">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </Container>
  );
}
