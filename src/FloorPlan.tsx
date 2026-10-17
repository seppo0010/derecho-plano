import React from 'react';
import { floors, Room } from './Data';
import { plans } from './Plans';

export const COLORS = {
  background: '#fbfaf7',
  room: '#e3ebf5',
  toilet: '#dcefe6',
  toiletIcon: '#3f7a5f',
  roomHover: '#c9d8ea',
  label: '#34506e',
  wall: '#2b2f36',
  window: '#8fb3d9',
  stairs: '#6b7280',
  elevator: '#4b6584',
  selected: '#e4572e',
}

const FONT = "Helvetica, Arial, sans-serif"
const ICON_SIZE = 56

type ViewBox = [number, number, number, number]

const ZOOM_ASPECT = 4 / 3
const ZOOM_MIN_WIDTH = 800

// A 4:3 window around the room with some surroundings for context, or null
// when the room is so big that zooming wouldn't show much less than the floor.
const zoomBox = (floor: string, room: Room): ViewBox | null => {
  const [px, py, pw, ph] = plans[floor].viewBox
  const width = Math.min(Math.max(ZOOM_MIN_WIDTH, room.width * 3, room.height * 3 * ZOOM_ASPECT), pw, ph * ZOOM_ASPECT)
  if (width > pw * 0.75) return null
  const height = width / ZOOM_ASPECT
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
  const x = clamp(room.left + room.width / 2 - width / 2, px, px + pw - width)
  const y = clamp(room.top + room.height / 2 - height / 2, py, py + ph - height)
  return [Math.round(x), Math.round(y), Math.round(width), Math.round(height)]
}

export const planViewBox = (floor: string, zoomTo?: string): ViewBox => {
  const room = zoomTo === undefined ? undefined : floors[floor].find(({ name }) => name === zoomTo)
  return (room && zoomBox(floor, room)) ?? plans[floor].viewBox
}

export const aspect = ([, , width, height]: ViewBox) => `${width} / ${height}`

// Every way of splitting the words into `count` consecutive lines.
const splits = (words: string[], count: number): string[][] => {
  if (count === 1) return [[words.join(' ')]]
  const result: string[][] = []
  for (let i = 1; i <= words.length - count + 1; i++) {
    for (const rest of splits(words.slice(i), count - 1)) {
      result.push([words.slice(0, i).join(' '), ...rest])
    }
  }
  return result
}

const LINE_HEIGHT = 1.15

// Largest font size that fits the name into a box, wrapping on spaces.
const fitLabel = (name: string, along: number, across: number) => {
  const words = name.split(' ')
  let best = { lines: [name], fontSize: 0 }
  for (let count = 1; count <= Math.min(words.length, 3); count++) {
    for (const lines of splits(words, count)) {
      const longest = Math.max(...lines.map((line) => line.length), 2)
      const fontSize = Math.min(30, (along * 1.6) / longest, (across * 0.8) / (count * LINE_HEIGHT))
      if (fontSize > best.fontSize) best = { lines, fontSize }
    }
  }
  return best
}

function RoomLabel({ room, color }: { room: Room, color: string }) {
  const { name, left, top, width, height } = room
  // tall, narrow rooms with long names read better rotated
  const vertical = height > width * 1.3 && name.length > 3
  const { lines, fontSize } = fitLabel(name, vertical ? height : width, vertical ? width : height)
  const x = left + width / 2
  const y = top + height / 2
  return (
    <text
      y={y - ((lines.length - 1) * fontSize * LINE_HEIGHT) / 2}
      fill={color}
      fontFamily={FONT}
      fontSize={fontSize}
      fontWeight={600}
      textAnchor="middle"
      dominantBaseline="central"
      transform={vertical ? `rotate(-90 ${x} ${y})` : undefined}
      pointerEvents="none"
    >
      {lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : fontSize * LINE_HEIGHT}>{line}</tspan>)}
    </text>
  )
}

// Pictogram of a person, in a box 1 wide and 2 tall.
const PERSON = {
  mujeres: 'M0.3 0.6h0.4l0.3 0.9h-0.3v0.5h-0.13v-0.5h-0.14v0.5h-0.13v-0.5h-0.3z',
  hombres: 'M0.12 0.6h0.76v0.75h-0.18v0.65h-0.15v-0.65h-0.1v0.65h-0.15v-0.65h-0.18z',
}

function ToiletIcon({ room, color }: { room: Room, color: string }) {
  const { left, top, width, height } = room
  const genders = room.toilet?.gender ? [room.toilet.gender] : ['mujeres', 'hombres'] as const
  // each figure is 1 unit wide with 0.4 units of space between them
  const units = genders.length * 1.4 - 0.4
  const scale = Math.min((width * 0.8) / units, (height * 0.8) / 2, 24)
  const x = left + (width - units * scale) / 2
  const y = top + (height - 2 * scale) / 2
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={color} pointerEvents="none">
      {genders.map((gender, i) => (
        <g key={gender} transform={`translate(${i * 1.4} 0)`}>
          <circle cx={0.5} cy={0.3} r={0.25} />
          <path d={PERSON[gender]} />
        </g>
      ))}
    </g>
  )
}

function Stairs({ x, y }: { x: number, y: number }) {
  const s = ICON_SIZE
  const step = s / 4
  return (
    <g transform={`translate(${x - s / 2} ${y - s / 2})`}>
      <title>Escalera</title>
      <rect width={s} height={s} rx={10} fill={COLORS.stairs} />
      <path
        d={`M${step * 0.6} ${s - step * 0.6}h${step}v${-step}h${step}v${-step}h${step}v${-step}h${step * 0.8}`}
        fill="none"
        stroke="white"
        strokeWidth={5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  )
}

function Elevator({ x, y }: { x: number, y: number }) {
  const s = ICON_SIZE
  const c = s / 2
  return (
    <g transform={`translate(${x - c} ${y - c})`}>
      <title>Ascensor</title>
      <rect width={s} height={s} rx={10} fill={COLORS.elevator} />
      <path d={`M${c} ${s * 0.14}l${s * 0.17} ${s * 0.2}h${-s * 0.34}zM${c} ${s * 0.86}l${s * 0.17} ${-s * 0.2}h${-s * 0.34}z`} fill="white" />
      <rect x={s * 0.24} y={s * 0.42} width={s * 0.52} height={s * 0.16} rx={3} fill="white" opacity={0.6} />
    </g>
  )
}

// Thumbnail of the whole floor, with the zoomed-in area outlined, placed in the
// corner of the zoomed view that is farthest from the selected room.
function Overview({ floor, selected, zoom }: { floor: string, selected: string, zoom: ViewBox }) {
  const plan = plans[floor]
  const [px, py, pw, ph] = plan.viewBox
  const [zx, zy, zw, zh] = zoom
  const room = floors[floor].find(({ name }) => name === selected)!
  const width = zw * 0.3
  const height = (width * ph) / pw
  const margin = zw * 0.02
  const x = room.left + room.width / 2 < zx + zw / 2 ? zx + zw - width - margin : zx + margin
  const y = room.top + room.height / 2 < zy + zh / 2 ? zy + zh - height - margin : zy + margin
  // stroke widths in the thumbnail's own (full plan) units
  const unit = pw / width
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={width} height={height} rx={8} fill="white" stroke={COLORS.wall} strokeWidth={2} opacity={0.95} />
      <svg x={x} y={y} width={width} height={height} viewBox={plan.viewBox.join(' ')}>
        {floors[floor].map((r) => (
          <rect key={r.name} x={r.left} y={r.top} width={r.width} height={r.height} fill={r.name === selected ? COLORS.selected : COLORS.room} />
        ))}
        <path d={plan.walls} fill={COLORS.wall} />
        <rect x={zx} y={zy} width={zw} height={zh} fill="none" stroke={COLORS.selected} strokeWidth={3 * unit} />
      </svg>
      <rect x={x} y={y} width={width} height={height} rx={8} fill="none" stroke={COLORS.wall} strokeWidth={2} />
    </g>
  )
}

interface FloorPlanProps {
  floor: string;
  selected?: string;
  // zoom in on the selected room, with an overview of the floor in a corner
  zoom?: boolean;
  onSelect?: (room: string) => void;
  ref?: React.Ref<SVGSVGElement>;
}

export default function FloorPlan({ floor, selected, zoom, onSelect, ref }: FloorPlanProps) {
  const plan = plans[floor]
  const viewBox = planViewBox(floor, zoom ? selected : undefined)
  const zoomed = viewBox !== plan.viewBox
  const [x, y, width, height] = viewBox
  // keep the full plan's resolution when zoomed, so the rasterized image stays sharp
  const scale = plan.viewBox[2] / width
  const rooms = floors[floor]
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox.join(' ')}
      width={width * scale}
      height={height * scale}
      role="img"
      aria-label={`Plano de ${floor}`}
    >
      <rect x={x} y={y} width={width} height={height} fill={COLORS.background} />
      {rooms.map((room) => {
        const isSelected = room.name === selected
        return (
          <g
            key={room.name}
            className={onSelect ? 'room' : undefined}
            onClick={onSelect && (() => onSelect(room.name))}
            style={onSelect ? { cursor: 'pointer' } : undefined}
          >
            <title>{room.name}</title>
            {isSelected && (
              <rect
                x={room.left - 18}
                y={room.top - 18}
                width={room.width + 36}
                height={room.height + 36}
                rx={14}
                fill={COLORS.selected}
                opacity={0.25}
              />
            )}
            <rect
              x={room.left}
              y={room.top}
              width={room.width}
              height={room.height}
              rx={4}
              fill={isSelected ? COLORS.selected : room.toilet ? COLORS.toilet : COLORS.room}
            />
          </g>
        )
      })}
      <path d={plan.windows} fill={COLORS.window} />
      <path d={plan.walls} fill={COLORS.wall} />
      {plan.stairs.map(([sx, sy]) => <Stairs key={`${sx},${sy}`} x={sx} y={sy} />)}
      {plan.elevators.map(([ex, ey]) => <Elevator key={`${ex},${ey}`} x={ex} y={ey} />)}
      {rooms.map((room) => room.toilet
        ? <ToiletIcon key={room.name} room={room} color={room.name === selected ? 'white' : COLORS.toiletIcon} />
        : <RoomLabel key={room.name} room={room} color={room.name === selected ? 'white' : COLORS.label} />
      )}
      {zoomed && selected && <Overview floor={floor} selected={selected} zoom={viewBox} />}
    </svg>
  )
}
