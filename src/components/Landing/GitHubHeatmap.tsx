import { useMemo } from "react";

type GitHubHeatmapProps = {
  interactive?: boolean;
  className?: string;
  weeksData?: number[][];
};

const GitHubHeatmap = ({ interactive = false, className = "", weeksData }: GitHubHeatmapProps) => {
  const weeks = 44;
  const days = 7;

  const data = useMemo(() => {
    if (weeksData?.length) {
      return weeksData.map((week) => week.slice(0, days));
    }

    const rows = Array.from({ length: weeks }, (_, w) =>
      Array.from({ length: days }, (_, d) => {
        const wave = Math.sin((w / weeks) * Math.PI * 8 + d * 0.75);
        const intensity = Math.max(0, wave + 0.35);
        if (intensity < 0.2) return 0;
        if (intensity < 0.45) return 1;
        if (intensity < 0.65) return 2;
        if (intensity < 0.85) return 3;
        return 4;
      })
    );

    return rows;
  }, [weeksData]);

  return (
    <div className={`w-max flex gap-[4px] ${className}`}>
      {data.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[4px]">
          {week.map((level, di) => (
            <div
              key={di}
              className={`w-[9px] h-[9px] rounded-[2px] heatmap-${level} ${
                interactive ? "cursor-crosshair" : ""
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default GitHubHeatmap;
