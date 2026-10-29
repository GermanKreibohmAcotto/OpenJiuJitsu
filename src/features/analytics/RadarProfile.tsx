import { useSettings } from '../../app/settings';
import type { Axis, AxisResult } from './metrics';

interface RadarProfileProps {
  results: AxisResult[];
  labels: Record<Axis, string>;
  label: string;
}

const CENTER = 200;
const RADIUS = 130;
const LABEL_GAP = 22;
const RINGS = [25, 50, 75, 100] as const;

/** Point at `fraction` (0..1) of the radius on axis `index`, the first axis pointing up. */
function polar(index: number, count: number, fraction: number, extra = 0) {
  const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
  const r = RADIUS * fraction + extra;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle), cos: Math.cos(angle) };
}

/** Splits "A / B" so long axis names wrap onto two lines. */
const lines = (text: string) => text.split(' / ');

/**
 * Round radar: banded concentric rings, one spoke per axis, a filled area with a
 * dot per vertex, and each axis labelled outside with its value. Axes keep the order
 * of `results`, clockwise from the top.
 */
export function RadarProfile({ results, labels, label }: RadarProfileProps) {
  const { accent } = useSettings();
  const count = results.length;
  const vertices = results.map((r, i) => polar(i, count, r.value / 100));

  return (
    <svg viewBox="-60 -34 520 404" role="img" aria-label={label} className="mx-auto h-auto w-full max-w-2xl">
      {[...RINGS].reverse().map((ring, i) => (
        <circle
          key={ring}
          cx={CENTER}
          cy={CENTER}
          r={(RADIUS * ring) / 100}
          fill={i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}
          stroke="#2f3540"
          strokeWidth={1}
        />
      ))}
      {results.map((r, i) => {
        const end = polar(i, count, 1);
        return <line key={r.axis} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="#3a414d" strokeWidth={1} />;
      })}
      {RINGS.map((ring) => (
        <text key={ring} x={CENTER + 4} y={CENTER - (RADIUS * ring) / 100 + 11} fontSize={9} fill="#6b7280">
          {ring}
        </text>
      ))}

      <polygon
        points={vertices.map((v) => `${v.x},${v.y}`).join(' ')}
        fill={accent}
        fillOpacity={0.28}
        stroke={accent}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {vertices.map((v, i) => (
        <circle key={results[i].axis} cx={v.x} cy={v.y} r={3.5} fill={accent} />
      ))}

      {results.map((r, i) => {
        const p = polar(i, count, 1, LABEL_GAP);
        const anchor = p.cos > 0.2 ? 'start' : p.cos < -0.2 ? 'end' : 'middle';
        // The label block grows away from the chart: upward on the top half, downward on the bottom half.
        const rows = [...lines(labels[r.axis]), r.hasData ? String(r.value) : '–'];
        const top = p.y < CENTER - 1 ? p.y - (rows.length - 1) * 14 : p.y + 4;
        return (
          <text key={r.axis} x={p.x} y={top} textAnchor={anchor} fontSize={13}>
            {rows.map((row, rowIndex) => (
              <tspan
                key={rowIndex}
                x={p.x}
                dy={rowIndex === 0 ? 0 : 14}
                fill={rowIndex === rows.length - 1 ? accent : '#d4d4d8'}
                fontWeight={rowIndex === rows.length - 1 ? 700 : 400}
              >
                {row}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}
