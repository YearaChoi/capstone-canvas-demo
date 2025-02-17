import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

export default function ZoomDropdown({
  setZoomPercentage,
  zoomPercentage,
}: {
  setZoomPercentage: (val: number) => void;
  zoomPercentage: number;
}) {
  const handleChangeZoom = (event: SelectChangeEvent<number>) => {
    setZoomPercentage(event.target.value as number);
  };

  return (
    <FormControl
      sx={{
        m: 1,
        minWidth: 90,
        height: 36,
        margin: "none",
      }}
      size="small"
    >
      <InputLabel id="demo-select-small-label" sx={{ color: "primary.main" }}>
        zoom
      </InputLabel>
      <Select
        labelId="demo-select-small-label"
        id="demo-select-small"
        value={zoomPercentage}
        label="zoom"
        onChange={handleChangeZoom}
        renderValue={(value) => `${value}%`} // 현재 값을 %로 변환하여 표시
        sx={{
          color: "primary.main",
          fontSize: 14,
          ".MuiOutlinedInput-notchedOutline": {
            borderColor: "#2196f3",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "primary.main",
          }, // 호버 시 색상 변경
        }}
      >
        <MenuItem value={70}>70%</MenuItem>
        <MenuItem value={90}>90%</MenuItem>
        <MenuItem value={100}>100%</MenuItem>
        <MenuItem value={110}>110%</MenuItem>
        <MenuItem value={130}>130%</MenuItem>
        <MenuItem value={150}>150%</MenuItem>
      </Select>
    </FormControl>
  );
}
