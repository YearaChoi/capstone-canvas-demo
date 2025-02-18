import { Canvas, Object as FabricObject } from "fabric"; // fabric.js의 Canvas와 Object 타입

export const alignLeft = (canvas: Canvas, getSelectionBounds: Function) => {
  const selectionBounds = getSelectionBounds();
  if (!selectionBounds) return;

  const { left } = selectionBounds;

  const objects = canvas.getActiveObjects();
  if (objects.length === 0) return;

  // 객체들을 `top` 값 기준으로 그룹화
  const groups: Record<string, fabric.Object[]> = {};
  const tolerance = 5;

  // 기존 그룹 중, `top` 값이 비슷한 그룹 찾기
  objects.forEach((obj: any) => {
    const objTop = obj.top || 0;
    let groupKey = Object.keys(groups).find(
      (key) => Math.abs(parseFloat(key) - objTop) <= tolerance
    );

    if (!groupKey) {
      groupKey = objTop.toString();
      groups[groupKey as string] = [];
    }

    // groupKey가 string임을 보장
    groups[groupKey as string].push(obj);
  });

  // 각 그룹별로 타일형 정렬 수행
  Object.values(groups).forEach((group) => {
    group.sort((a, b) => (a.left || 0) - (b.left || 0));
    let currentLeft = left;
    group.forEach((obj) => {
      obj.set({ left: currentLeft });
      currentLeft += obj.width || 0; // 다음 객체를 오른쪽으로 배치
    });
  });

  canvas.renderAll();
};

export const alignCenter = (canvas: Canvas, getSelectionBounds: Function) => {
  const selectionBounds = getSelectionBounds();
  if (!selectionBounds) return;

  const { left, right } = selectionBounds;
  const centerX = (left + right) / 2;

  const objects = canvas.getActiveObjects();
  if (objects.length === 0) return;

  const groups: Record<string, fabric.Object[]> = {};
  const tolerance = 5;

  objects.forEach((obj: any) => {
    const objTop = obj.top || 0;
    let groupKey = Object.keys(groups).find(
      (key) => Math.abs(parseFloat(key) - objTop) <= tolerance
    );

    if (!groupKey) {
      groupKey = objTop.toString();
      groups[groupKey as string] = [];
    }

    groups[groupKey as string]!.push(obj);
  });

  Object.values(groups).forEach((group) => {
    group.sort((a, b) => (a.left || 0) - (b.left || 0));

    let currentLeft =
      centerX - group.reduce((sum, obj) => sum + (obj.width || 0), 0) / 2;
    group.forEach((obj) => {
      obj.set({ left: currentLeft });
      currentLeft += obj.width || 0;
    });
  });

  canvas.renderAll();
};

export const alignRight = (canvas: Canvas, getSelectionBounds: Function) => {
  const selectionBounds = getSelectionBounds();
  if (!selectionBounds) return;

  const { right } = selectionBounds;

  const objects = canvas.getActiveObjects();
  if (objects.length === 0) return;

  const groups: Record<string, fabric.Object[]> = {};
  const tolerance = 5;

  objects.forEach((obj: any) => {
    const objTop = obj.top || 0;
    let groupKey = Object.keys(groups).find(
      (key) => Math.abs(parseFloat(key) - objTop) <= tolerance
    );

    if (!groupKey) {
      groupKey = objTop.toString();
      groups[groupKey as string] = [];
    }

    groups[groupKey as string]!.push(obj);
  });

  Object.values(groups).forEach((group) => {
    group.sort((a, b) => (a.left || 0) - (b.left || 0));

    let currentRight = right;
    group.reverse().forEach((obj) => {
      obj.set({ left: currentRight - (obj.width || 0) });
      currentRight -= obj.width || 0;
    });
  });

  canvas.renderAll();
};

export const alignTop = (canvas: Canvas, getSelectionBounds: Function) => {
  const selectionBounds = getSelectionBounds();
  if (!selectionBounds) return;

  const { top } = selectionBounds;

  const objects = canvas.getActiveObjects();
  if (objects.length === 0) return;

  const groups: Record<string, fabric.Object[]> = {};
  const tolerance = 5;

  objects.forEach((obj: any) => {
    const objLeft = obj.left || 0;
    let groupKey = Object.keys(groups).find(
      (key) => Math.abs(parseFloat(key) - objLeft) <= tolerance
    );
    if (!groupKey) {
      groupKey = objLeft.toString();
      groups[groupKey as string] = [];
    }
    groups[groupKey as string]!.push(obj);
  });

  Object.values(groups).forEach((group) => {
    group.sort((a, b) => (a.top || 0) - (b.top || 0));

    let currentTop = top;
    group.forEach((obj) => {
      obj.set({ top: currentTop });
      currentTop += obj.height || 0;
    });
  });

  canvas.renderAll();
};

export const alignMiddle = (canvas: Canvas, getSelectionBounds: Function) => {
  const selectionBounds = getSelectionBounds();
  if (!selectionBounds) return;

  const { top, bottom } = selectionBounds;
  const centerY = (top + bottom) / 2;

  const objects = canvas.getActiveObjects();
  if (objects.length === 0) return;

  const groups: Record<string, fabric.Object[]> = {};
  const tolerance = 5;

  objects.forEach((obj: any) => {
    const objLeft = obj.left || 0;
    let groupKey = Object.keys(groups).find(
      (key) => Math.abs(parseFloat(key) - objLeft) <= tolerance
    );
    if (!groupKey) {
      groupKey = objLeft.toString();
      groups[groupKey as string] = [];
    }
    groups[groupKey as string]!.push(obj);
  });

  Object.values(groups).forEach((group) => {
    group.sort((a, b) => (a.top || 0) - (b.top || 0));

    const totalHeight = group.reduce((sum, obj) => sum + (obj.height || 0), 0);
    let startY = centerY - totalHeight / 2;

    group.forEach((obj) => {
      obj.set({ top: startY });
      startY += obj.height || 0;
    });
  });

  canvas.renderAll();
};

export const alignBottom = (canvas: Canvas, getSelectionBounds: Function) => {
  const selectionBounds = getSelectionBounds();
  if (!selectionBounds) return;

  const { bottom } = selectionBounds;

  const objects = canvas.getActiveObjects();
  if (objects.length === 0) return;

  const groups: Record<string, fabric.Object[]> = {};
  const tolerance = 5;

  objects.forEach((obj: any) => {
    const objLeft = obj.left || 0;
    let groupKey = Object.keys(groups).find(
      (key) => Math.abs(parseFloat(key) - objLeft) <= tolerance
    );
    if (!groupKey) {
      groupKey = objLeft.toString();
      groups[groupKey as string] = [];
    }
    groups[groupKey as string]!.push(obj);
  });

  Object.values(groups).forEach((group) => {
    group.sort((a, b) => (a.top || 0) - (b.top || 0));

    let currentBottom = bottom;
    group.reverse().forEach((obj) => {
      obj.set({ top: currentBottom - (obj.height || 0) });
      currentBottom -= obj.height || 0;
    });
  });

  canvas.renderAll();
};

// 세로 균등 배치
export const distributeVertically = (
  canvas: Canvas, // 정확한 타입 지정
  getSelectionBounds: () => { top: number; bottom: number } | null
) => {
  if (!canvas) return;

  const selectionBounds = getSelectionBounds();
  if (!selectionBounds) return;

  const activeObjects: FabricObject[] = canvas.getActiveObjects(); // FabricObject 배열로 타입 지정
  if (activeObjects.length < 2) return; // 두 개 이상 선택해야 실행됨

  const { top, bottom } = selectionBounds;
  const totalHeight = bottom - top;
  const numGaps = activeObjects.length - 1;
  const totalObjectsHeight = activeObjects.reduce(
    (sum: number, obj: FabricObject) => sum + (obj.height ?? 0), // sum은 숫자, obj는 FabricObject
    0
  );
  const gap = (totalHeight - totalObjectsHeight) / numGaps; // 균등 간격 계산

  let currentY = top;
  activeObjects
    .sort((a, b) => (a.top ?? 0) - (b.top ?? 0)) // undefined 방지를 위해 ?? 0 사용
    .forEach((obj) => {
      obj.set({ top: currentY });
      currentY += (obj.height ?? 0) + gap; // undefined 방지를 위해 ?? 0 사용
    });

  canvas.renderAll();
};

// 가로 균등 배치
export const distributeHorizontally = (
  canvas: Canvas,
  getSelectionBounds: () => { left: number; right: number } | null
) => {
  if (!canvas) return;

  const selectionBounds = getSelectionBounds();
  if (!selectionBounds) return;

  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length < 2) return; // 두 개 이상 선택해야 실행됨

  const { left, right } = selectionBounds;
  const totalWidth = right - left;
  const numGaps = activeObjects.length - 1;
  const totalObjectsWidth = activeObjects.reduce(
    (sum: number, obj: FabricObject) => sum + obj.width!,
    0
  );
  const gap = (totalWidth - totalObjectsWidth) / numGaps; // 균등 간격 계산

  let currentX = left;
  activeObjects
    .sort((a, b) => (a.left ?? 0) - (b.left ?? 0)) // 현재 위치 기준으로 정렬
    .forEach((obj) => {
      obj.set({ left: currentX });
      currentX += (obj.width ?? 0) + gap;
    });

  canvas.renderAll();
};
