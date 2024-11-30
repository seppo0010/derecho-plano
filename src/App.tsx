import React, { useState, useEffect, useRef } from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { SelectChangeEvent } from "@mui/material";
import './App.css';
import { floors } from './Data';
import arrow from './arrow';

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const allRooms = useState(() => Object.values(floors).flatMap((rooms) => rooms.map(({ name }) => name)))[0];
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const handleChange = (ev: SelectChangeEvent) => {
    setSelectedRoom(ev.target.value === '' ? null : ev.target.value);
  }
  useEffect(() => {
    setRoomImage(null);
    if (selectedRoom === null) {
      return;
    }
    const s = selectedRoom;
    const WIDTH = 2993
    const HEIGHT = 2117
    if (!canvasRef) return;
    const canvas = canvasRef.current as (HTMLCanvasElement | null)
    if (!canvas) return;
    const ctx = canvas.getContext('2d')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    Object.entries(floors)
      .filter(([_, rooms]) =>
        rooms.some(({ name }) => name === selectedRoom)
      )
      .forEach(([name, rooms]) => {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.src = `${process.env.PUBLIC_URL}/images/${encodeURIComponent(name)}.png`;
        image.onload = () => {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, image.width, image.height)
          ctx.lineWidth = 10;
          ctx.strokeStyle = 'blue'
          rooms.forEach(({ name, top, left, width, height }) => {
            if (name !== selectedRoom) return;
            const ARROW_LENGTH = 300;
            const ARROW_SPACE = 10
            arrow(ctx, left - ARROW_LENGTH, top - ARROW_LENGTH, left - ARROW_SPACE, top - ARROW_SPACE);
            arrow(ctx, left + width + ARROW_LENGTH, top - ARROW_LENGTH, left + width + ARROW_SPACE, top - ARROW_SPACE);
            arrow(ctx, left - ARROW_LENGTH, top + height + ARROW_LENGTH, left - ARROW_SPACE, top + height + ARROW_SPACE);
            arrow(ctx, left + width + ARROW_LENGTH, top + height + ARROW_LENGTH, left + width + ARROW_SPACE, top + height + ARROW_SPACE);
          })

          ctx.stroke();
          if (s === selectedRoom) {
            setRoomImage(canvas.toDataURL())
          }
        }
      })
  }, [selectedRoom])

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
      {selectedRoom === null ? Object.entries(floors)
        .map(([name, rooms]) => (
          <img key={name} src={`${process.env.PUBLIC_URL}/images/${encodeURIComponent(name)}.png`} alt="" />
        )) : (roomImage ? <img src={roomImage} alt="" /> : '')}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

export default App;
