import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import bgImg from "./assets/img/bgImg3.png";
import { Button, ButtonGroup } from "@mui/material";
import SvgIcon from "@mui/material/SvgIcon";
import AddIcon from "@mui/icons-material/Add";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import ListIcon from "@mui/icons-material/List";

const CanvasDemo: React.FC = () => {
  // Canvas의 참조를 저장하는 ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 선택된 사각형의 인덱스를 저장하는 state
  const [selectedRects, setSelectedRects] = useState<number[]>([]);
  const rects = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      x: 50 + i * 120,
      y: 100,
      width: 100,
      height: 40,
      // color: `hsl(${i * 60}, 70%, 50%)`,
      // color: "skyblue",
      color: `hsl(186, 100%, 94%)`,
    }))
  );

  // 드래그 상태를 관리하는 ref
  const isDragging = useRef(false);
  // 드래그 시작 시점의 좌표 저장 ref
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  // 드래그 시 마우스와 사각형의 거리(offset) 저장 ref
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  // 드래그 중인 사각형의 인덱스 저장 ref
  const draggingRectIndex = useRef<number | null>(null);
  const history = useRef<
    { rects: (typeof rects.current)[]; selectedRects: number[] }[]
  >([]);
  const redoStack = useRef<
    { rects: (typeof rects.current)[]; selectedRects: number[] }[]
  >([]);
  // 배경 드래그 관련 상태를 관리
  const isPanning = useRef(false); // 배경 드래그 중인지 여부
  const panStart = useRef<{ x: number; y: number } | null>(null); // 배경 드래그 시작 좌표
  const panOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 }); // 현재 배경 오프셋 값

  const imageUrl = bgImg;
  // 배경 이미지 객체를 저장하는 ref
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1); // 배경 이미지의 스케일 상태

  const increaseScale = () => {
    setScale((prev) => Math.min(prev + 0.1, 1.5)); // 스케일을 증가
  };

  const decreaseScale = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.7)); // 스케일을 감소
  };

  const resetScale = () => {
    setScale(1); // 스케일을 원래 비율로 초기화
  };

  const STORAGE_KEY = "canvas_rects";

  const saveToLocalStorage = () => {
    // 값을 json으로 문자열로 변환
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rects.current));
  };

  const loadFromLocalStorage = () => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      // json 값을 원래 값으로 변환
      rects.current = JSON.parse(storedData);
      draw();
    }
  };

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // 컴포넌트 마운트 시 배경 이미지 로드
  useEffect(() => {
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      imageRef.current = image;
      draw(); // 이미지가 로드된 후 캔버스 다시 그리기
    };
  }, []);

  // 선택된 사각형이 변경될 때마다 캔버스 다시 그리기
  useEffect(() => {
    draw();
  }, [selectedRects, scale]);

  // 캔버스 드로잉 함수 - 배경 드래그 오프셋 반영
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 이미지 그리기 (오프셋 반영)
    if (imageRef.current) {
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      const offsetX = (canvas.width - scaledWidth) / 2 + panOffset.current.x; // X축 드래그 오프셋 적용
      const offsetY = (canvas.height - scaledHeight) / 2 + panOffset.current.y; // Y축 드래그 오프셋 적용

      ctx.drawImage(
        imageRef.current,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight
      );
    }

    // 사각형 그리기
    rects.current.forEach((rect, index) => {
      const scaledWidth = rect.width * scale;
      const scaledHeight = rect.height * scale;
      const scaledX =
        rect.x * scale +
        (canvas.width - canvas.width * scale) / 2 +
        panOffset.current.x; // 배경 오프셋 반영
      const scaledY =
        rect.y * scale +
        (canvas.height - canvas.height * scale) / 2 +
        panOffset.current.y; // 배경 오프셋 반영

      ctx.fillStyle = rect.color;
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

      if (selectedRects.includes(index)) {
        ctx.strokeStyle = "aqua";
        ctx.lineWidth = 3;
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      }

      const fontSize = 14 * scale;
      ctx.fillStyle = "black";
      ctx.font = `${fontSize}px Arial`;
      ctx.fillText(`x: ${rect.x}, y: ${rect.y}`, scaledX + 5, scaledY + 15);
    });
  };

  const transformCoordinates = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { transformedX: x, transformedY: y };

    const rect = canvas.getBoundingClientRect(); // 캔버스의 크기와 위치
    const canvasX = x - rect.left; // 캔버스 내부 좌표로 변환
    const canvasY = y - rect.top;

    // 확대/축소와 이동(panning)을 고려하여 좌표 변환
    const transformedX =
      (canvasX -
        panOffset.current.x -
        (canvas.width - canvas.width * scale) / 2) /
      scale;
    const transformedY =
      (canvasY -
        panOffset.current.y -
        (canvas.height - canvas.height * scale) / 2) /
      scale;

    return { transformedX, transformedY };
  };

  // 마우스 클릭 시 호출되는 함수
  // 수정: handleMouseDown - 배경 드래그 시작 시 정확한 panStart 값 설정
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { transformedX, transformedY } = transformCoordinates(
      e.clientX,
      e.clientY
    );

    // 사각형 클릭 여부를 판단
    for (let i = 0; i < rects.current.length; i++) {
      const r = rects.current[i];
      if (
        transformedX >= r.x &&
        transformedX <= r.x + r.width &&
        transformedY >= r.y &&
        transformedY <= r.y + r.height
      ) {
        draggingRectIndex.current = i;
        dragStart.current = { x: transformedX, y: transformedY }; // 변환된 좌표로 설정
        dragOffset.current = { dx: transformedX - r.x, dy: transformedY - r.y };
        isDragging.current = true;
        canvas.style.cursor = "grabbing";
        return;
      }
    }

    // 사각형을 클릭하지 않았으면 배경 드래그 활성화
    isPanning.current = true;
    panStart.current = { x: clickX, y: clickY }; // 클릭한 위치를 panStart로 설정 (화면 좌표)
    canvas.style.cursor = "grabbing";
  };

  // 수정: 마우스 무브 핸들러 - 배경 드래그 동작 추가
  // 수정: handleMouseMove - 배경 드래그 정확도 개선
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;

    // 배경 드래그 중일 경우
    if (isPanning.current && panStart.current) {
      const dx = moveX - panStart.current.x;
      const dy = moveY - panStart.current.y;

      panOffset.current.x += dx; // 드래그한 거리만큼 X 오프셋 업데이트
      panOffset.current.y += dy; // 드래그한 거리만큼 Y 오프셋 업데이트

      panStart.current = { x: moveX, y: moveY }; // 현재 마우스 위치를 드래그 시작 위치로 갱신
      draw();
      return;
    }

    // 사각형 드래그 중일 경우
    if (isDragging.current && draggingRectIndex.current !== null) {
      const { transformedX, transformedY } = transformCoordinates(
        e.clientX,
        e.clientY
      );
      const index = draggingRectIndex.current;

      if (dragOffset.current) {
        const dx = dragOffset.current.dx;
        const dy = dragOffset.current.dy;

        let newX = transformedX - dx;
        let newY = transformedY - dy;

        // 그리드 스냅 처리
        newX = Math.round(newX / 22) * 22;
        newY = Math.round(newY / 22) * 22;

        // 캔버스 경계 처리
        const canvasWidth = canvas.width / scale; // 확대/축소를 고려한 실제 캔버스 너비
        const canvasHeight = canvas.height / scale; // 확대/축소를 고려한 실제 캔버스 높이

        newX = Math.max(
          0,
          Math.min(newX, canvasWidth - rects.current[index].width)
        );
        newY = Math.max(
          0,
          Math.min(newY, canvasHeight - rects.current[index].height)
        );

        rects.current[index].x = newX;
        rects.current[index].y = newY;

        draw();
      }
    }
  };

  const saveHistory = () => {
    history.current.push({
      rects: JSON.parse(JSON.stringify(rects.current)),
      selectedRects: [...selectedRects],
    });
    redoStack.current = []; // 새로운 변경 사항이 생기면 redo 스택 초기화
  };

  const undo = () => {
    if (history.current.length > 0) {
      redoStack.current.push({
        rects: JSON.parse(JSON.stringify(rects.current)),
        selectedRects: [...selectedRects],
      });
      const previousState = history.current.pop();
      if (previousState) {
        rects.current = JSON.parse(JSON.stringify(previousState.rects));
        setSelectedRects([...previousState.selectedRects]);
        draw();
      }
    }
  };

  const redo = () => {
    if (redoStack.current.length > 0) {
      history.current.push({
        rects: JSON.parse(JSON.stringify(rects.current)),
        selectedRects: [...selectedRects],
      });
      const nextState = redoStack.current.pop();
      if (nextState) {
        rects.current = JSON.parse(JSON.stringify(nextState.rects));
        setSelectedRects([...nextState.selectedRects]);
        draw();
      }
    }
  };

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = "grab";
    }

    // 배경 드래그 상태 종료
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null; // 드래그 시작 위치 초기화
      return;
    }

    // 사각형 드래그 상태 종료
    if (isDragging.current) {
      isDragging.current = false;
      draggingRectIndex.current = null;
      dragStart.current = null;
      dragOffset.current = null;
      saveHistory();
      saveToLocalStorage();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const delta = e.deltaY;
    if (delta > 0) {
      decreaseScale();
    } else {
      increaseScale();
    }
  };

  // 수정: handleCanvasClick - 클릭 좌표 변환 적용
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { transformedX, transformedY } = transformCoordinates(
      e.clientX,
      e.clientY
    );

    let selectedIndexes = [...selectedRects];
    rects.current.forEach((r, index) => {
      if (
        transformedX >= r.x &&
        transformedX <= r.x + r.width &&
        transformedY >= r.y &&
        transformedY <= r.y + r.height
      ) {
        if (selectedIndexes.includes(index)) {
          selectedIndexes = selectedIndexes.filter((i) => i !== index);
        } else {
          selectedIndexes.push(index);
        }
      }
    });
    setSelectedRects(selectedIndexes);
  };

  const alignLeft = () => {
    if (selectedRects.length === 0) return; // 선택된 사각형이 없으면 함수 종료.

    selectedRects.forEach((index) => {
      rects.current[index].x = 10; // 모든 선택된 사각형의 X 좌표를 10으로 설정.
    });
    draw();
  };

  const alignCenter = () => {
    if (selectedRects.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasWidth = canvas.width; // canvas의 폭 가져오기.

    selectedRects.forEach((index) => {
      rects.current[index].x = (canvasWidth - rects.current[index].width) / 2;
    });
    draw();
  };

  const alignRight = () => {
    if (selectedRects.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasWidth = canvas.width;

    selectedRects.forEach((index) => {
      rects.current[index].x = canvasWidth - rects.current[index].width - 10;
    });
    draw();
  };

  const alignTop = () => {
    if (selectedRects.length === 0) return;

    selectedRects.forEach((index) => {
      rects.current[index].y = 10;
    });
    draw();
  };

  const alignMiddle = () => {
    if (selectedRects.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasHeight = canvas.height;

    selectedRects.forEach((index) => {
      rects.current[index].y = (canvasHeight - rects.current[index].height) / 2;
    });
    draw();
  };

  const alignBottom = () => {
    if (selectedRects.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasHeight = canvas.height;

    selectedRects.forEach((index) => {
      rects.current[index].y = canvasHeight - rects.current[index].height - 10;
    });
    draw();
  };

  return (
    <Wrapper>
      <div>
        <OrderWrapper>
          <div>
            <ButtonGroup variant="contained" aria-label="Basic button group">
              <Button>
                <SvgIcon component={ListIcon} inheritViewBox />
              </Button>
              <Button onClick={increaseScale}>
                {" "}
                <SvgIcon component={AddIcon} inheritViewBox />
              </Button>
              <Button onClick={decreaseScale}>
                <SvgIcon component={HorizontalRuleIcon} inheritViewBox />
              </Button>
              <Button onClick={resetScale}>
                <SvgIcon component={ZoomOutMapIcon} inheritViewBox />
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
              <Button onClick={alignLeft}>좌측 정렬</Button>
              <Button onClick={alignCenter}>중앙 정렬</Button>
              <Button onClick={alignRight}>우측 정렬</Button>
              <Button onClick={alignTop}>상단 정렬</Button>
              <Button onClick={alignMiddle}>중앙 정렬</Button>
              <Button onClick={alignBottom}>하단 정렬</Button>
            </ButtonGroup>
          </div>
        </OrderWrapper>
        <canvas
          ref={canvasRef}
          width={1300}
          height={700}
          style={{ border: "1px solid skyblue", borderRadius: "4px" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        />
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
  margin-bottom: 5px;
`;
