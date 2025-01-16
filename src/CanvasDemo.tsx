import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import bgImg from "./assets/img/bgImg.png";

const CanvasDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedRects, setSelectedRects] = useState<number[]>([]);
  const rects = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      x: 50 + i * 120,
      y: 100,
      width: 100,
      height: 50,
      color: `hsl(${i * 60}, 70%, 50%)`,
    }))
  );

  const isDragging = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  const draggingRectIndex = useRef<number | null>(null);

  const imageUrl = bgImg;
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      imageRef.current = image;
      draw(); // 이미지 로드 후 캔버스에 그리기
    };
  }, []);

  useEffect(() => {
    draw();
  }, [selectedRects]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 이미지 그리기
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Draw all rectangles
    rects.current.forEach((rect, index) => {
      ctx.fillStyle = rect.color;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

      // Highlight selected rectangles
      if (selectedRects.includes(index)) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }

      // Draw x, y coordinates on each rectangle
      ctx.fillStyle = "black"; // Text color
      ctx.font = "14px Arial"; // Text font and size
      ctx.fillText(`x: ${rect.x}, y: ${rect.y}`, rect.x + 5, rect.y + 15); // Position text inside the rectangle
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = 0; i < rects.current.length; i++) {
      const r = rects.current[i];
      if (
        clickX >= r.x &&
        clickX <= r.x + r.width &&
        clickY >= r.y &&
        clickY <= r.y + r.height
      ) {
        draggingRectIndex.current = i;
        dragStart.current = { x: clickX, y: clickY };
        dragOffset.current = { dx: clickX - r.x, dy: clickY - r.y };
        isDragging.current = true;
        return;
      }
    }

    // Unselect if clicked on empty space
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
    if (!isDragging.current || draggingRectIndex.current === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;

    const index = draggingRectIndex.current;
    if (dragOffset.current) {
      const dx = dragOffset.current.dx;
      const dy = dragOffset.current.dy;

      // Calculate new position
      let newX = moveX - dx;
      let newY = moveY - dy;

      // Apply snapping to 10px grid
      newX = Math.round(newX / 20) * 20;
      newY = Math.round(newY / 20) * 20;

      // Ensure the rectangle stays within the canvas boundaries
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Keep the rectangle within the canvas bounds horizontally
      newX = Math.max(
        0,
        Math.min(newX, canvasWidth - rects.current[index].width)
      );

      // Keep the rectangle within the canvas bounds vertically
      newY = Math.max(
        0,
        Math.min(newY, canvasHeight - rects.current[index].height)
      );

      // Apply the calculated position
      rects.current[index].x = newX;
      rects.current[index].y = newY;

      draw();
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    draggingRectIndex.current = null;
    dragStart.current = null;
    dragOffset.current = null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) return; // Ignore clicks during drag

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let selectedIndexes = [...selectedRects];
    rects.current.forEach((r, index) => {
      if (
        clickX >= r.x &&
        clickX <= r.x + r.width &&
        clickY >= r.y &&
        clickY <= r.y + r.height
      ) {
        // Toggle selection on click
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
    if (selectedRects.length === 0) return;

    selectedRects.forEach((index) => {
      rects.current[index].x = 10;
    });
    draw();
  };

  const alignCenter = () => {
    if (selectedRects.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasWidth = canvas.width;

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
