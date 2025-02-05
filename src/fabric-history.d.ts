declare module "fabric-history" {
  import { fabric } from "fabric";

  interface CanvasWithHistory extends fabric.Canvas {
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;
  }

  // 기존 CanvasEvents에 history 이벤트 추가
  declare module "fabric" {
    interface CanvasEvents {
      "history:undo": Event;
      "history:redo": Event;
      "history:clear": Event;
    }

    export = fabric;
  }
}
