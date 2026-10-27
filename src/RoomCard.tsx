import { roomTitle } from './Data';
import FloorPlan, { COLORS, planViewBox } from './FloorPlan';

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630

const FONT = "Helvetica, Arial, sans-serif"
const HEADER_HEIGHT = 170
const PADDING = 20

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// The Open Graph image for a room's page: its name over the plan of its floor, with the room filled in.
export default function RoomCard({ floor, name }: { floor: string, name: string }) {
  const [, , width, height] = planViewBox(floor)
  const areaWidth = CARD_WIDTH - 2 * PADDING
  const areaHeight = CARD_HEIGHT - HEADER_HEIGHT - 2 * PADDING
  const scale = Math.min(areaWidth / width, areaHeight / height)
  const planWidth = width * scale
  const planHeight = height * scale
  const x = (CARD_WIDTH - planWidth) / 2
  const y = HEADER_HEIGHT + PADDING + (areaHeight - planHeight) / 2
  const title = roomTitle(name)
  // bold Helvetica averages under half an em per character; shrink long names to fit the width
  const titleSize = Math.min(64, (CARD_WIDTH - 2 * 56) / (title.length * 0.5))
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`} width={CARD_WIDTH} height={CARD_HEIGHT}>
      <rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="#eef1f6" />
      <rect width={CARD_WIDTH} height={HEADER_HEIGHT} fill="#1e3a5f" />
      <text x={56} y={92} fill="white" fontFamily={FONT} fontSize={titleSize} fontWeight={700}>{title}</text>
      <text x={56} y={140} fill="white" fillOpacity={0.85} fontFamily={FONT} fontSize={30}>{capitalize(floor)} · Plano de Derecho UBA</text>
      <rect x={x - 4} y={y - 4} width={planWidth + 8} height={planHeight + 8} rx={10} fill={COLORS.background} />
      {/* FloorPlan's svg maps its viewBox onto its pixel size at the origin, so translate and scale it into place */}
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <FloorPlan floor={floor} selected={name} />
      </g>
    </svg>
  )
}
