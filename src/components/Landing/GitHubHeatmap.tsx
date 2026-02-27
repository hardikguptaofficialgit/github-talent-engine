import { useMemo } from "react";
import { motion } from "framer-motion";

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
    <div className="flex gap-[3px] overflow-hidden">
      {data.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((level, di) => (
            <motion.div
              key={di}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (wi * 7 + di) * 0.001, duration: 0.3 }}
              className={`w-[11px] h-[11px] heatmap-cell heatmap-${level} ${
                interactive ? "hover:scale-150 cursor-pointer" : ""
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default GitHubHeatmap;
