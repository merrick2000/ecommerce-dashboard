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

  const sortedCtas = [...ctas].sort((a, b) => a.after_paragraph - b.after_paragraph);

  const parts: string[] = [];
  let blockIndex = 0;

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

  for (const cta of sortedCtas) {
    if (cta.after_paragraph > blocks.length) {
      parts.push(buildCtaHtml(cta, primaryColor, dark));
    }
  }

  const finalHtml = parts.join("\n");

  return (
    <div className={className}>
      <style dangerouslySetInnerHTML={{ __html: CTA_ANIMATIONS }} />
      <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
      <CtaClickHandler />
    </div>
  );
}

const CTA_ANIMATIONS = `
@keyframes cta-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
@keyframes cta-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
  50% { transform: scale(1.03); box-shadow: 0 8px 25px rgba(0,0,0,0.25); }
}
@keyframes cta-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(255,255,255,0.2), 0 0 20px rgba(255,255,255,0.1); }
  50% { box-shadow: 0 0 15px rgba(255,255,255,0.4), 0 0 40px rgba(255,255,255,0.2); }
}
@keyframes cta-bounce {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
}
@keyframes cta-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.cta-shake { animation: cta-shake 0.8s ease-in-out infinite; animation-delay: 2s; animation-iteration-count: 3; }
.cta-shake:hover { animation: none; }
.cta-pulse { animation: cta-pulse 2s ease-in-out infinite; }
.cta-glow { animation: cta-glow 2s ease-in-out infinite; }
.cta-bounce { animation: cta-bounce 2s ease-in-out infinite; }
.cta-gradient { background-size: 200% 200% !important; animation: cta-gradient 3s ease infinite; }
`;

function buildCtaHtml(
  cta: ProductData["description_ctas"][number],
  color: string,
  dark?: boolean
): string {
  const style = cta.style || 'default';
  const align = cta.alignment === "full" ? "center" : (cta.alignment || "center");
  const isFullWidth = cta.alignment === "full";
  const href = cta.action === "scroll_to_form" ? "#checkout-form" : cta.url || "#";
  const dataAttr = cta.action === "scroll_to_form" ? 'data-scroll-to="checkout-form"' : "";
  const target = cta.action === "custom_url" ? 'target="_blank" rel="noopener noreferrer"' : "";

  // Style-specific classes and inline styles
  let animClass = '';
  let extraStyle = '';
  let padding = '14px 32px';
  let fontSize = '1rem';
  let borderRadius = '12px';

  switch (style) {
    case 'shake':
      animClass = 'cta-shake';
      break;
    case 'pulse':
      animClass = 'cta-pulse';
      break;
    case 'glow':
      animClass = 'cta-glow';
      extraStyle = `box-shadow: 0 0 15px ${color}60, 0 0 30px ${color}30;`;
      break;
    case 'bounce':
      animClass = 'cta-bounce';
      break;
    case 'gradient':
      animClass = 'cta-gradient';
      extraStyle = `background: linear-gradient(135deg, ${color}, ${adjustColor(color, 40)}, ${color}) !important; background-size: 200% 200%;`;
      break;
    case 'large':
      padding = '18px 48px';
      fontSize = '1.2rem';
      borderRadius = '16px';
      extraStyle = `box-shadow: 0 6px 20px ${color}50;`;
      break;
  }

  const widthStyle = isFullWidth ? 'display:block;width:100%;' : 'display:inline-block;';

  const subTextHtml = cta.sub_text
    ? `<p style="margin:6px 0 0;font-size:0.8rem;color:${dark ? '#a1a1aa' : '#71717a'};font-weight:500;">${escapeHtml(cta.sub_text)}</p>`
    : '';

  return `<div style="text-align:${align};margin:1.5rem 0;" data-track-cta="description_cta">
    <a href="${href}" ${dataAttr} ${target}
       class="description-cta-btn ${animClass}"
       style="${widthStyle}padding:${padding};background-color:${color};color:#fff;font-weight:700;font-size:${fontSize};border-radius:${borderRadius};text-decoration:none;transition:opacity 0.2s;box-shadow:0 4px 14px ${color}40;text-align:center;${extraStyle}"
       onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'"
    >${escapeHtml(cta.text)}</a>
    ${subTextHtml}
  </div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function adjustColor(hex: string, amount: number): string {
  // Lighten a hex color
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
  const b = Math.min(255, (num & 0x0000FF) + amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
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
