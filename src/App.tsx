import React, { useState, useEffect } from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { SelectChangeEvent } from "@mui/material";
import './App.css';
import { floors } from './Data';

function App() {
  const allRooms = useState(() => Object.values(floors).flatMap((rooms) => rooms.map(({ name }) => name)))[0];
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  useEffect(() => {
    if (selectedRoom === null) {
      setSelectedFloor(null);
      return;
    }
    setSelectedFloor(
      Object.entries(floors)
        .find(([_, rooms]) => rooms.some(({ name }) => name === selectedRoom))![0]
    );
  }, [selectedRoom]);
  const handleChange = (ev: SelectChangeEvent) => {
    setSelectedRoom(ev.target.value === '' ? null : ev.target.value);
  }
  return (
    <div>
      <FormControl fullWidth>
        <InputLabel id="aula">Aula</InputLabel>
        <Select
          labelId="aula"
          label="Aula"
          onChange={handleChange}
          value={selectedRoom || ''}
        >
          <MenuItem value=''>Buscar aula...</MenuItem>
          {allRooms.map((room) => (<MenuItem value={room} key={room}>{room}</MenuItem>))}
        </Select>
      </FormControl>
      {Object.entries(floors)
        .filter(([name, _]) => selectedFloor === null || selectedFloor === name)
        .map(([name, rooms]) => (
        <svg xmlns="http://www.w3.org/2000/svg"
             xmlnsXlink="http://www.w3.org/1999/xlink"
             viewBox="0 0 2993 2117"
             key={name}>
          <image
              width="2993" height="2117"
              xlinkHref={`${process.env.PUBLIC_URL}/images/${encodeURIComponent(name)}.png`}
              />
          {rooms.map(({ name, top, left, width, height }) => (<rect key={name} 
              y={top}
              x={left}
              width={width}
              height={height}
              style={name === selectedRoom ? {
                fill: 'yellow',
                fillOpacity: '0.5',
              } : {
                fill: 'transparent',
              }}
            />
        ))}
      </svg>))}
    </div>
  );
}

export default App;
