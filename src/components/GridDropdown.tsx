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
  const [pixels, setPixels] = React.useState(100);
  return (
    <FormControl sx={{ m: -0.2, minWidth: 120 }} size="small">
      <InputLabel id="demo-select-small-label">Grid</InputLabel>
      <Select
        labelId="demo-select-small-label"
        id="demo-select-small"
        value={gridPixel.toString()}
        label="Grid"
        onChange={handleChange}
      >
        <MenuItem value="100">100px</MenuItem>
        <MenuItem value="50">50px</MenuItem>
        <MenuItem value="25">25px</MenuItem>
      </Select>
    </FormControl>
  );
}
