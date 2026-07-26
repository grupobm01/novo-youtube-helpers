import { useT } from "@/lib/i18n";

export default function Terms() {
  const t = useT();
  const paragraphs = [
    "terms.p1","terms.p2","terms.p3","terms.p4","terms.p5","terms.p6",
    "terms.p7","terms.p8","terms.p9","terms.p10","terms.p11",
  ] as const;
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold text-foreground mb-4">{t("terms.title")}</h1>
        <div className="text-xs text-muted-foreground space-y-3 leading-relaxed">
          {paragraphs.map((k) => (
            <p key={k}>{t(k)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
