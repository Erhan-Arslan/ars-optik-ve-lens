import { cn } from "@/lib/utils";
import { useAdminOrderFeed, type FeedStatus } from "@/hooks/useAdminOrderFeed";

const LABELS: Record<FeedStatus, { text: string; title: string }> = {
  live: { text: "Canlı", title: "Yeni siparişler anında burada görünür." },
  connecting: { text: "Bağlanıyor…", title: "Canlı bildirim servisine bağlanılıyor." },
  reconnecting: { text: "Yeniden bağlanıyor…", title: "Bağlantı koptu, yeniden deneniyor." },
  offline: {
    text: "Canlı bildirim yok",
    title: "Bildirim servisi şu an yanıt vermiyor. Sayfayı yenileyerek siparişleri görebilirsiniz.",
  },
};

export function LiveStatusBadge() {
  const { status } = useAdminOrderFeed();
  const label = LABELS[status];

  return (
    <p className="mt-4 flex items-center gap-2 text-xs text-ink-500" title={label.title} role="status">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {status === "live" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            status === "live" ? "bg-gold-500" : status === "offline" ? "bg-ink-300" : "animate-pulse bg-bronze-300",
          )}
        />
      </span>
      {label.text}
    </p>
  );
}
