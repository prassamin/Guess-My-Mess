import React, { useRef, useState, useEffect } from "react";
import {
  Pencil,
  PaintBucket,
  Eraser,
  Trash2,
  Palette,
  Undo,
} from "lucide-react";
import { useRoomStore } from "@/store/roomStore";

interface DrawingCanvasProps {
  isDrawer: boolean;
}

const hexToRgba = (hex: string) => {
  const c = hex.replace("#", "");
  const r = parseInt(c.length === 3 ? c[0] + c[0] : c.slice(0, 2), 16);
  const g = parseInt(c.length === 3 ? c[1] + c[1] : c.slice(2, 4), 16);
  const b = parseInt(c.length === 3 ? c[2] + c[2] : c.slice(4, 6), 16);
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
  fillColorStr: string,
) => {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= w || cy >= h) return;

  const idx = (cy * w + cx) * 4;
  const startR = data[idx];
  const startG = data[idx + 1];
  const startB = data[idx + 2];
  const startA = data[idx + 3];

  const fc = hexToRgba(fillColorStr);
  const tolerance = 50;
  const colorMatch = (i: number) => {
    return (
      Math.abs(data[i] - startR) <= tolerance &&
      Math.abs(data[i + 1] - startG) <= tolerance &&
      Math.abs(data[i + 2] - startB) <= tolerance &&
      Math.abs(data[i + 3] - startA) <= tolerance
    );
  };

  if (colorMatch(0) && fc[0] === startR && fc[1] === startG && fc[2] === startB)
    return;

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
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    const handleResize = () => {
      if (!canvas || !ctx) return;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
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
          floodFill(
            ctx,
            data.x * canvas.width,
            data.y * canvas.height,
            data.color,
          );
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
      } else if (data.type === "request_canvas_sync") {
        if (!isDrawer) return;
        const canvas = canvasRef.current;
        if (canvas && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "sync_canvas",
              dataURL: canvas.toDataURL(),
              targetId: data.requesterId,
            }),
          );
        }
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, isDrawer]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory((prev) => [...prev, canvas.toDataURL()].slice(-10));
    }
  };

  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
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
          color,
        );
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "fill",
              x: coords.x,
              y: coords.y,
              color,
            }),
          );
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

    const strokeColor = tool === "eraser" ? "#ffffff" : color;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(
      lastPos.current.x * canvas.width,
      lastPos.current.y * canvas.height,
    );
    ctx.lineTo(currentPos.x * canvas.width, currentPos.y * canvas.height);
    ctx.stroke();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "draw",
          x0: lastPos.current.x,
          y0: lastPos.current.y,
          x1: currentPos.x,
          y1: currentPos.y,
          color: strokeColor,
          size: brushSize,
        }),
      );
    }

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

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "clear_canvas" }));
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

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "sync_canvas", dataURL: previousState }),
        );
      }
    };
    img.src = previousState;
  };

  return (
    <div className="flex-1 bg-white rounded-none lg:rounded-b-4xl shadow-none lg:shadow-[0_12px_0_#94a3b8] flex flex-col overflow-hidden min-h-0 border-b-2 lg:border-[6px] border-[#94a3b8] border-x-0 lg:border-x-[6px] lg:border-t-0 relative w-full h-full">
      <div
        className={`flex-1 min-h-0 bg-white flex relative ${isDrawer ? (tool === "fill" ? "cursor-cell" : "cursor-crosshair") : "cursor-default"}`}
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
        <div className="toolbar-area bg-[#e2e8f0] border-t-2 lg:border-t-4 border-[#94a3b8] p-2 flex flex-col sm:flex-row justify-between items-center px-2 sm:px-6 relative overflow-visible shrink-0 gap-2">
          <div className="absolute top-0 left-0 right-0 h-4 bg-white/60 pointer-events-none" />

          <div className="flex space-x-1 sm:space-x-3 relative z-10 overflow-visible w-full sm:w-auto scrollbar-hidden items-center justify-between sm:justify-start">
            {/* Tools */}
            <div className="flex bg-white rounded-xl sm:rounded-2xl border-2 sm:border-[3px] border-[#94a3b8] shadow-[0_2px_0_#94a3b8] overflow-hidden shrink-0">
              <button
                onClick={() => setTool("brush")}
                className={`p-1.5 sm:p-3 ${tool === "brush" ? "bg-[#60a5fa] text-white" : "hover:bg-gray-100 text-[#1f2937]"} transition-colors`}
              >
                <Pencil className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
              <div className="w-px bg-[#94a3b8]" />
              <button
                onClick={() => setTool("fill")}
                className={`p-1.5 sm:p-3 ${tool === "fill" ? "bg-[#4ade80] text-white" : "hover:bg-gray-100 text-[#1f2937]"} transition-colors`}
              >
                <PaintBucket className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
              <div className="w-px bg-[#94a3b8]" />
              <button
                onClick={() => setTool("eraser")}
                className={`p-1.5 sm:p-3 ${tool === "eraser" ? "bg-[#f87171] text-white" : "hover:bg-gray-100 text-[#1f2937]"} transition-colors`}
              >
                <Eraser className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 sm:h-12 bg-gray-400 mx-1 sm:mx-2 hidden sm:block shrink-0" />

            {/* Dynamic Palette Popover */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowPalette(!showPalette)}
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
                  <div className="absolute bottom-full mb-3 lg:mb-4 -left-10 sm:left-0 bg-white border-[3px] border-[#94a3b8] rounded-2xl shadow-[0_6px_0_#94a3b8] p-3 w-65 sm:w-[320px] z-50 animate-in fade-in zoom-in duration-200 origin-bottom-left sm:origin-bottom">
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
                          className={`w-8 h-8 rounded-full border-2 ${color === c && tool !== "eraser" ? "border-[#3b82f6] shadow-[0_0_0_2px_#3b82f6] scale-110" : "border-[#94a3b8] shadow-[0_2px_0_#94a3b8] hover:translate-y-0.5 hover:shadow-none"} transition-all`}
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

            {/* Divider */}
            <div className="w-px h-8 sm:h-12 bg-gray-400 mx-1 sm:mx-2 shrink-0" />

            {/* Brush Size Slider */}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 py-1 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border-2 sm:border-[3px] border-[#94a3b8] shadow-[0_2px_0_#94a3b8] shrink-0">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full" />
              <input
                type="range"
                min="2"
                max="40"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-16 sm:w-24 accent-[#64748b] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full" />
            </div>
          </div>

          <div className="flex space-x-2 sm:space-x-3 relative z-10 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0">
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
