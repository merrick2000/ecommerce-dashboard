"use client";

import type { ProductData } from "@/lib/api";

interface DescriptionWithCTAsProps {
  description: string;
  ctas: ProductData["description_ctas"];
  primaryColor: string;
  dark?: boolean;
  className?: string;
}

export function DescriptionWithCTAs({
  description,
  ctas,
  primaryColor,
  dark,
  className,
}: DescriptionWithCTAsProps) {
  if (!ctas || ctas.length === 0) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  }

  // Split HTML by block-level elements (paragraphs, headings, lists, blockquotes, divs)
  const blockRegex = /(<(?:p|h[1-6]|ul|ol|blockquote|div|figure|table|hr)[^>]*>[\s\S]*?<\/(?:p|h[1-6]|ul|ol|blockquote|div|figure|table)>|<hr[^>]*\/?>)/gi;
  const blocks: string[] = [];
  let match;
  let lastIndex = 0;

  while ((match = blockRegex.exec(description)) !== null) {
    if (match.index > lastIndex) {
      const between = description.slice(lastIndex, match.index).trim();
      if (between) blocks.push(between);
    }
    blocks.push(match[0]);
    lastIndex = blockRegex.lastIndex;
  }

  if (lastIndex < description.length) {
    const remaining = description.slice(lastIndex).trim();
    if (remaining) blocks.push(remaining);
  }

  // Sort CTAs by position
  const sortedCtas = [...ctas].sort((a, b) => a.after_paragraph - b.after_paragraph);

  // Build final HTML with CTAs injected
  const parts: string[] = [];
  let blockIndex = 0;

  // CTAs at position 0 (top)
  for (const cta of sortedCtas) {
    if (cta.after_paragraph === 0) {
      parts.push(buildCtaHtml(cta, primaryColor, dark));
    }
  }

  for (const block of blocks) {
    parts.push(block);
    blockIndex++;

    for (const cta of sortedCtas) {
      if (cta.after_paragraph === blockIndex) {
        parts.push(buildCtaHtml(cta, primaryColor, dark));
      }
    }
  }

  // CTAs positioned beyond the total blocks go at the end
  for (const cta of sortedCtas) {
    if (cta.after_paragraph > blocks.length) {
      parts.push(buildCtaHtml(cta, primaryColor, dark));
    }
  }

  const finalHtml = parts.join("\n");

  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
      <CtaClickHandler />
    </div>
  );
}

function buildCtaHtml(
  cta: ProductData["description_ctas"][number],
  color: string,
  dark?: boolean
): string {
  const align = cta.alignment === "center" ? "center" : "left";
  const href =
    cta.action === "scroll_to_form" ? "#checkout-form" : cta.url || "#";
  const dataAttr =
    cta.action === "scroll_to_form" ? 'data-scroll-to="checkout-form"' : "";
  const target = cta.action === "custom_url" ? 'target="_blank" rel="noopener noreferrer"' : "";

  return `<div style="text-align:${align};margin:1.5rem 0;">
    <a href="${href}" ${dataAttr} ${target}
       style="display:inline-block;padding:14px 32px;background-color:${color};color:#fff;font-weight:700;font-size:1rem;border-radius:12px;text-decoration:none;transition:opacity 0.2s;box-shadow:0 4px 14px ${color}40;"
       onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'"
       class="description-cta-btn">${cta.text}</a>
  </div>`;
}

function CtaClickHandler() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-scroll-to]');
            if (btn) {
              e.preventDefault();
              var target = document.getElementById(btn.getAttribute('data-scroll-to'));
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }
          });
        `,
      }}
    />
  );
}
