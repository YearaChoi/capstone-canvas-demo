import React from "react";
import CanvasDemo from "./CanvasDemo";
import MenuAppBar from "./MenuAppBar";
import styled from "styled-components";

const App: React.FC = () => {
  return (
    <Wrapper>
      <MenuAppBar />
      <CanvasDemo />
    </Wrapper>
  );
};

export default App;

const Wrapper = styled.div`
  height: 100vh;
`;
