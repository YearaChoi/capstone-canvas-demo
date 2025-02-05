import React, { useRef, useEffect, useState } from "react";
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

const CanvasDemo: React.FC = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialSelectionBounds = useRef<{
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null>(null);
  const [scale, setScale] = useState(1);
  const history = useRef<fabric.Object[][]>([]);
  const redoStack = useRef<fabric.Object[][]>([]);
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
        canvas.renderAll();
      });

      canvasRef.current = canvas;

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
        });

        group.lockRotation = true;
        group.lockScalingFlip = true;
        group.lockScalingX = true;
        group.lockScalingY = true;
        group.hasControls = false;
        group.hoverCursor = "grab";
        group.moveCursor = "grabbing";

        canvas.add(group);
      }

      canvas.hoverCursor = "grab";
      canvas.moveCursor = "grabbing";

      return () => {
        canvas.dispose();
      };
    }
  }, []);

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

  const snapToGrid = () => {
    if (!isSnapping) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if (obj instanceof fabric.Group) {
        obj.set({
          left: Math.round(obj.left! / 22) * 22,
          top: Math.round(obj.top! / 22) * 22,
        });
      }
    });
    canvas.renderAll();
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
      const selection = new fabric.ActiveSelection(activeObjects, { canvas });
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

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    history.current.push(canvas.getObjects().map((obj) => obj.toObject()));
    redoStack.current = [];
  };

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
              <Button>
                <SvgIcon component={UndoIcon} inheritViewBox />
              </Button>
              <Button>
                <SvgIcon component={RedoIcon} inheritViewBox />
              </Button>
            </ButtonGroup>
          </div>
          <div>
            <ButtonGroup variant="outlined" aria-label="Basic button group">
              <Button onClick={toggleSnapping}>
                {isSnapping ? <GridOnIcon /> : <GridOffIcon />}
              </Button>
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
  /* border: 2px solid green; */
  height: 90%; // 퍼센트..모르겠다
`;

const OrderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  /* align-items: center; */
  width: 100%;
  margin-bottom: 10px;
  /* border: 2px solid red; */
`;
