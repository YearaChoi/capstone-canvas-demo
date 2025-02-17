import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import * as fabric from "fabric";
import bgImg from "../assets/img/bgImg3.png";
import {
  Button,
  ButtonGroup,
  MenuItem,
  Menu,
  SelectChangeEvent,
} from "@mui/material";
import SvgIcon from "@mui/material/SvgIcon";
import AddIcon from "@mui/icons-material/Add";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import GridOnIcon from "@mui/icons-material/GridOn";
import GridOffIcon from "@mui/icons-material/GridOff";
import AlignHorizontalLeftIcon from "@mui/icons-material/AlignHorizontalLeft";
import AlignHorizontalRightIcon from "@mui/icons-material/AlignHorizontalRight";
import AlignVerticalBottomIcon from "@mui/icons-material/AlignVerticalBottom";
import AlignVerticalTopIcon from "@mui/icons-material/AlignVerticalTop";
import AlignHorizontalCenterIcon from "@mui/icons-material/AlignHorizontalCenter";
import AlignVerticalCenterIcon from "@mui/icons-material/AlignVerticalCenter";
import BorderHorizontalIcon from "@mui/icons-material/BorderHorizontal";
import BorderVerticalIcon from "@mui/icons-material/BorderVertical";
import GridDropdown from "../components/GridDropdown";
import { TEvent } from "fabric"; // IEvent 대신 TEvent 사용
import ContentCopyIcon from "@mui/icons-material/ContentCopy"; // 복제 아이콘
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import SidePanel from "../components/SidePanel";
import ZoomDropdown from "../components/ZoomDropdown";
import { useCanvasHistory } from "src/hooks/useCanvasHistory";
import {
  alignBottom,
  alignCenter,
  alignLeft,
  alignMiddle,
  alignRight,
  alignTop,
  distributeHorizontally,
  distributeVertically,
} from "src/utils/alignmentUtils";
import { useCanvasShortcuts } from "src/hooks/useCanvasShortcuts";

const CanvasDemo: React.FC = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialSelectionBounds = useRef<{
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null>(null);

  // context menu 상태 저장 부분
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    target: fabric.Group | null;
  } | null>(null);
  // context menu 상태 저장 부분

  const [scale, setScale] = useState(1);
  const { saveState, undo, redo } = useCanvasHistory();

  const [gridPixel, setGridPixel] = React.useState<number>(25); // 현재 그리드 간격 픽셀수
  const [sidePanel, setSidePanel] = useState(false); // 정보 사이드패널

  const [isSnapping, setIsSnapping] = useState(true);
  const [zoomPercentage, setZoomPercentage] = useState(100);

  React.useEffect(() => {
    console.log("Parent gridPixel updated:", gridPixel);
    setGridPixel(gridPixel);
  }, [gridPixel]);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    containerRef.current.addEventListener("contextmenu", handleContextMenu);

    return () => {
      containerRef.current?.removeEventListener(
        "contextmenu",
        handleContextMenu
      );
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const canvas = new fabric.Canvas("fabricCanvas", {
        selection: true,
        backgroundColor: "#b3e5fc",
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
            fill: "#b3e5fc",
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
          const group = new fabric.Group([rect, text], {});

          canvas.add(group);
        }

        // 최종 랜더링을 담당
        canvas.renderAll();

        // 캔버스 최종 상태 저장
        saveState(canvas);
      });
      canvasRef.current = canvas;

      canvas.hoverCursor = "grab";
      canvas.moveCursor = "grabbing";

      // mouse:up 이벤트 리스너
      canvas.on("mouse:up", () => {
        saveState(canvas);
      });

      canvas.on("object:moving", (e) => {
        if (!e.target) return;
        moveCanvas(e.target, canvas);
      });

      return () => {
        canvas.dispose();
      };
    }
  }, []);

  // 키보드 단축키 사용
  useCanvasShortcuts(canvasRef, undo, redo);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleRightClick = (event: MouseEvent) => {
      event.preventDefault(); // 기본 컨텍스트 메뉴 방지
      console.log("우클릭 감지됨!");

      const target = canvas.findTarget(event) as fabric.Group | null;
      console.log("타겟:", target);

      if (target instanceof fabric.Group) {
        setContextMenu({
          mouseX: event.clientX,
          mouseY: event.clientY,
          target: target, // 선택된 그룹 저장
        });
        console.log("컨텍스트 메뉴 표시!");
      } else {
        setContextMenu(null);
      }
    };

    // `contextmenu` 이벤트를 감지하여 우클릭 시 메뉴 표시
    canvas.wrapperEl.addEventListener("contextmenu", handleRightClick);

    return () => {
      canvas.wrapperEl.removeEventListener("contextmenu", handleRightClick);
    };
  }, []);

  const handleClose = () => {
    setContextMenu(null);
  };

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

  const snapToGridRef = React.useRef<(event: fabric.TEvent) => void>(() => {});
  React.useEffect(() => {
    snapToGridRef.current = (event: fabric.TEvent) => {
      if (!isSnapping) return;

      const obj = (event as any).target;
      if (!obj || !(obj instanceof fabric.Group)) return;

      console.log("snap to grid", gridPixel); // 항상 최신 값 사용

      obj.set({
        left: Math.round(obj.left! / gridPixel) * gridPixel,
        top: Math.round(obj.top! / gridPixel) * gridPixel,
      });

      obj.setCoords();
      canvasRef.current!.renderAll();
    };
  }, [gridPixel, isSnapping]); // 최신 gridPixel과 isSnapping 유지

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleSnap = (event: fabric.TEvent) => snapToGridRef.current(event);

    canvas.on("object:moving", handleSnap);

    return () => {
      canvas.off("object:moving", handleSnap); // 정확한 리스너 제거
    };
  }, []);

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
      const selectedObject = canvas.getActiveObject();
      if (selectedObject === null || selectedObject === undefined) return;
      selectedObject.hasControls = false;
      selectedObject.borderScaleFactor = 1.5;
      // selectedObject.borderColor = "#0091ea";
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
    setZoomPercentage(100); // 비율 업데이트

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
    setZoomPercentage(Math.round(newScale * 100)); // 비율 업데이트
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
      setZoomPercentage(Math.round(newScale * 100)); // 비율 업데이트
    };

    canvas.wrapperEl?.addEventListener("wheel", handleWheelZoom);

    return () => {
      canvas.wrapperEl?.removeEventListener("wheel", handleWheelZoom);
    };
  }, [scale]);

  // zoomPercentage가 변경될 때 scale 값 업데이트
  useEffect(() => {
    const newScale = zoomPercentage / 100;
    setScale(newScale);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const center = new fabric.Point(canvas.width! / 2, canvas.height! / 2);
    canvas.zoomToPoint(center, newScale);
  }, [zoomPercentage]);

  // const handleChangeZoom = (event: SelectChangeEvent<number>) => {
  //   setZoomPercentage(event.target.value as number);
  // };

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

  const handleAlignLeft = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    alignLeft(canvas, getSelectionBounds);
  };

  const handleAlignCenter = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    alignCenter(canvas, getSelectionBounds);
  };

  const handleAlignRight = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    alignRight(canvas, getSelectionBounds);
  };

  const handleAlignTop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    alignTop(canvas, getSelectionBounds);
  };

  const handleAlignMiddle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    alignMiddle(canvas, getSelectionBounds);
  };

  const handleAlignBottom = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    alignBottom(canvas, getSelectionBounds);
  };

  // 세로 균등 배치
  const handleDistributeVertically = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    distributeVertically(canvas, getSelectionBounds);
  };

  // 가로 균등 배치
  const handleDistributeHorizontally = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    distributeHorizontally(canvas, getSelectionBounds);
  };

  // 요소 드래그되어 보이는 화면(뷰포트) 밖으로 나가면 뷰포트 이동
  const SCROLL_SPEED = 10; // 이동 속도

  // 요소가 현재 보이는 영역(뷰포트) 밖으로 나갔는지 체크
  const isOutOfViewport = (fabricObj: any, canvas: any) => {
    const zoom = canvas.getZoom();
    const pan = canvas.viewportTransform;
    if (!pan) return { left: false, right: false, top: false, bottom: false };

    const viewportX = -pan[4]; // 현재 뷰포트의 X 좌표
    const viewportY = -pan[5]; // 현재 뷰포트의 Y 좌표
    const canvasWidth = canvas.getWidth() / zoom; // 줌 고려한 현재 뷰포트 너비
    const canvasHeight = canvas.getHeight() / zoom; // 줌 고려한 현재 뷰포트 높이

    const coords = fabricObj.aCoords; // 객체의 좌표 (좌상단 tl, 우하단 br)

    return {
      left: coords.tl.x < viewportX, // 왼쪽으로 벗어남
      right: coords.br.x > viewportX + canvasWidth, // 오른쪽으로 벗어남
      top: coords.tl.y < viewportY, // 위쪽으로 벗어남
      bottom: coords.br.y > viewportY + canvasHeight, // 아래쪽으로 벗어남
    };
  };

  // 뷰포트 이동 함수
  const moveCanvas = (fabricObj: any, canvas: any) => {
    const out = isOutOfViewport(fabricObj, canvas);
    const zoom = canvas.getZoom();
    const pan = canvas.viewportTransform;
    if (!pan) return;

    const distanceFactor = 1 / zoom; // 줌 배율 고려하여 이동 거리 조절

    // 요소가 보이는 화면(뷰포트) 밖으로 나가면 이동
    if (out.right) {
      pan[4] -= SCROLL_SPEED * distanceFactor;
    }
    if (out.left) {
      pan[4] += SCROLL_SPEED * distanceFactor;
    }
    if (out.bottom) {
      pan[5] -= SCROLL_SPEED * distanceFactor;
    }
    if (out.top) {
      pan[5] += SCROLL_SPEED * distanceFactor;
    }

    canvas.setViewportTransform(pan);
  };

  return (
    <Wrapper>
      <div style={{ marginTop: "50px" }}>
        <OrderWrapper>
          <OrderLeft>
            <ButtonGroup variant="contained" sx={{ marginRight: "6px" }}>
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
            <ZoomDropdown
              zoomPercentage={zoomPercentage}
              setZoomPercentage={setZoomPercentage}
            />

            <GridDropdown gridPixel={gridPixel} setGridPixel={setGridPixel} />
            <ButtonGroup
              variant="outlined"
              aria-label="Basic button group"
              sx={{ marginLeft: "10px" }}
            >
              <Button onClick={toggleSnapping}>
                {isSnapping ? <GridOnIcon /> : <GridOffIcon />}
              </Button>
            </ButtonGroup>
          </OrderLeft>

          <div>
            <ButtonGroup
              variant="outlined"
              aria-label="Basic button group"
              sx={{ marginRight: "10px" }}
            >
              <Button
                onClick={() => canvasRef.current && undo(canvasRef.current)}
              >
                <SvgIcon component={UndoIcon} inheritViewBox />
              </Button>
              <Button
                onClick={() => canvasRef.current && redo(canvasRef.current)}
              >
                <SvgIcon component={RedoIcon} inheritViewBox />
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="outlined" aria-label="Basic button group">
              <Button onClick={handleDistributeVertically}>
                <BorderVerticalIcon />
              </Button>
              <Button
                onClick={handleDistributeHorizontally}
                sx={{ marginRight: "10px" }}
              >
                <BorderHorizontalIcon />
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="outlined" aria-label="Basic button group">
              <Button onClick={handleAlignLeft}>
                <AlignHorizontalLeftIcon />
              </Button>
              <Button onClick={handleAlignCenter}>
                <AlignHorizontalCenterIcon />
              </Button>
              <Button onClick={handleAlignRight}>
                <AlignHorizontalRightIcon />
              </Button>
              <Button onClick={handleAlignTop}>
                <AlignVerticalTopIcon />
              </Button>
              <Button onClick={handleAlignMiddle}>
                <AlignVerticalCenterIcon />
              </Button>
              <Button onClick={handleAlignBottom}>
                <AlignVerticalBottomIcon />
              </Button>
            </ButtonGroup>
          </div>
        </OrderWrapper>
        <div ref={containerRef} style={{ border: "1px solid #b3e5fc" }}>
          <canvas id="fabricCanvas" width={1300} height={700} />
        </div>

        <Menu
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem
            onClick={() => console.log("디바이스 삭제:", contextMenu?.target)}
          >
            <MenuText>
              <ContentCopyIcon />
              <span>복제</span>
            </MenuText>
          </MenuItem>
          <MenuItem
            onClick={() => console.log("디바이스 삭제:", contextMenu?.target)}
          >
            <MenuText>
              <DeleteOutlinedIcon />
              <span>삭제</span>
            </MenuText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              console.log("정보 보기 클릭됨!");
              setSidePanel(true);
              handleClose();
            }}
          >
            <MenuText>
              <ArticleOutlinedIcon />
              <span>정보 보기</span>
            </MenuText>
          </MenuItem>
        </Menu>
        <SidePanel sidePanel={sidePanel} setSidePanel={setSidePanel} />
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
  /* height: 90vh; */
`;

const OrderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  margin-bottom: 10px;
  /* border: 2px solid red; */
`;

const OrderLeft = styled.div`
  /* border: 2px solid blue; */
  display: flex;
  align-items: flex-end;
`;
const MenuText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: small;

  > svg {
    margin-right: 10px;
    font-size: large;
    /* border: 2px solid red; */
  }
`;
