import React, { useRef, useEffect, useState, ReactNode } from "react";
import styled from "styled-components";
import * as fabric from "fabric";
import bgImg from "./assets/img/bgImg3.png";
import { Button, ButtonGroup } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import ListIcon from "@mui/icons-material/List";

const CanvasDemo: React.FC = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const history = useRef<fabric.Object[][]>([]);
  const redoStack = useRef<fabric.Object[][]>([]);

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
        canvas.add(rect);
      }

      saveHistory();

      canvas.on("object:moving", () => {
        snapToGrid();
      });

      return () => {
        canvas.dispose();
      };
    }
  }, []);

  const snapToGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if (obj instanceof fabric.Rect) {
        obj.set({
          left: Math.round(obj.left! / 22) * 22,
          top: Math.round(obj.top! / 22) * 22,
        });
      }
    });

    canvas.renderAll();
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    history.current.push(canvas.getObjects().map((obj) => obj.toObject()));
    redoStack.current = [];
  };

  // const undo = () => {
  //   const canvas = canvasRef.current;
  //   if (!canvas || history.current.length === 0) return;

  //   // 현재 상태를 redoStack에 저장
  //   redoStack.current.push(canvas.getObjects().map((obj) => obj.toObject()));

  //   // history에서 마지막 상태를 가져와서 canvas에 복원
  //   const prevState = history.current.pop();
  //   if (prevState) {
  //     canvas.clear();
  //     fabric.util.enlivenObjects(prevState).then(((objs) => {
  //       objs.forEach((obj) => canvas.add(obj));
  //       canvas.renderAll();
  //     });)
  //   }
  // };

  // const redo = () => {
  //   const canvas = canvasRef.current;
  //   if (!canvas || redoStack.current.length === 0) return;

  //   // 현재 상태를 history에 저장
  //   history.current.push(canvas.getObjects().map((obj) => obj.toObject()));

  //   // redoStack에서 마지막 상태를 가져와서 canvas에 복원
  //   const nextState = redoStack.current.pop();
  //   if (nextState) {
  //     canvas.clear();
  //     fabric.util.enlivenObjects(nextState).then((objs) => {
  //       objs.forEach((obj) => canvas.add(obj));
  //       canvas.renderAll();
  //     });
  //   }
  // };

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

    setScale(1);
    updateZoom(canvas, 1);
  };

  const updateZoom = (canvas: fabric.Canvas, newScale: number) => {
    // 캔버스의 중앙 좌표 계산 (width와 height를 사용)
    const center = new fabric.Point(canvas.width / 2, canvas.height / 2);

    // 새로운 스케일로 zoom을 설정
    canvas.zoomToPoint(center, newScale);
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
            {/* <ButtonGroup
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
      </ButtonGroup> */}
          </div>
          <div>
            <ButtonGroup variant="outlined" aria-label="Basic button group">
              {/* <Button onClick={alignLeft}>좌측 정렬</Button>
        <Button onClick={alignCenter}>중앙 정렬</Button>
        <Button onClick={alignRight}>우측 정렬</Button>
        <Button onClick={alignTop}>상단 정렬</Button>
        <Button onClick={alignMiddle}>중앙 정렬</Button>
        <Button onClick={alignBottom}>하단 정렬</Button> */}
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
  width: 100%;
  margin-bottom: 10px;
`;
