import React, { useRef, useState, useEffect } from "react";
import {
  Pencil,
  PaintBucket,
  Eraser,
  Trash2,
  Palette,
  Undo,
} from "lucide-react";
import { useRoomStore } from "@/store/room-store";

interface DrawingCanvasProps {
  isDrawer: boolean;
}

const hexToRgba = (hex: string) => {
  if (!hex || typeof hex !== "string") return [0, 0, 0, 255];
  const c = hex.replace("#", "");
  const r = parseInt(c.length === 3 ? c[0] + c[0] : c.slice(0, 2), 16) || 0;
  const g = parseInt(c.length === 3 ? c[1] + c[1] : c.slice(2, 4), 16) || 0;
  const b = parseInt(c.length === 3 ? c[2] + c[2] : c.slice(4, 6), 16) || 0;
  return [r, g, b, 255];
};

const PRESET_COLORS = [
  "#000000",
  "#4b5563",
  "#9ca3af",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#9f1239",
  "#431407",
  "#172554",
];

const floodFill = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColorStr: string
) => {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  if (!isFinite(x) || !isFinite(y)) return;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= w || cy >= h) return;

  const startIdx = (cy * w + cx) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const startA = data[startIdx + 3];

  const fc = hexToRgba(fillColorStr);

  // If the target pixel is already the fill color exactly, no need to fill
  if (
    fc[0] === startR &&
    fc[1] === startG &&
    fc[2] === startB &&
    startA === 255
  ) {
    return;
  }

  const tolerance = 50;
  const colorMatch = (i: number) => {
    // If the pixel is already strictly our fill color, it's been visited and changed.
    // This absolutely prevents infinite loops.
    if (
      data[i] === fc[0] &&
      data[i + 1] === fc[1] &&
      data[i + 2] === fc[2] &&
      data[i + 3] === 255
    ) {
      return false;
    }
    return (
      Math.abs(data[i] - startR) <= tolerance &&
      Math.abs(data[i + 1] - startG) <= tolerance &&
      Math.abs(data[i + 2] - startB) <= tolerance &&
      Math.abs(data[i + 3] - startA) <= tolerance
    );
  };

  const stack = [[cx, cy]];

  while (stack.length) {
    const [currX, currY] = stack.pop()!;
    let y1 = currY;
    let i = (y1 * w + currX) * 4;

    while (y1 >= 0 && colorMatch(i)) {
      y1--;
      i -= w * 4;
    }
    y1++;
    i += w * 4;

    let reachLeft = false;
    let reachRight = false;

    while (y1 < h && colorMatch(i)) {
      data[i] = fc[0];
      data[i + 1] = fc[1];
      data[i + 2] = fc[2];
      data[i + 3] = 255;

      if (currX > 0) {
        if (colorMatch(i - 4)) {
          if (!reachLeft) {
            stack.push([currX - 1, y1]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (currX < w - 1) {
        if (colorMatch(i + 4)) {
          if (!reachRight) {
            stack.push([currX + 1, y1]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      y1++;
      i += w * 4;
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

export default function DrawingCanvas({ isDrawer }: DrawingCanvasProps) {
  const { ws } = useRoomStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<"brush" | "fill" | "eraser">("brush");
  const [showPalette, setShowPalette] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const drawQueue = useRef<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (drawQueue.current.length > 0 && ws && ws.connected) {
        ws.emit("message", { type: "draw_batch", lines: drawQueue.current });
        drawQueue.current = [];
      }
    }, 30);
    return () => clearInterval(interval);
  }, [ws]);

  useEffect(() => {
    let cancelled = false;

    const initCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        if (!cancelled) requestAnimationFrame(initCanvas);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };

    initCanvas();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (data: any) => {
      if (data.type === "draw") {
        if (isDrawer) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(data.x0 * canvas.width, data.y0 * canvas.height);
        ctx.lineTo(data.x1 * canvas.width, data.y1 * canvas.height);
        ctx.stroke();
      } else if (data.type === "draw_batch") {
        if (isDrawer) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const dpr = window.devicePixelRatio || 1;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const line of data.lines) {
          ctx.strokeStyle = line.color;
          ctx.lineWidth = line.size * dpr;
          ctx.beginPath();
          ctx.moveTo(line.x0 * canvas.width, line.y0 * canvas.height);
          ctx.lineTo(line.x1 * canvas.width, line.y1 * canvas.height);
          ctx.stroke();
        }
      } else if (data.type === "clear_canvas") {
        if (isDrawer) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (data.type === "fill") {
        if (isDrawer) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          try {
            floodFill(
              ctx,
              data.x * canvas.width,
              data.y * canvas.height,
              data.color
            );
          } catch (e) {
            console.error("floodFill error:", e);
          }
        }
      } else if (data.type === "sync_canvas") {
        if (isDrawer) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = data.dataURL;
        }
      }
    };

    ws.on("message", handleMessage);

    const handleRequestSync = (data: any) => {
      if (!isDrawer) return;
      const canvas = canvasRef.current;
      if (canvas && ws && ws.connected) {
        ws.emit("message", {
          type: "sync_canvas",
          dataURL: canvas.toDataURL(),
          targetId: data.requesterId,
        });
      }
    };
    ws.on("request_canvas_sync", handleRequestSync);

    return () => {
      ws.off("message", handleMessage);
      ws.off("request_canvas_sync", handleRequestSync);
    };
  }, [ws, isDrawer]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory((prev) => [...prev, canvas.toDataURL()].slice(-10));
    }
  };

  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    if (e.target instanceof HTMLElement && e.target.closest(".toolbar-area"))
      return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    saveState();
    const coords = getCoordinates(e, canvas);

    if (tool === "fill") {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        floodFill(
          ctx,
          coords.x * canvas.width,
          coords.y * canvas.height,
          color
        );
        if (ws && ws.connected) {
          ws.emit("message", {
            type: "fill",
            x: coords.x,
            y: coords.y,
            color,
          });
          ws.emit("message", {
            type: "sync_canvas",
            dataURL: canvas.toDataURL(),
          });
        }
      }
      return;
    }

    setIsDrawing(true);
    lastPos.current = coords;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer || tool === "fill") return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;

    const currentPos = getCoordinates(e, canvas);

    const dpr = window.devicePixelRatio || 1;
    const strokeColor = tool === "eraser" ? "#ffffff" : color;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = brushSize * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(
      lastPos.current.x * canvas.width,
      lastPos.current.y * canvas.height
    );
    ctx.lineTo(currentPos.x * canvas.width, currentPos.y * canvas.height);
    ctx.stroke();

    drawQueue.current.push({
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: currentPos.x,
      y1: currentPos.y,
      color: strokeColor,
      size: brushSize,
    });

    lastPos.current = currentPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const handleClear = () => {
    if (!isDrawer) return;
    saveState();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (ws && ws.connected) {
        ws.emit("message", { type: "clear_canvas" });
      }
    }
  };

  const handleUndo = () => {
    if (!isDrawer || history.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (ws && ws.connected) {
        ws.emit("message", { type: "sync_canvas", dataURL: previousState });
      }
    };
    img.src = previousState;
  };

  return (
    <div className="flex-1 bg-white rounded-none lg:rounded-b-4xl shadow-none lg:shadow-[0_12px_0_#94a3b8] flex flex-col min-h-0 border-b-2 lg:border-[6px] border-[#94a3b8] border-x-0 lg:border-x-[6px] lg:border-t-0 relative w-full h-full">
      <div
        className={`flex-1 min-h-0 bg-white flex relative ${
          isDrawer
            ? tool === "fill"
              ? "cursor-cell"
              : "cursor-crosshair"
            : "cursor-default"
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={handlePointerDown}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full touch-none"
          style={{ display: "block" }}
        />
      </div>

      {isDrawer && (
        <div className="toolbar-area bg-[#e2e8f0] border-t-2 lg:border-t-4 border-[#94a3b8] p-2 flex flex-row flex-nowrap justify-between sm:justify-center items-center px-1 sm:px-6 relative overflow-visible shrink-0 gap-1 sm:gap-4 w-full">
          <div className="absolute top-0 left-0 right-0 h-4 bg-white/60 pointer-events-none" />

          <div className="flex flex-row gap-1 sm:space-x-3 relative z-10 overflow-visible shrink-0 items-center justify-center">
            {/* Tools */}
            <div className="flex bg-white rounded-xl sm:rounded-2xl border-2 sm:border-[3px] border-[#94a3b8] shadow-[0_2px_0_#94a3b8] overflow-hidden shrink-0">
              <button
                onClick={() => setTool("brush")}
                className={`p-1.5 sm:p-3 ${
                  tool === "brush"
                    ? "bg-[#60a5fa] text-white"
                    : "hover:bg-gray-100 text-[#1f2937]"
                } transition-colors`}
              >
                <Pencil className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
              <div className="w-px bg-[#94a3b8]" />
              <button
                onClick={() => setTool("fill")}
                className={`p-1.5 sm:p-3 ${
                  tool === "fill"
                    ? "bg-[#4ade80] text-white"
                    : "hover:bg-gray-100 text-[#1f2937]"
                } transition-colors`}
              >
                <PaintBucket className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
              <div className="w-px bg-[#94a3b8]" />
              <button
                onClick={() => setTool("eraser")}
                className={`p-1.5 sm:p-3 ${
                  tool === "eraser"
                    ? "bg-[#f87171] text-white"
                    : "hover:bg-gray-100 text-[#1f2937]"
                } transition-colors`}
              >
                <Eraser className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Dynamic Palette Popover */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowPalette(!showPalette);
                  setShowSlider(false);
                }}
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 sm:border-[3px] border-[#94a3b8] flex items-center justify-center bg-white shadow-[0_2px_0_#94a3b8] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Palette
                  className="w-4 h-4 sm:w-6 sm:h-6 text-[#1f2937]"
                  style={{ color: tool === "eraser" ? "#1f2937" : color }}
                />
              </button>

              {showPalette && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowPalette(false)}
                  />
                  <div className="absolute bottom-full mb-3 lg:mb-4 left-1/2 -translate-x-1/2 bg-white border-[3px] border-[#94a3b8] rounded-2xl shadow-[0_6px_0_#94a3b8] p-3 w-[280px] sm:w-[320px] z-50 animate-in fade-in zoom-in duration-200 origin-bottom">
                    <div className="absolute top-0 inset-x-0 h-3 bg-slate-100/80 pointer-events-none rounded-t-xl" />
                    <div className="grid grid-cols-6 gap-2 relative z-10">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setColor(c);
                            setTool(tool === "eraser" ? "brush" : tool);
                            setShowPalette(false);
                          }}
                          className={`w-8 h-8 rounded-full border-2 ${
                            color === c && tool !== "eraser"
                              ? "border-[#3b82f6] shadow-[0_0_0_2px_#3b82f6] scale-110"
                              : "border-[#94a3b8] shadow-[0_2px_0_#94a3b8] hover:translate-y-0.5 hover:shadow-none"
                          } transition-all`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-300 relative z-10 flex items-center justify-between">
                      <span className="font-black text-[#1f2937] text-xs uppercase tracking-widest">
                        Custom Color
                      </span>
                      <div className="relative w-8 h-8 rounded-full border-2 border-[#94a3b8] shadow-[0_2px_0_#94a3b8] overflow-hidden">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            setColor(e.target.value);
                            setTool("brush");
                          }}
                          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Brush Size Popover */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowSlider(!showSlider);
                  setShowPalette(false);
                }}
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 sm:border-[3px] border-[#94a3b8] flex items-center justify-center bg-white shadow-[0_2px_0_#94a3b8] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <div
                  className="bg-[#1f2937] rounded-full"
                  style={{
                    width: Math.max(4, brushSize / 2.5),
                    height: Math.max(4, brushSize / 2.5),
                  }}
                />
              </button>

              {showSlider && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSlider(false)}
                  />
                  <div className="absolute bottom-full mb-3 lg:mb-4 left-1/2 -translate-x-1/2 bg-white border-[3px] border-[#94a3b8] rounded-2xl shadow-[0_6px_0_#94a3b8] p-3 z-50 animate-in fade-in zoom-in duration-200 origin-bottom flex items-center space-x-2">
                    <div className="absolute top-0 inset-x-0 h-3 bg-slate-100/80 pointer-events-none rounded-t-xl" />
                    <div className="relative z-10 flex items-center gap-2 px-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full" />
                      <input
                        type="range"
                        min="2"
                        max="40"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-32 accent-[#64748b] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-1 sm:space-x-3 relative z-10 shrink-0 mt-0">
            {/* Undo Button */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-white border-2 sm:border-[3px] border-[#94a3b8] shadow-[0_2px_0_#94a3b8] active:shadow-none active:translate-y-0.5 disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-[0_2px_0_#94a3b8] transition-all flex items-center justify-center relative overflow-hidden group"
            >
              <Undo className="w-4 h-4 sm:w-6 sm:h-6 text-[#1f2937] group-hover:scale-110 transition-transform" />
            </button>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-[#f87171] border-2 sm:border-[3px] border-[#991b1b] shadow-[0_2px_0_#991b1b] active:shadow-none active:translate-y-0.5 transition-all flex items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute top-0 inset-x-0 h-3 bg-white/30 rounded-t-lg pointer-events-none" />
              <Trash2 className="w-4 h-4 sm:w-6 sm:h-6 text-white drop-shadow-[0_1px_0_#991b1b] group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
