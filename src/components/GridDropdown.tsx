import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

export default function GridDropdown({
  setGridPixel,
  gridPixel,
}: {
  setGridPixel: (val: number) => void;
  gridPixel: number;
}) {
  const handleChange = (event: SelectChangeEvent) => {
    setGridPixel(Number(event.target.value));
    // setPixels(Number(event.target.value));
  };

  return (
    <FormControl
      sx={{
        m: 1,
        minWidth: 90,
        height: 36,
        margin: "none",
        marginLeft: "10px",
      }}
      size="small"
    >
      <InputLabel id="demo-select-small-label" sx={{ color: "primary.main" }}>
        Grid
      </InputLabel>
      <Select
        labelId="demo-select-small-label"
        id="demo-select-small"
        value={gridPixel.toString()}
        label="Grid"
        onChange={handleChange}
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
        <MenuItem value="50">50px</MenuItem>
        <MenuItem value="25">25px</MenuItem>
        <MenuItem value="12.5">12.5px</MenuItem>
      </Select>
    </FormControl>
  );
}
