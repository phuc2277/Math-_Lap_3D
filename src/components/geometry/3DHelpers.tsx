import React from 'react';
import { Html, Line } from '@react-three/drei';

interface Label3DProps {
  position: [number, number, number];
  text: string;
  subtext?: string;
  color?: string;
  badgeBg?: string;
  alwaysVisible?: boolean;
}

export const Label3D: React.FC<Label3DProps> = ({
  position,
  text,
  subtext,
  color = 'text-sky-300',
  badgeBg = 'bg-slate-900/90 border-slate-700/80',
}) => {
  return (
    <Html position={position} center distanceFactor={7} zIndexRange={[100, 0]}>
      <div
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shadow-lg backdrop-blur-md border ${badgeBg} ${color} flex flex-col items-center select-none pointer-events-none transition-all whitespace-nowrap leading-tight ring-1 ring-black/30`}
      >
        <span>{text}</span>
        {subtext && <span className="text-[8px] opacity-75 font-normal">{subtext}</span>}
      </div>
    </Html>
  );
};

interface DimensionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  label?: string;
  subtext?: string;
  offset?: [number, number, number];
  dashed?: boolean;
}

export const DimensionLine: React.FC<DimensionLineProps> = ({
  start,
  end,
  color = '#38bdf8',
  label,
  subtext,
  offset = [0, 0, 0],
}) => {
  const midPoint: [number, number, number] = [
    (start[0] + end[0]) / 2 + offset[0],
    (start[1] + end[1]) / 2 + offset[1],
    (start[2] + end[2]) / 2 + offset[2],
  ];

  return (
    <group>
      {/* Main line using Drei Line component */}
      <Line points={[start, end]} color={color} lineWidth={2} />

      {/* End point markers */}
      <mesh position={start}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Label */}
      {label && <Label3D position={midPoint} text={label} subtext={subtext} />}
    </group>
  );
};

export const CustomAxesHelper: React.FC<{ size?: number }> = ({ size = 6 }) => {
  return (
    <group>
      {/* X Axis Red */}
      <Line points={[[-size, 0, 0], [size, 0, 0]]} color="#ef4444" lineWidth={1.5} opacity={0.6} transparent />
      <Label3D position={[size + 0.3, 0, 0]} text="X" color="text-red-400" badgeBg="bg-red-950/80 border-red-800" />

      {/* Y Axis Green */}
      <Line points={[[0, -size, 0], [0, size, 0]]} color="#22c55e" lineWidth={1.5} opacity={0.6} transparent />
      <Label3D position={[0, size + 0.3, 0]} text="Y" color="text-green-400" badgeBg="bg-green-950/80 border-green-800" />

      {/* Z Axis Blue */}
      <Line points={[[0, 0, -size], [0, 0, size]]} color="#3b82f6" lineWidth={1.5} opacity={0.6} transparent />
      <Label3D position={[0, 0, size + 0.3]} text="Z" color="text-blue-400" badgeBg="bg-blue-950/80 border-blue-800" />
    </group>
  );
};
