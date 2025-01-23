import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import bgImg from "./assets/img/bgImg3.png";
import { Button, ButtonGroup, Slider } from "@mui/material";
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
      height: 50,
      // color: `hsl(${i * 60}, 70%, 50%)`,
      color: "yellow",
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

  const imageUrl = bgImg;
  // 배경 이미지 객체를 저장하는 ref
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1); // 배경 이미지의 스케일 상태

  const increaseScale = () => {
    setScale((prev) => Math.min(prev + 0.1, 1.3)); // 스케일을 증가, 최대 3배
  };

  const decreaseScale = () => {
    setScale((prev) => Math.min(prev - 0.1, 1)); // 스케일을 감소, 최소 3배
  };

  const resetScale = () => {
    setScale(1); // 스케일을 원래 비율로 초기화
  };

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

  // 캔버스를 그리는 함수
  const draw = () => {
    const canvas = canvasRef.current; // canvas 요소의 참조를 가져옴
    if (!canvas) return; // canvas가 없으면 함수 종료

    // canvas의 2D 렌더링 컨텍스트를 가져옴. 이 컨텍스트를 사용해 그림을 그릴 수 있음.
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // 만약 2D 컨텍스트를 가져오지 못했다면(브라우저가 canvas를 지원하지 않는 경우), 함수 종료.

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 이미지 그리기
    if (imageRef.current) {
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(
        imageRef.current,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight
      );
    }

    // 모든 사각형 그리기
    rects.current.forEach((rect, index) => {
      // 사각형의 크기와 위치를 캔버스 크기와 배경 이미지 스케일에 맞게 조정
      const scaledWidth = rect.width * scale;
      const scaledHeight = rect.height * scale;

      // 사각형의 기존 위치를 캔버스 크기와 배경 이미지 스케일에 맞게 조정 (배경 확대축소시 사각형들도 중앙을 기준으로 확대)
      const scaledX =
        rect.x * scale + (canvas.width - canvas.width * scale) / 2;
      const scaledY =
        rect.y * scale + (canvas.height - canvas.height * scale) / 2;

      ctx.fillStyle = rect.color;
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

      if (selectedRects.includes(index)) {
        ctx.strokeStyle = "aqua";
        ctx.lineWidth = 3;
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      }

      ctx.fillStyle = "black";
      ctx.font = "14px Arial";
      ctx.fillText(`x: ${rect.x}, y: ${rect.y}`, scaledX + 5, scaledY + 15);
    });
  };

  // 마우스 클릭 시 호출되는 함수
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; // canvas 요소의 참조를 가져옴
    if (!canvas) return; // canvas가 없으면 함수 종료

    const rect = canvas.getBoundingClientRect(); // canvas의 경계 정보를 가져옴
    const clickX = e.clientX - rect.left; // 마우스 클릭의 x 좌표 (canvas 내부 좌표로 변환)
    const clickY = e.clientY - rect.top; // 마우스 클릭의 y 좌표 (canvas 내부 좌표로 변환)

    for (let i = 0; i < rects.current.length; i++) {
      // 모든 사각형을 순회하며
      const r = rects.current[i]; // 현재 사각형 정보를 가져옴
      if (
        clickX >= r.x && // 클릭한 x 좌표가 사각형의 왼쪽 경계 이상이고
        clickX <= r.x + r.width && // 클릭한 x 좌표가 사각형의 오른쪽 경계 이하이며
        clickY >= r.y && // 클릭한 y 좌표가 사각형의 위쪽 경계 이상이고
        clickY <= r.y + r.height // 클릭한 y 좌표가 사각형의 아래쪽 경계 이하일 경우
      ) {
        draggingRectIndex.current = i; // 드래그 중인 사각형의 인덱스를 저장
        dragStart.current = { x: clickX, y: clickY }; // 드래그 시작 위치를 저장
        dragOffset.current = { dx: clickX - r.x, dy: clickY - r.y }; // 마우스와 사각형 간의 거리(offset)를 저장
        isDragging.current = true; // 드래그 상태를 활성화
        canvas.style.cursor = "grabbing";
        return; // 함수 종료 (사각형을 찾았으므로)
      }
    }

    // 빈 공간을 클릭한 경우 선택된 사각형을 초기화
    setSelectedRects([]);
    canvas.style.cursor = "grab";
  };

  // 스냅핑 기능 적용
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 드래깅 중이 아니거나 드래그 중인 사각형이 없으면 함수 종료.
    if (!isDragging.current || draggingRectIndex.current === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect(); // canvas의 위치와 크기를 가져옴.
    const moveX = e.clientX - rect.left; // 마우스 X 좌표를 canvas 좌표계로 변환.
    const moveY = e.clientY - rect.top; // 마우스 Y 좌표를 canvas 좌표계로 변환.

    const index = draggingRectIndex.current; // 드래그 중인 사각형의 인덱스를 가져옴.
    if (dragOffset.current) {
      // 드래그 시작 시의 오프셋이 있는지 확인.
      const dx = dragOffset.current.dx; // X축 드래그 오프셋.
      const dy = dragOffset.current.dy; // Y축 드래그 오프셋.

      // 새로운 사각형 위치 계산
      let newX = moveX - dx;
      let newY = moveY - dy;

      // 위치를 22px 그리드에 맞춰 스냅핑 처리
      newX = Math.round(newX / 22) * 22;
      newY = Math.round(newY / 22) * 22;

      // 사각형이 canvas 경계를 넘지 않도록 제한
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      newX = Math.max(
        0,
        Math.min(newX, canvasWidth - rects.current[index].width)
      ); // X축 경계 처리

      newY = Math.max(
        0,
        Math.min(newY, canvasHeight - rects.current[index].height)
      ); // Y축 경계 처리

      // 계산된 X,Y좌표를 사각형에 적용
      rects.current[index].x = newX;
      rects.current[index].y = newY;

      draw();
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
    isDragging.current = false; // 드래깅 상태를 종료.
    draggingRectIndex.current = null; // 드래그 중인 사각형의 인덱스를 초기화.
    dragStart.current = null; // 드래그 시작 좌표를 초기화.
    dragOffset.current = null; // 드래그 오프셋을 초기화.

    saveHistory(); // Save history after drag
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = "grab"; // 마우스 업 시 손 모양 복원
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) return; // 드래그 중이면 클릭 이벤트 무시.

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect(); // canvas의 위치와 크기를 가져옴.
    const clickX = e.clientX - rect.left; // 마우스 X 좌표를 canvas 좌표계로 변환.
    const clickY = e.clientY - rect.top; // 마우스 Y 좌표를 canvas 좌표계로 변환.

    let selectedIndexes = [...selectedRects]; // 현재 선택된 사각형의 인덱스를 복사.
    rects.current.forEach((r, index) => {
      if (
        clickX >= r.x &&
        clickX <= r.x + r.width &&
        clickY >= r.y &&
        clickY <= r.y + r.height
      ) {
        // 클릭된 사각형이 이미 선택되어 있다면 선택 해제.
        if (selectedIndexes.includes(index)) {
          selectedIndexes = selectedIndexes.filter((i) => i !== index);
        } else {
          selectedIndexes.push(index); // 선택되지 않았다면 새로 선택.
        }
      }
    });
    setSelectedRects(selectedIndexes); // 선택된 사각형 상태 업데이트.
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
          style={{ border: "1px solid black" }}
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
