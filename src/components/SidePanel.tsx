import React, { useState } from "react";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";

import styled from "styled-components";

interface SidePanelProps {
  sidePanel: boolean;
  setSidePanel: (value: boolean) => void;
}

function SidePanel({ sidePanel, setSidePanel }: SidePanelProps) {
  const showSidebar = () => setSidePanel(false);

  if (sidePanel) console.log("sidepanel opened!!!");

  return (
    <Container>
      <nav className={sidePanel ? "nav-menu active" : "nav-menu"}>
        <ModalContainer>
          <div className="navbar-toggle">
            <CloseIcon onClick={showSidebar}>
              <ClearRoundedIcon />
            </CloseIcon>
          </div>
          <ModalInfoContainer>
            <ModalInfo>
              <div className="info-container-text">
                <span>디바이스 종류: </span> 조명
              </div>
              <div className="info-container-text">
                <span>디바이스 이름: </span>
                RGB컬러 조명
              </div>
              <div className="info-container-text">
                <span>조명 색온도: </span>
                4000k
              </div>
              <div className="info-container-text">
                <span>디바이스 위치:</span> 3층 소회의실
              </div>
              <div className="info-container-text">
                <span>현재 작동 상태: </span>
                ON
              </div>
              <div className="info-container-text">
                <span>좌표: </span>(100,200)
              </div>
            </ModalInfo>
          </ModalInfoContainer>
        </ModalContainer>
      </nav>
    </Container>
  );
}

export default SidePanel;

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;

  height: 100vh;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 9999;
  & > .nav-menu.active {
    right: 0;
    transition: 500ms;
  }
  & > .nav-menu {
    background-color: #ffffff;
    width: 500px;
    border-radius: 20px;
    border: 1px solid #1b76d2;
    display: flex;
    justify-content: center;
    position: fixed;
    height: 500px;
    margin: 20px;
    right: -100%;
    transition: 1000ms;
  }
`;

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  & > .navbar-toggle {
    border-radius: 20px;
    background-color: #ffffff;

    width: 100%;
    height: 80px;
    display: flex;
    justify-content: end;
    align-items: center;
  }
`;

const CloseIcon = styled.div`
  display: flex;
  align-items: end;
  margin-right: 2rem;
  font-size: 2rem;
  background: none;
  cursor: pointer;
  color: #1b76d2;
  > svg {
    margin-top: 10px;
    font-size: 30px;
  }
`;

const ModalInfo = styled.div`
  display: flex;
  text-decoration: none;
  color: #1b76d2;
  font-size: 18px;
  display: flex;
  padding: 0 16px;

  flex-direction: column;
  width: 100%;
  height: 100%;

  & > .info-container-text {
    display: flex;
    align-items: center;
    padding: 8px;
    & > span {
      font-size: larger;
      font-weight: bolder;
      margin-right: 10px;
    }
  }
`;

const ModalInfoContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;
