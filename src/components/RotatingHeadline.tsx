"use client";

import { useEffect, useState } from "react";

export default function RotatingHeadline({ lines }: { lines: string[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (lines.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      const timeout = setTimeout(() => {
        setIndex((i) => (i + 1) % lines.length);
        setVisible(true);
      }, 350);
      return () => clearTimeout(timeout);
    }, 3200);
    return () => clearInterval(interval);
  }, [lines.length]);

  return (
    <span
      className={
        "inline-block bg-gradient-to-r from-white to-brand-100 bg-clip-text text-transparent transition-all duration-300 " +
        (visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")
      }
    >
      {lines[index]}
    </span>
  );
}
