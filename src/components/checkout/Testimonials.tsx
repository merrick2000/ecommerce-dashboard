"use client";

interface Testimonial {
  name: string;
  city?: string;
  rating: number;
  text: string;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
  style: "cards" | "minimal" | "highlight";
  color: string;
  dark?: boolean;
  locale?: "fr" | "en";
}

function Stars({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4"
          fill={i < Number(count) ? color : "currentColor"}
          viewBox="0 0 20 20"
          style={{ opacity: i < Number(count) ? 1 : 0.2 }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ name, dark }: { name: string; dark?: boolean }) {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Style 1: Cards ──────────────────────────────────────────
function CardsStyle({ testimonials, color, dark }: Omit<TestimonialsProps, "style">) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {testimonials.map((t, i) => (
        <div
          key={i}
          className={`rounded-xl p-5 ${
            dark
              ? "bg-white/5 border border-white/10"
              : "bg-white border border-gray-200 shadow-sm"
          }`}
        >
          <Stars count={t.rating} color={color} />
          <p
            className={`mt-3 text-sm leading-relaxed ${
              dark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            &ldquo;{t.text}&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Avatar name={t.name} dark={dark} />
            <div>
              <p
                className={`text-sm font-semibold ${
                  dark ? "text-white" : "text-gray-900"
                }`}
              >
                {t.name}
              </p>
              {t.city && (
                <p
                  className={`text-xs ${
                    dark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t.city}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Style 2: Minimal ────────────────────────────────────────
function MinimalStyle({ testimonials, color, dark }: Omit<TestimonialsProps, "style">) {
  return (
    <div className="space-y-4">
      {testimonials.map((t, i) => (
        <div
          key={i}
          className={`flex gap-4 ${
            i < testimonials.length - 1
              ? dark
                ? "border-b border-white/5 pb-4"
                : "border-b border-gray-100 pb-4"
              : ""
          }`}
        >
          <Avatar name={t.name} dark={dark} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-semibold ${
                  dark ? "text-white" : "text-gray-900"
                }`}
              >
                {t.name}
              </span>
              {t.city && (
                <span
                  className={`text-xs ${
                    dark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t.city}
                </span>
              )}
              <Stars count={t.rating} color={color} />
            </div>
            <p
              className={`mt-1 text-sm leading-relaxed ${
                dark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Style 3: Highlight ──────────────────────────────────────
function HighlightStyle({ testimonials, color, dark }: Omit<TestimonialsProps, "style">) {
  const [first, ...rest] = testimonials;
  if (!first) return null;

  return (
    <div className="space-y-4">
      {/* Featured testimonial */}
      <div
        className={`rounded-2xl p-6 relative overflow-hidden ${
          dark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200 shadow-md"
        }`}
      >
        <svg
          className={`absolute top-4 right-4 w-10 h-10 ${
            dark ? "text-white/5" : "text-gray-100"
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <Stars count={first.rating} color={color} />
        <p
          className={`mt-4 text-lg leading-relaxed font-medium ${
            dark ? "text-gray-200" : "text-gray-700"
          }`}
        >
          &ldquo;{first.text}&rdquo;
        </p>
        <div className="flex items-center gap-3 mt-5">
          <Avatar name={first.name} dark={dark} />
          <div>
            <p
              className={`font-semibold ${
                dark ? "text-white" : "text-gray-900"
              }`}
            >
              {first.name}
            </p>
            {first.city && (
              <p
                className={`text-xs ${
                  dark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {first.city}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rest in compact grid */}
      {rest.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {rest.map((t, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 ${
                dark
                  ? "bg-white/[0.03] border border-white/5"
                  : "bg-gray-50 border border-gray-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={t.name} dark={dark} />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      dark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {t.name}
                  </p>
                  <Stars count={t.rating} color={color} />
                </div>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  dark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Testimonials({ testimonials, style, color, dark, locale = "fr" }: TestimonialsProps) {
  if (!testimonials || testimonials.length === 0) return null;

  const titleClass = dark
    ? "text-xl font-bold text-white mb-4"
    : "text-xl font-bold text-gray-900 mb-4";

  return (
    <div>
      <h2 className={titleClass}>{locale === 'en' ? 'What our customers say' : 'Ce que nos clients disent'}</h2>
      {style === "cards" && (
        <CardsStyle testimonials={testimonials} color={color} dark={dark} />
      )}
      {style === "minimal" && (
        <MinimalStyle testimonials={testimonials} color={color} dark={dark} />
      )}
      {style === "highlight" && (
        <HighlightStyle testimonials={testimonials} color={color} dark={dark} />
      )}
    </div>
  );
}
