import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import * as fabric from "fabric";
import bgImg from "./assets/img/bgImg3.png";
import { Button, ButtonGroup } from "@mui/material";
import SvgIcon from "@mui/material/SvgIcon";
import AddIcon from "@mui/icons-material/Add";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import ListIcon from "@mui/icons-material/List";
import GridOnIcon from "@mui/icons-material/GridOn";
import GridOffIcon from "@mui/icons-material/GridOff";
import AlignHorizontalLeftIcon from "@mui/icons-material/AlignHorizontalLeft";
import AlignHorizontalRightIcon from "@mui/icons-material/AlignHorizontalRight";
import AlignVerticalBottomIcon from "@mui/icons-material/AlignVerticalBottom";
import AlignVerticalTopIcon from "@mui/icons-material/AlignVerticalTop";
import AlignHorizontalCenterIcon from "@mui/icons-material/AlignHorizontalCenter";
import AlignVerticalCenterIcon from "@mui/icons-material/AlignVerticalCenter";
import SwapVerticalCircleIcon from "@mui/icons-material/SwapVerticalCircle";
import SwapHorizontalCircleIcon from "@mui/icons-material/SwapHorizontalCircle";

const CanvasDemo: React.FC = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialSelectionBounds = useRef<{
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null>(null);

  //// 묶어서 커스텀 훅으로 잘 만들기
  const [scale, setScale] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  ////

  const [isSnapping, setIsSnapping] = useState(true);

  useEffect(() => {
    if (containerRef.current) {
      const canvas = new fabric.Canvas("fabricCanvas", {
        selection: true,
        backgroundColor: "skyblue",
      });

      fabric.FabricImage.fromURL(bgImg).then((img) => {
        img.set({
          selectable: false,
          evented: false,
          scaleX: canvas.width! / img.width!,
          scaleY: canvas.height! / img.height!,
        });

        canvas.backgroundImage = img;

        // 이미지 로딩이 되면 사각형 추가
        for (let i = 0; i < 5; i++) {
          const rect = new fabric.Rect({
            left: 50 + i * 120,
            top: 100,
            fill: "hsl(186.15384615384616, 92.85714285714289%, 83.52941176470588%)",
            width: 100,
            height: 40,
            selectable: true,
          });

          const text = new fabric.Textbox(`device${i + 1}`, {
            left: rect.left + rect.width / 2,
            top: rect.top + rect.height / 2,
            fontSize: 14,
            originX: "center",
            originY: "center",
            fill: "black",
          });

          // 텍스트와 사각형을 그룹화하여 하나의 객체처럼 다루기
          const group = new fabric.Group([rect, text], {
            left: rect.left,
            top: rect.top,
            lockRotation: false,
            lockScalingFlip: false,
            lockScalingX: false,
            lockScalingY: false,
            hasControls: false,
            hoverCursor: "grab",
            moveCursor: "grabbing",
          });

          canvas.add(group);
        }

        // 최종 랜더링을 담당
        canvas.renderAll();

        // 최종 상태 저장
        saveState();
      });
      canvasRef.current = canvas;

      canvas.hoverCursor = "grab";
      canvas.moveCursor = "grabbing";

      // mouse:up 이벤트 리스너
      canvas.on("mouse:up", () => {
        saveState();
      });

      return () => {
        canvas.dispose();
      };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleMouseDown = (opt: any) => {
      const evt = opt.e as MouseEvent;
      if (evt.altKey) {
        isDragging = true;
        canvas.selection = false; // 객체 선택 방지
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        canvas.defaultCursor = "grabbing";
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!isDragging) return;
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;
      if (vpt) {
        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;
      }
      canvas.requestRenderAll();
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
    };

    const handleMouseUp = () => {
      if (isDragging) {
        canvas.setViewportTransform(canvas.viewportTransform);
        isDragging = false;
        canvas.selection = true; // 다시 선택 가능하도록
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isDragging) {
        canvas.defaultCursor = "grab"; // alt 누르고 있는 상태: grab
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && !isDragging) {
        canvas.defaultCursor = "default"; // alt 뗐을 때: default
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    // https://github.com/fabricjs/fabric.js/discussions/10176
    fabric.FabricObject.customProperties = [
      "lockRotation",
      "lockScalingFlip",
      "lockScalingX",
      "lockScalingY",
      "hasControls",
      "hoverCursor",
      "moveCursor",
    ];

    // (Fabric.js의 toJSON 사용)
    const currentState = JSON.stringify(canvas.toJSON());

    if (historyIndex.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex.current + 1);
    }

    // 상태가 변경된 경우에만 저장
    if (history.current[history.current.length - 1] !== currentState) {
      history.current.push(currentState);
      historyIndex.current += 1;
    }

    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);
  };

  // useCallback을 사용하면 loadCanvasState가 항상 같은 함수 참조를 유지하므로 불필요한 재생성 방지
  // useCallback은 인자로 전달한 콜백 함수 그 자체를 메모이제이션 하는 것
  // 함수가 다시 필요할 때마다 함수를 새로 생성하는 것이 아닌 필요할 때마다 메모리에서 가져와서 재사용하는 것
  const loadCanvasState = useCallback(
    (canvas: fabric.Canvas, state: string) => {
      if (!canvas) return;

      canvas.loadFromJSON(state).then(() => {
        canvas.renderAll(); // JSON 로드 후 즉시 렌더링
        console.log("Json 로드 완료");
        console.log("Json: ");
      });
    },
    []
  );

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex.current <= 0) return;

    historyIndex.current -= 1;
    const state = history.current[historyIndex.current];

    console.log("Undo 실행! ", state);
    loadCanvasState(canvas, state);
    setCanUndo(historyIndex.current > 0);
    setCanRedo(true);
  }, [loadCanvasState, setCanUndo, setCanRedo]);

  // 렌더링이 되어도 함수 참조가 유지됨.
  // useEffect가 불필요하게 다시 실행되는 것을 방지할 수 있음.
  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex.current >= history.current.length - 1) return;

    historyIndex.current += 1;
    const state = history.current[historyIndex.current];

    console.log("Redo 실행!");
    loadCanvasState(canvas, state);
    setCanUndo(true);
    setCanRedo(historyIndex.current < history.current.length - 1);
  }, [loadCanvasState, setCanUndo, setCanRedo]); // 필요한 의존성 추가

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key === "z") {
          event.preventDefault();
          undo();
        } else if (event.key === "y" || (event.shiftKey && event.key === "Z")) {
          event.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]); // undo, redo가 변경될 일이 없도록 useCallback 적용

  // 요소가 캔버스 영역  안에서만 이동되도록 제한
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const restrictMovement = (event: fabric.TEvent) => {
      // 타입 에러를 해결하기 위해 일시적으로 target을 any로 캐스팅 (추후 정확한 타입 정의 필요)
      const obj = (event as any).target as fabric.Group;
      if (!obj || !(obj instanceof fabric.Group)) return;

      const canvasWidth = canvas.width!;
      const canvasHeight = canvas.height!;

      // 그룹의 경계를 가져오기
      obj.setCoords();
      const bound = obj.getBoundingRect();

      // 좌측 경계 제한
      if (bound.left < 0) {
        obj.set("left", 0);
      }
      // 우측 경계 제한
      if (bound.left + bound.width > canvasWidth) {
        obj.set("left", canvasWidth - bound.width);
      }
      // 상단 경계 제한
      if (bound.top < 0) {
        obj.set("top", 0);
      }
      // 하단 경계 제한
      if (bound.top + bound.height > canvasHeight) {
        obj.set("top", canvasHeight - bound.height);
      }

      obj.setCoords(); // 위치 업데이트
    };

    canvas.on("object:moving", restrictMovement);

    return () => {
      canvas.off("object:moving", restrictMovement);
    };
  }, []);

  const toggleSnapping = () => {
    setIsSnapping((prev) => !prev);
  };

  const snapToGrid = (event: fabric.TEvent) => {
    if (!isSnapping) return;

    const obj = (event as any).target; // 현재 이동 중인 객체만 가져옴
    if (!obj || !(obj instanceof fabric.Group)) return;

    obj.set({
      left: Math.round(obj.left! / 22) * 22,
      top: Math.round(obj.top! / 22) * 22,
    });

    obj.setCoords(); // 위치 업데이트
    canvasRef.current!.renderAll();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isSnapping) {
      canvas.on("object:moving", snapToGrid);
    } else {
      canvas.off("object:moving", snapToGrid);
    }

    return () => {
      canvas.off("object:moving", snapToGrid);
    };
  }, [isSnapping]);

  // 키보드로 선택된 요소 상하좌우 이동
  const moveSelection = (event: KeyboardEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    const moveAmount = event.shiftKey ? 20 : 2; // Shift 누르면 20px 이동, 기본은 2px

    let dx = 0,
      dy = 0;
    if (event.key === "ArrowLeft") dx = -moveAmount;
    if (event.key === "ArrowRight") dx = moveAmount;
    if (event.key === "ArrowUp") dy = -moveAmount;
    if (event.key === "ArrowDown") dy = moveAmount;

    if (dx === 0 && dy === 0) return; // 이동 없으면 종료

    if (activeObjects.length > 1) {
      // 여러 개 선택 시 -> Bounding Box 기준 이동
      activeObjects.forEach((obj) => {
        obj.set({
          left: obj.left! + dx,
          top: obj.top! + dy,
        });
        obj.setCoords();
      });

      // 강제로 선택 다시 설정하여 bounding box UI 업데이트
      canvas.discardActiveObject();
      const selection = new fabric.ActiveSelection(activeObjects, {
        canvas,
      });
      canvas.setActiveObject(selection);
    } else {
      // 하나만 선택한 경우 개별이동
      const obj = activeObjects[0];
      obj.set({
        left: obj.left! + dx,
        top: obj.top! + dy,
      });
      obj.setCoords();
    }

    canvas.renderAll();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    window.addEventListener("keydown", moveSelection);
    return () => {
      window.removeEventListener("keydown", moveSelection);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 선택 변경 시 bounding box 초기화
    const resetBoundsOnSelection = () => {
      resetSelectionBounds();
    };

    // Fabric.js의 이벤트 리스너를 등록하는 부분
    // Fabric 캔버스에서 선택(selection) 관련 이벤트가 발생할 때 resetBoundsOnSelection 함수를 호출
    canvas.on("selection:created", resetBoundsOnSelection);
    canvas.on("selection:updated", resetBoundsOnSelection);
    canvas.on("selection:cleared", resetBoundsOnSelection);

    // 이벤트 리스너를 정리(cleanup), 해제하는 부분
    return () => {
      canvas.off("selection:created", resetBoundsOnSelection);
      canvas.off("selection:updated", resetBoundsOnSelection);
      canvas.off("selection:cleared", resetBoundsOnSelection);
    };
  }, []);

  const increaseScale = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setScale((prev) => {
      const newScale = Math.min(prev + 0.1, 1.5);
      updateZoom(canvas, newScale);
      return newScale;
    });
  };

  const decreaseScale = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setScale((prev) => {
      const newScale = Math.max(prev - 0.1, 0.7);
      updateZoom(canvas, newScale);
      return newScale;
    });
  };

  const resetScale = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 스케일을 1로 설정
    setScale(1);

    // 캔버스의 중앙 좌표 계산 (width와 height를 사용)
    const center = new fabric.Point(canvas.width! / 2, canvas.height! / 2);

    // 줌을 해제하여 1로 설정하면서 중앙으로 맞추기
    canvas.setZoom(1); // 줌 해제
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); // 변형 행렬 초기화
    canvas.zoomToPoint(center, 1); // 캔버스 중앙으로 맞추기
  };

  const updateZoom = (canvas: fabric.Canvas, newScale: number) => {
    // 캔버스의 중앙 좌표 계산 (width와 height를 사용)
    const center = new fabric.Point(canvas.width / 2, canvas.height / 2);

    // 새로운 스케일로 zoom을 설정
    canvas.zoomToPoint(center, newScale);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelZoom = (event: WheelEvent) => {
      event.preventDefault();

      const delta = event.deltaY;
      const zoomFactor = delta > 0 ? 0.9 : 1.1; // 스크롤 방향에 따라 줌 조정
      let newScale = Math.min(Math.max(scale * zoomFactor, 0.7), 1.5); // 최소 0.7, 최대 1.5로 제한

      // 줌 중심을 마우스 위치로 설정
      const pointer = new fabric.Point(event.offsetX, event.offsetY);
      canvas.zoomToPoint(pointer, newScale);
      setScale(newScale);
    };

    canvas.wrapperEl?.addEventListener("wheel", handleWheelZoom);

    return () => {
      canvas.wrapperEl?.removeEventListener("wheel", handleWheelZoom);
    };
  }, [scale]);

  const getSelectionBounds = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return null;

    // 이미 계산된 초기 bounding box가 있으면 그것을 반환
    if (initialSelectionBounds.current) {
      return initialSelectionBounds.current;
    }

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    activeObjects.forEach((obj) => {
      const objLeft = obj.left!;
      const objTop = obj.top!;
      const objRight = objLeft + obj.width!;
      const objBottom = objTop + obj.height!;

      left = Math.min(left, objLeft);
      top = Math.min(top, objTop);
      right = Math.max(right, objRight);
      bottom = Math.max(bottom, objBottom);
    });

    initialSelectionBounds.current = { left, top, right, bottom }; // 초기 bounding box 저장

    return { left, top, right, bottom };
  };

  // 선택 해제시 bounding box 영역 초기화
  const resetSelectionBounds = () => {
    initialSelectionBounds.current = null;
  };

  const alignLeft = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectionBounds = getSelectionBounds();
    if (!selectionBounds) return;

    const { left } = selectionBounds;

    // 선택된 객체들을 해당 영역의 좌측으로 정렬
    canvas.getActiveObjects().forEach((obj) => {
      obj.set({ left: left });
    });
    canvas.renderAll();
  };

  const alignCenter = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectionBounds = getSelectionBounds();
    if (!selectionBounds) return;

    const { left, right } = selectionBounds;
    const centerX = (left + right) / 2;

    // 선택된 객체들을 해당 영역의 중앙으로 정렬
    canvas.getActiveObjects().forEach((obj) => {
      obj.set({ left: centerX - obj.width! / 2 });
    });
    canvas.renderAll();
  };

  const alignRight = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectionBounds = getSelectionBounds();
    if (!selectionBounds) return;

    const { right } = selectionBounds;

    // 선택된 객체들을 해당 영역의 우측으로 정렬
    canvas.getActiveObjects().forEach((obj) => {
      obj.set({ left: right - obj.width! });
    });
    canvas.renderAll();
  };

  const alignTop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectionBounds = getSelectionBounds();
    if (!selectionBounds) return;

    const { top } = selectionBounds;

    // 선택된 객체들을 해당 영역의 상단으로 정렬
    canvas.getActiveObjects().forEach((obj) => {
      obj.set({ top: top });
    });
    canvas.renderAll();
  };

  const alignMiddle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectionBounds = getSelectionBounds();
    if (!selectionBounds) return;

    const { top, bottom } = selectionBounds;
    const centerY = (top + bottom) / 2;

    // 선택된 객체들을 해당 영역의 중앙으로 정렬
    canvas.getActiveObjects().forEach((obj) => {
      obj.set({ top: centerY - obj.height! / 2 });
    });
    canvas.renderAll();
  };

  const alignBottom = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectionBounds = getSelectionBounds();
    if (!selectionBounds) return;

    const { bottom } = selectionBounds;

    // 선택된 객체들을 해당 영역의 하단으로 정렬
    canvas.getActiveObjects().forEach((obj) => {
      obj.set({ top: bottom - obj.height! });
    });
    canvas.renderAll();
  };

  // 세로 균등 배치
  const distributeVertically = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectionBounds = getSelectionBounds();
    if (!selectionBounds) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length < 2) return; // 두 개 이상 선택해야 실행됨

    const { top, bottom } = selectionBounds;
    const totalHeight = bottom - top;
    const numGaps = activeObjects.length - 1;
    const totalObjectsHeight = activeObjects.reduce(
      (sum, obj) => sum + obj.height!,
      0
    );
    const gap = (totalHeight - totalObjectsHeight) / numGaps; // 균등 간격 계산

    // 객체들을 top에서부터 균일한 간격으로 배치
    let currentY = top;
    activeObjects
      .sort((a, b) => a.top! - b.top!) // 현재 위치 기준으로 정렬
      .forEach((obj) => {
        obj.set({ top: currentY });
        currentY += obj.height! + gap; // 다음 객체의 위치 계산
      });

    canvas.renderAll();
  };

  // 가로 균등 배치
  const distributeHorizontally = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectionBounds = getSelectionBounds();
    if (!selectionBounds) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length < 2) return; // 두 개 이상 선택해야 실행됨

    const { left, right } = selectionBounds;
    const totalWidth = right - left;
    const numGaps = activeObjects.length - 1;
    const totalObjectsWidth = activeObjects.reduce(
      (sum, obj) => sum + obj.width!,
      0
    );
    const gap = (totalWidth - totalObjectsWidth) / numGaps; // 균등 간격 계산

    // 객체들을 left에서부터 균일한 간격으로 배치
    let currentX = left;
    activeObjects
      .sort((a, b) => a.left! - b.left!) // 현재 위치 기준으로 정렬
      .forEach((obj) => {
        obj.set({ left: currentX });
        currentX += obj.width! + gap; // 다음 객체의 위치 계산
      });

    canvas.renderAll();
  };

  return (
    <Wrapper>
      <div>
        <OrderWrapper>
          <div>
            <ButtonGroup variant="contained">
              <Button>
                <ListIcon />
              </Button>
              <Button onClick={increaseScale}>
                <AddIcon />
              </Button>
              <Button onClick={decreaseScale}>
                <HorizontalRuleIcon />
              </Button>
              <Button onClick={resetScale}>
                <ZoomOutMapIcon />
              </Button>
            </ButtonGroup>
            <ButtonGroup
              variant="outlined"
              aria-label="Basic button group"
              sx={{ marginLeft: "10px" }}
            >
              <Button onClick={undo}>
                <SvgIcon component={UndoIcon} inheritViewBox />
              </Button>
              <Button onClick={redo}>
                <SvgIcon component={RedoIcon} inheritViewBox />
              </Button>
            </ButtonGroup>
          </div>
          <div>
            <ButtonGroup variant="outlined" aria-label="Basic button group">
              <Button onClick={distributeVertically}>
                <SwapVerticalCircleIcon />
              </Button>
              <Button onClick={distributeHorizontally}>
                <SwapHorizontalCircleIcon />
              </Button>
              <Button onClick={toggleSnapping} sx={{ marginRight: "10px" }}>
                {isSnapping ? <GridOnIcon /> : <GridOffIcon />}
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="outlined" aria-label="Basic button group">
              <Button onClick={alignLeft}>
                <AlignHorizontalLeftIcon />
              </Button>
              <Button onClick={alignCenter}>
                <AlignHorizontalCenterIcon />
              </Button>
              <Button onClick={alignRight}>
                <AlignHorizontalRightIcon />
              </Button>
              <Button onClick={alignTop}>
                <AlignVerticalTopIcon />
              </Button>
              <Button onClick={alignMiddle}>
                <AlignVerticalCenterIcon />
              </Button>
              <Button onClick={alignBottom}>
                <AlignVerticalBottomIcon />
              </Button>
            </ButtonGroup>
          </div>
        </OrderWrapper>
        <div ref={containerRef} style={{ border: "1px solid skyblue" }}>
          <canvas id="fabricCanvas" width={1300} height={700} />
        </div>
      </div>
    </Wrapper>
  );
};

export default CanvasDemo;

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  /*border: 2px solid green;*/
  height: 90%;
`;

const OrderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  /* align-items: center; */
  width: 100%;
  margin-bottom: 10px;
  /* border: 2px solid red; */
`;
