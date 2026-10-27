import React, { useState, useEffect, useRef } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { floors, roomSlug, roomTitle } from './Data';
import FloorPlan, { COLORS, aspect, planViewBox } from './FloorPlan';

interface RoomOption {
  name: string;
  floor: string;
}

const allRooms: RoomOption[] = Object.entries(floors).flatMap(([floor, rooms]) => rooms.map(({ name }) => ({ name, floor })))

const SITE_TITLE = 'Plano de Derecho UBA'
const roomPath = (room: RoomOption | null) => import.meta.env.BASE_URL + (room ? `aula/${roomSlug(room.name)}/` : '')

// Links used to select the room with the hash (#42); those are moved to the room's page.
const roomFromHash = () => {
  let name: string
  try {
    name = decodeURIComponent(window.location.hash.slice(1))
  } catch {
    return null
  }
  return allRooms.find((room) => room.name === name) ?? null
}

const roomFromLocation = () => {
  const hashRoom = roomFromHash()
  if (hashRoom) {
    window.history.replaceState(null, '', roomPath(hashRoom))
    return hashRoom
  }
  const match = window.location.pathname.match(/\/aula\/([^/]+)\/?$/)
  return match ? allRooms.find((room) => roomSlug(room.name) === match[1]) ?? null : null
}

// Rasterize the plan so it can be shown as an <img>, which users can copy or save.
const renderPng = (svgElement: SVGSVGElement): Promise<string> => new Promise((resolve, reject) => {
  const svg = new XMLSerializer().serializeToString(svgElement)
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error('canvas not supported'))
    ctx.drawImage(image, 0, 0)
    resolve(canvas.toDataURL())
  }
  image.onerror = reject
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
})
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// The room under a mouse event on the plan's image, which shows the floor's whole viewBox.
const roomAt = (floor: string, event: React.MouseEvent<HTMLImageElement>) => {
  const [x, y, width, height] = planViewBox(floor)
  const bounds = event.currentTarget.getBoundingClientRect()
  const px = x + ((event.clientX - bounds.left) / bounds.width) * width
  const py = y + ((event.clientY - bounds.top) / bounds.height) * height
  return floors[floor].find((room) => px >= room.left && px <= room.left + room.width && py >= room.top && py <= room.top + room.height)
}

function FloorCard({ aspectRatio, title, subtitle, action, children }: { aspectRatio: string, title: string, subtitle?: string, action?: React.ReactNode, children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6" component="h2">{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {action}
      </Stack>
      <Box sx={{ bgcolor: COLORS.background, aspectRatio, '& svg': { display: 'block', width: '100%', height: 'auto' }, '& .room:hover rect': { fill: COLORS.roomHover }, '& .room:focus': { outline: 'none' }, '& .room:focus-visible rect': { fill: COLORS.roomHover, stroke: COLORS.selected, strokeWidth: 8 } }}>
        {children}
      </Box>
    </Paper>
  );
}

function App() {
  const planRef = useRef<SVGSVGElement | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(roomFromLocation);
  // what the plan is rendered for; the image is only shown once it matches
  const imageKey = selectedRoom && selectedRoom.name;
  const [rendered, setRendered] = useState<{ key: string, png: string } | null>(null);
  const roomImage = rendered && rendered.key === imageKey ? rendered.png : null;
  const [hoveringRoom, setHoveringRoom] = useState(false);
  const selectRoom = (room: RoomOption | null) => {
    setSelectedRoom(room);
    window.history.pushState(null, '', roomPath(room));
  }
  useEffect(() => {
    const onLocationChange = () => setSelectedRoom(roomFromLocation());
    window.addEventListener('hashchange', onLocationChange);
    window.addEventListener('popstate', onLocationChange);
    return () => {
      window.removeEventListener('hashchange', onLocationChange);
      window.removeEventListener('popstate', onLocationChange);
    };
  }, [])
  useEffect(() => {
    document.title = selectedRoom ? `${roomTitle(selectedRoom.name)} — ${SITE_TITLE}` : SITE_TITLE;
  }, [selectedRoom])
  useEffect(() => {
    if (imageKey === null) return;
    const svg = planRef.current;
    if (!svg) return;
    let cancelled = false;
    renderPng(svg).then((png) => {
      if (!cancelled) setRendered({ key: imageKey, png });
    });
    return () => {
      cancelled = true;
    };
  }, [imageKey])

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
            onChange={(_, room) => selectRoom(room)}
            autoHighlight
            renderInput={(params) => <TextField {...params} label="Aula" placeholder="Buscar aula…" />}
          />
        </Paper>
        <Stack spacing={3}>
          {selectedRoom === null ? Object.keys(floors).map((floor) => (
            <FloorCard key={floor} aspectRatio={aspect(planViewBox(floor))} title={capitalize(floor)}>
              <FloorPlan floor={floor} onSelect={(name) => selectRoom({ name, floor })} />
            </FloorCard>
          )) : (
            <Box>
              <Button onClick={() => selectRoom(null)} sx={{ mb: 1 }}>← Ver todos los pisos</Button>
              <FloorCard
                aspectRatio={aspect(planViewBox(selectedRoom.floor))}
                title={roomTitle(selectedRoom.name)}
                subtitle={capitalize(selectedRoom.floor)}
                action={roomImage && <Button variant="contained" href={roomImage} download={`${selectedRoom.name}.png`}>Descargar</Button>}
              >
                {roomImage
                  ? <Box
                      component="img"
                      src={roomImage}
                      alt={`Ubicación de ${selectedRoom.name} en ${selectedRoom.floor}`}
                      onClick={(event: React.MouseEvent<HTMLImageElement>) => {
                        const room = roomAt(selectedRoom.floor, event)
                        if (room) selectRoom({ name: room.name, floor: selectedRoom.floor })
                      }}
                      onMouseMove={(event: React.MouseEvent<HTMLImageElement>) => setHoveringRoom(roomAt(selectedRoom.floor, event) !== undefined)}
                      onMouseLeave={() => setHoveringRoom(false)}
                      sx={{ display: 'block', width: '100%', cursor: hoveringRoom ? 'pointer' : 'auto' }}
                    />
                  : <FloorPlan ref={planRef} floor={selectedRoom.floor} selected={selectedRoom.name} />}
              </FloorCard>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
