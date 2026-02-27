import { useMemo } from "react";

const GitHubHeatmap = ({ interactive = false }: { interactive?: boolean }) => {
  const weeks = 52;
  const days = 7;

  const data = useMemo(() => {
    return Array.from({ length: weeks }, () =>
      Array.from({ length: days }, () => {
        const r = Math.random();
        if (r < 0.3) return 0;
        if (r < 0.55) return 1;
        if (r < 0.75) return 2;
        if (r < 0.9) return 3;
        return 4;
      })
    );
  }, []);

  return (
    <div className="flex gap-[3px]">
      {data.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((level, di) => (
            <div
              key={di}
              className={`w-[10px] h-[10px] heatmap-cell heatmap-${level} ${
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
