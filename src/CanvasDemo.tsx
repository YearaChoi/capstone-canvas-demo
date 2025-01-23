import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import bgImg from "./assets/img/bgImg.png";

const CanvasDemo: React.FC = () => {
  // Canvas의 참조를 저장하는 ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 선택된 사각형의 인덱스를 저장하는 state
  const [selectedRects, setSelectedRects] = useState<number[]>([]);
  const rects = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      x: 50 + i * 100,
      y: 100,
      width: 100,
      height: 50,
      color: `hsl(${i * 60}, 70%, 50%)`,
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

  const imageUrl = bgImg;
  // 배경 이미지 객체를 저장하는 ref
  const imageRef = useRef<HTMLImageElement | null>(null);

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
  }, [selectedRects]);

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
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    }

    // 모든 사각형 그리기
    rects.current.forEach((rect, index) => {
      // 사각형 색 채우기
      ctx.fillStyle = rect.color;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

      // 선택된 사각형 강조 표시
      if (selectedRects.includes(index)) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }

      // 사각형 내부에 좌표 텍스트 표시
      ctx.fillStyle = "black"; // Text color
      ctx.font = "14px Arial"; // Text font and size
      ctx.fillText(`x: ${rect.x}, y: ${rect.y}`, rect.x + 5, rect.y + 15);
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
        return; // 함수 종료 (사각형을 찾았으므로)
      }
    }

    // 빈 공간을 클릭한 경우 선택된 사각형을 초기화
    setSelectedRects([]);
  };

  // 일반 드래깅
  // const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  //   if (!isDragging.current || draggingRectIndex.current === null) return;

  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   const rect = canvas.getBoundingClientRect();
  //   const moveX = e.clientX - rect.left;
  //   const moveY = e.clientY - rect.top;

  //   const index = draggingRectIndex.current;
  //   if (dragOffset.current) {
  //     const dx = dragOffset.current.dx;
  //     const dy = dragOffset.current.dy;

  //     // Calculate new position
  //     let newX = moveX - dx;
  //     let newY = moveY - dy;

  //     // Ensure the rectangle stays within the canvas boundaries
  //     const canvasWidth = canvas.width;
  //     const canvasHeight = canvas.height;

  //     // Keep the rectangle within the canvas bounds horizontally
  //     newX = Math.max(
  //       0,
  //       Math.min(newX, canvasWidth - rects.current[index].width)
  //     );

  //     // Keep the rectangle within the canvas bounds vertically
  //     newY = Math.max(
  //       0,
  //       Math.min(newY, canvasHeight - rects.current[index].height)
  //     );

  //     // Apply the calculated position
  //     rects.current[index].x = newX;
  //     rects.current[index].y = newY;

  //     draw();
  //   }
  // };

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

  const handleMouseUp = () => {
    isDragging.current = false; // 드래깅 상태를 종료.
    draggingRectIndex.current = null; // 드래그 중인 사각형의 인덱스를 초기화.
    dragStart.current = null; // 드래그 시작 좌표를 초기화.
    dragOffset.current = null; // 드래그 오프셋을 초기화.
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
        <h1>Canvas Position Demo</h1>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          style={{ border: "1px solid black" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
        />
        <OrderWrapper>
          <div>
            <span>가로</span>
            <button onClick={alignLeft}>좌측 정렬</button>
            <button onClick={alignCenter}>중앙 정렬</button>
            <button onClick={alignRight}>우측 정렬</button>
            <div></div>

            <span>세로</span>
            <button onClick={alignTop}>상단 정렬</button>
            <button onClick={alignMiddle}>중앙 정렬</button>
            <button onClick={alignBottom}>하단 정렬</button>
          </div>
        </OrderWrapper>
      </div>
    </Wrapper>
  );
};

export default CanvasDemo;

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const OrderWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
`;
