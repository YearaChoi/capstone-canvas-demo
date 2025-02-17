import { useState, useRef, useCallback } from "react";
import * as fabric from "fabric";

export const useCanvasHistory = () => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);

  const saveState = (canvas: fabric.Canvas) => {
    if (!canvas) return;

    const currentState = JSON.stringify(canvas.toJSON());

    if (historyIndex.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex.current + 1);
    }

    if (history.current[history.current.length - 1] !== currentState) {
      history.current.push(currentState);
      historyIndex.current += 1;
    }

    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);
  };

  const loadCanvasState = useCallback(
    (canvas: fabric.Canvas, state: string) => {
      if (!canvas) return;

      canvas.loadFromJSON(state).then(() => {
        canvas.renderAll();
        console.log("Json 로드 완료");
      });
    },
    []
  );

  const undo = useCallback(
    (canvas: fabric.Canvas) => {
      if (!canvas || historyIndex.current <= 0) return;

      historyIndex.current -= 1;
      const state = history.current[historyIndex.current];
      loadCanvasState(canvas, state);

      setCanUndo(historyIndex.current > 0);
      setCanRedo(true);
    },
    [loadCanvasState]
  );

  const redo = useCallback(
    (canvas: fabric.Canvas) => {
      if (!canvas || historyIndex.current >= history.current.length - 1) return;

      historyIndex.current += 1;
      const state = history.current[historyIndex.current];
      loadCanvasState(canvas, state);

      setCanUndo(true);
      setCanRedo(historyIndex.current < history.current.length - 1);
    },
    [loadCanvasState]
  );

  return {
    canUndo,
    canRedo,
    saveState,
    undo,
    redo,
  };
};
