"use client";
import { useRouter } from "next/navigation";

export default function LangToggle({ next, label, title }: { next: "es" | "en"; label: string; title: string }) {
  const router = useRouter();
  return (
    <button
      title={title}
      className="rounded-full px-2 py-1 text-xs font-semibold text-muted hover:bg-white"
      onClick={() => {
        document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
