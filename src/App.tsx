import React, { useState, useEffect, useRef } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { floors } from './Data';
import arrow from './arrow';

const WIDTH = 2993
const HEIGHT = 2117

interface RoomOption {
  name: string;
  floor: string;
}

const floorImage = (floor: string) => `${import.meta.env.BASE_URL}images/${encodeURIComponent(floor)}.png`
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function FloorCard({ title, subtitle, action, children }: { title: string, subtitle?: string, action?: React.ReactNode, children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6" component="h2">{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {action}
      </Stack>
      <Box sx={{ bgcolor: 'common.white', aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
        {children}
      </Box>
    </Paper>
  );
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const allRooms = useState<RoomOption[]>(() => Object.entries(floors).flatMap(([floor, rooms]) => rooms.map(({ name }) => ({ name, floor }))))[0];
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null);
  useEffect(() => {
    setRoomImage(null);
    if (selectedRoom === null) {
      return;
    }
    let cancelled = false;
    const canvas = canvasRef.current
    if (!canvas) return;
    const ctx = canvas.getContext('2d')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.src = floorImage(selectedRoom.floor);
    image.onload = () => {
      if (cancelled) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, image.width, image.height)
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'blue'
      floors[selectedRoom.floor].forEach(({ name, top, left, width, height }) => {
        if (name !== selectedRoom.name) return;
        const ARROW_LENGTH = 300;
        const ARROW_SPACE = 10
        arrow(ctx, left - ARROW_LENGTH, top - ARROW_LENGTH, left - ARROW_SPACE, top - ARROW_SPACE);
        arrow(ctx, left + width + ARROW_LENGTH, top - ARROW_LENGTH, left + width + ARROW_SPACE, top - ARROW_SPACE);
        arrow(ctx, left - ARROW_LENGTH, top + height + ARROW_LENGTH, left - ARROW_SPACE, top + height + ARROW_SPACE);
        arrow(ctx, left + width + ARROW_LENGTH, top + height + ARROW_LENGTH, left + width + ARROW_SPACE, top + height + ARROW_SPACE);
      })

      ctx.stroke();
      setRoomImage(canvas.toDataURL())
    }
    return () => {
      cancelled = true;
    };
  }, [selectedRoom])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 6 }}>
      <Box component="header" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', pt: { xs: 4, sm: 6 }, pb: { xs: 8, sm: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>Plano de Derecho UBA</Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.85 }}>Encontrá tu aula en la Facultad de Derecho</Typography>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ mt: { xs: -5, sm: -6 } }}>
        <Paper elevation={3} sx={{ p: 1, borderRadius: 3, mb: 3 }}>
          <Autocomplete
            options={allRooms}
            groupBy={(room) => capitalize(room.floor)}
            getOptionLabel={(room) => room.name}
            isOptionEqualToValue={(a, b) => a.name === b.name}
            value={selectedRoom}
            onChange={(_, room) => setSelectedRoom(room)}
            autoHighlight
            renderInput={(params) => <TextField {...params} label="Aula" placeholder="Buscar aula…" />}
          />
        </Paper>
        <Stack spacing={3}>
          {selectedRoom === null ? Object.keys(floors).map((floor) => (
            <FloorCard key={floor} title={capitalize(floor)}>
              <Box component="img" src={floorImage(floor)} alt={`Plano de ${floor}`} sx={{ display: 'block', width: '100%' }} />
            </FloorCard>
          )) : (
            <FloorCard
              title={/^\d/.test(selectedRoom.name) ? `Aula ${selectedRoom.name}` : selectedRoom.name}
              subtitle={capitalize(selectedRoom.floor)}
              action={roomImage && <Button variant="contained" href={roomImage} download={`${selectedRoom.name}.png`}>Descargar</Button>}
            >
              {roomImage
                ? <Box component="img" src={roomImage} alt={`Ubicación de ${selectedRoom.name} en ${selectedRoom.floor}`} sx={{ display: 'block', width: '100%' }} />
                : <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%' }} />}
            </FloorCard>
          )}
        </Stack>
      </Container>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </Box>
  );
}

export default App;
