import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  variant?: "blue" | "indigo" | "cyan" | "emerald";
}

const gradientClasses = {
  blue: "from-blue-600 to-blue-800",
  indigo: "from-indigo-600 to-violet-800",
  cyan: "from-cyan-600 to-blue-700",
  emerald: "from-emerald-600 to-teal-800",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "blue",
}: StatCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClasses[variant]} p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-white/5 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">
              {title}
            </p>

            <p className="mt-3 text-3xl font-bold tracking-tight">
              {value}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-white/70">
          {description}
        </p>
      </div>
    </article>
  );
}