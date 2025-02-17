// 키보드 단축키 처리 로직 (Ctrl+Z, Ctrl+A 등)
import { useEffect } from "react";
import * as fabric from "fabric";

export const useCanvasKeyboard = (
  canvasRef: React.RefObject<fabric.Canvas | null>,
  undo: (canvas: fabric.Canvas) => void,
  redo: (canvas: fabric.Canvas) => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 실행취소, 다시실행
      if (event.metaKey || event.ctrlKey) {
        if (event.key === "z") {
          event.preventDefault();
          undo(canvas);
        } else if (event.key === "y" || (event.shiftKey && event.key === "Z")) {
          event.preventDefault();
          redo(canvas);
        }
      }

      // 캔버스 내 요소 전체 선택
      if (event.metaKey || event.ctrlKey) {
        if (event.key === "a") {
          event.preventDefault(); // 기본 Ctrl + A 동작 방지 (브라우저 텍스트 선택 차단)
          if (canvas) {
            const allObjects = canvas.getObjects();
            if (allObjects.length > 0) {
              canvas.discardActiveObject(); // 기존 선택 해제
              const selection = new fabric.ActiveSelection(allObjects, {
                canvas,
              });
              canvas.setActiveObject(selection);
              canvas.requestRenderAll();
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvasRef, undo, redo]);
};
