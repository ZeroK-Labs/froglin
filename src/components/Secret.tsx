import React, { useState } from "react";

export function SecretKey({ setSecret }: { setSecret: React.Dispatch<boolean> }) {
  const [touchCoordinates, setTouchCoordinates] = useState<string>("");
  const [lastRecordTime, setLastRecordTime] = useState(0);

  const handleTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();

    const now = Date.now();
    if (now - lastRecordTime > 30) {
      // Throttle check: more than 30 ms since last record
      const touches = event.touches;
      if (touches.length > 0 && touchCoordinates.length < 100) {
        const touch = touches[0]; // Just record the first touch point
        // if one of coordinates is already in the string, don't add it again
        if (
          touchCoordinates.includes(`${touch.clientX}`) ||
          touchCoordinates.includes(`${touch.clientY}`)
        ) {
          return;
        }
        const coords = `${touch.clientX}${touch.clientY}`;
        setTouchCoordinates((prevCoords) => prevCoords + coords);
        setLastRecordTime(now);
      }
    }
  };

  const colors = [
    "#15c621",
    "#73c615",
    "#abc615",
    "#c6c615",
    "#c6ab15",
    "#c69015",
    "#c66715",
    "#cb4015",
    "#c62e15",
    "#c61515",
  ];
  return (
    <div className="fixed left-2 top-[10vh] right-4 p-2 flex flex-col z-[10000]">
      <div
        className="w-56 h-56 bg-blue-500"
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
      ></div>
      <div
        className="relative w-56 border-b-2 border-transparent border-solid border-gradient-tr-gold-yellow-darkblue overflow-hidden"
        style={{
          height: "10",
        }}
      >
        <div className="absolute bg-radient-ellipse-bl from-black/50 to-transparent w-full h-full" />
        <span className="absolute flex w-full h-full items-center justify-center font-philosopher text-sm text-white font-bold">
          {Math.floor(touchCoordinates.length)} / {100}
        </span>
        <div
          style={{
            width: `${touchCoordinates.length}%`,
            minHeight: 8,
            backgroundColor: getHealthBarBackgroundColor(
              touchCoordinates.length,
              colors,
            ),
          }}
        />
      </div>
      <div className="text-white w-64 whitespace-normal overflow-y-auto h-32 text-sm">
        {touchCoordinates}
      </div>
    </div>
  );
}

export function getHealthBarBackgroundColor(
  percentage: number,
  healthBarColors: string[],
) {
  const healthBars = healthBarColors.map((color, index) => ({
    color,
    max: (index === 0 ? 101 : 100) - (100 / healthBarColors.length) * index,
    min: 100 - (100 / healthBarColors.length) * (index + 1),
  }));

  for (const color of healthBars) {
    if (percentage >= color.min && percentage <= color.max) return color.color;
  }

  return "#15c621";
}
