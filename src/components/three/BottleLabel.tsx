import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { useScentStore } from '../../store/useScentStore';
import { BODY } from './bottleDimensions';

const LABEL_W = 512;
const LABEL_H = 414;

function drawLabel(canvas: HTMLCanvasElement, name: string, bottleSize: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#f5efdf';
  ctx.fillRect(0, 0, LABEL_W, LABEL_H);

  ctx.strokeStyle = '#3a342a';
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, LABEL_W - 24, LABEL_H - 24);
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, LABEL_W - 44, LABEL_H - 44);

  const text = name.trim() || 'Unnamed Blend';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2c2820';

  let fontSize = 86;
  do {
    ctx.font = `italic 500 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
    fontSize -= 2;
  } while (ctx.measureText(text).width > LABEL_W - 90 && fontSize > 24);
  ctx.fillText(text, LABEL_W / 2, LABEL_H * 0.42);

  ctx.strokeStyle = '#b9975a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(LABEL_W / 2 - 46, LABEL_H * 0.585);
  ctx.lineTo(LABEL_W / 2 + 46, LABEL_H * 0.585);
  ctx.stroke();

  ctx.fillStyle = '#8a8272';
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = '5px';
  ctx.font = '500 22px Inter, system-ui, sans-serif';
  ctx.fillText('EAU DE PARFUM', LABEL_W / 2, LABEL_H * 0.685);
  ctx.font = '500 20px Inter, system-ui, sans-serif';
  ctx.fillText(`${bottleSize} ML`, LABEL_W / 2, LABEL_H * 0.775);
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = '0px';
}

export function BottleLabel() {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = LABEL_W;
    canvas.height = LABEL_H;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    return { canvas, texture };
  }, []);

  useEffect(() => {
    const draw = () => {
      const { customName, bottleSize } = useScentStore.getState();
      drawLabel(canvas, customName, bottleSize);
      texture.needsUpdate = true;
    };

    draw();
    // the serif webfont may land after first paint — redraw once fonts settle
    document.fonts?.ready.then(draw).catch(() => {});

    const unsubscribe = useScentStore.subscribe((state, prev) => {
      if (state.customName !== prev.customName || state.bottleSize !== prev.bottleSize) draw();
    });
    return unsubscribe;
  }, [canvas, texture]);

  return (
    <mesh position={[0, -0.42, BODY.depth / 2 + 0.012]}>
      <planeGeometry args={[1.06, 0.86]} />
      <meshStandardMaterial map={texture} roughness={0.55} metalness={0} />
    </mesh>
  );
}
