import React, { useState, useEffect, useRef, useCallback } from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Button, SelectChangeEvent, Snackbar } from "@mui/material";
import './App.css';
import { floors } from './Data';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import arrow from './arrow';

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
  const [NOT_COPIED, COPIED_ERROR, COPIED_OK] = [0, 1, 2]
  const [copied, setCopied] = useState(NOT_COPIED)
  const copyToClipboard = (() => {
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
      .filter(([name, _]) => selectedFloor === null || selectedFloor === name)
      .map(([name, rooms]) => {
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
          canvas.toBlob(blob => {
            if (!blob) {
              console.error('did not get a blob', { blob });
              setCopied(COPIED_ERROR)
              return;
            }
            navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob
              })
            ]).then(() => {
              setCopied(COPIED_OK)
            }).catch((error) => {
              console.error(error);
              setCopied(COPIED_ERROR)
            }).finally(() => {
              canvas.height = 0;
              canvas.width = 0;
            })
          })
        }
      })

  })
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
      {selectedFloor !== null && <Button onClick={() => copyToClipboard()}><ContentCopyIcon /></Button>}
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
      <Snackbar
        open={copied !== NOT_COPIED}
        autoHideDuration={6000}
        onClose={() => setCopied(NOT_COPIED)}
        message={copied === COPIED_OK ? "Copiado" : (copied === COPIED_ERROR ? "Error al copiar" : "?")}
      />
      <canvas ref={canvasRef} style={{ visibility: 'hidden' }}></canvas>
    </div>
  );
}

export default App;
