"use client";

import { useMemo, useState } from "react";

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function Calculators() {
  const [length, setLength] = useState("10");
  const [height, setHeight] = useState("3");
  const [thicknessMm, setThicknessMm] = useState("200");
  const [openings, setOpenings] = useState("2");
  const [plasterMm, setPlasterMm] = useState("12");

  const result = useMemo(() => {
    const wallArea = Math.max(0, num(length) * num(height) - num(openings));
    const blockL = 0.6;
    const blockH = 0.2;
    const blockFace = blockL * blockH;
    const blocks = wallArea > 0 ? Math.ceil((wallArea / blockFace) * 1.05) : 0;
    const plasterM3 = wallArea * (num(plasterMm) / 1000);
    const renaplastBags = Math.ceil(plasterM3 / 0.025);
    const renabondKg = Math.ceil(wallArea * 5 * (num(thicknessMm) / 200));
    return { wallArea, blocks, renaplastBags, renabondKg };
  }, [length, height, thicknessMm, openings, plasterMm]);

  const field =
    "w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-500/20";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-xl font-semibold">Wall inputs</h2>
        <label className="text-sm">
          Wall length (m)
          <input className={field} value={length} onChange={(e) => setLength(e.target.value)} />
        </label>
        <label className="text-sm">
          Wall height (m)
          <input className={field} value={height} onChange={(e) => setHeight(e.target.value)} />
        </label>
        <label className="text-sm">
          AAC thickness (mm)
          <select className={field} value={thicknessMm} onChange={(e) => setThicknessMm(e.target.value)}>
            <option value="100">100</option>
            <option value="150">150</option>
            <option value="200">200</option>
            <option value="230">230</option>
          </select>
        </label>
        <label className="text-sm">
          Openings (doors/windows) area (sq.m)
          <input className={field} value={openings} onChange={(e) => setOpenings(e.target.value)} />
        </label>
        <label className="text-sm">
          Plaster thickness (mm)
          <input className={field} value={plasterMm} onChange={(e) => setPlasterMm(e.target.value)} />
        </label>
      </form>
      <div className="grid gap-4">
        <article className="rounded-3xl bg-emerald-700 p-6 text-white">
          <h3 className="text-lg font-semibold">Renacon Blocks</h3>
          <p className="mt-2 text-3xl font-semibold">{result.blocks}</p>
          <p className="text-sm text-emerald-100">
            600 × 200 mm face size, including 5% wastage · net wall {result.wallArea.toFixed(2)} sq.m
          </p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Renaplast</h3>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{result.renaplastBags}</p>
          <p className="text-sm text-slate-600">Estimated 40 kg bags for one-side plaster.</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Renabond</h3>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{result.renabondKg} kg</p>
          <p className="text-sm text-slate-600">Thin-joint adhesive estimate (~5 kg per sq.m of wall).</p>
        </article>
      </div>
    </div>
  );
}
