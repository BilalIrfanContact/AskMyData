import { chartToImageSource } from "@/lib/api/client";

interface ChartRendererProps {
  chart: string;
}

export function ChartRenderer({ chart }: ChartRendererProps) {
  const imageSrc = chartToImageSource(chart);

  if (!imageSrc) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/40">
      <img src={imageSrc} alt="Generated chart" loading="lazy" className="block w-full" />
    </div>
  );
}
