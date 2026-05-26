"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const COUNTRY_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Simplified outlines for major Iceland glaciers
// Coordinates wound CCW — required by D3's spherical polygon rule.
// Positions calibrated against real glacier extents.
const GLACIERS_GEO = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Vatnajökull" },
      geometry: {
        type: "Polygon" as const,
        // Europe's largest glacier — SE-central Iceland, ~8100 km²
        coordinates: [[
          [-18.0, 64.0],
          [-18.15, 64.3],
          [-18.1, 64.6],
          [-17.7, 64.85],
          [-16.8, 64.93],
          [-16.0, 64.95],
          [-15.2, 64.88],
          [-14.7, 64.6],
          [-14.55, 64.3],
          [-14.8, 64.0],
          [-15.5, 63.9],
          [-16.0, 63.87],
          [-17.0, 63.88],
          [-17.7, 63.97],
          [-18.0, 64.0],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Langjökull" },
      geometry: {
        type: "Polygon" as const,
        // Second largest — central Iceland, elongated N-S
        coordinates: [[
          [-20.3, 64.55],
          [-20.38, 64.75],
          [-20.25, 64.96],
          [-20.0, 64.98],
          [-19.72, 64.9],
          [-19.65, 64.68],
          [-19.7, 64.55],
          [-19.95, 64.5],
          [-20.3, 64.55],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Hofsjökull" },
      geometry: {
        type: "Polygon" as const,
        // Roughly circular — NE of Langjökull
        coordinates: [[
          [-18.75, 64.84],
          [-18.82, 65.0],
          [-18.55, 65.17],
          [-18.22, 65.15],
          [-18.02, 65.0],
          [-18.05, 64.84],
          [-18.25, 64.76],
          [-18.55, 64.75],
          [-18.75, 64.84],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Mýrdalsjökull" },
      geometry: {
        type: "Polygon" as const,
        // S Iceland, above Vík
        coordinates: [[
          [-19.62, 63.57],
          [-19.65, 63.72],
          [-19.45, 63.84],
          [-19.15, 63.85],
          [-18.95, 63.76],
          [-18.85, 63.61],
          [-19.05, 63.52],
          [-19.4, 63.52],
          [-19.62, 63.57],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Eyjafjallajökull" },
      geometry: {
        type: "Polygon" as const,
        // Small glacier just W of Mýrdalsjökull
        coordinates: [[
          [-19.8, 63.59],
          [-19.82, 63.68],
          [-19.65, 63.73],
          [-19.52, 63.68],
          [-19.5, 63.59],
          [-19.65, 63.56],
          [-19.8, 63.59],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Snæfellsjökull" },
      geometry: {
        type: "Polygon" as const,
        // Tip of Snæfellsnes peninsula
        coordinates: [[
          [-23.93, 64.77],
          [-23.95, 64.86],
          [-23.78, 64.9],
          [-23.6, 64.88],
          [-23.55, 64.79],
          [-23.65, 64.74],
          [-23.82, 64.74],
          [-23.93, 64.77],
        ]],
      },
    },
  ],
};


// Wikipedia article titles for fetching real attraction photos
const WIKI_TITLES: Record<string, string> = {
  "blue-lagoon": "Blue_Lagoon_(geothermal_spa)",
  "strokkur": "Strokkur",
  "gullfoss": "Gullfoss",
  "thingvellir": "Þingvellir",
  "seljalandsfoss": "Seljalandsfoss",
  "skogafoss": "Skógafoss",
  "reynisfjara": "Reynisfjara",
  "jokulsarlon": "Jökulsárlón",
  "hallgrimskirkja": "Hallgrímskirkja",
  "snaefellsjokull": "Snæfellsjökull",
  "dettifoss": "Dettifoss",
  "myvatn": "Mývatn",
};

const ATTRACTIONS = [
  {
    id: "blue-lagoon",
    name: "Blue Lagoon",
    coordinates: [-22.4495, 63.8804] as [number, number],
    description: "Iceland's most famous geothermal spa, set in a lava field on the Reykjanes Peninsula. The milky-blue waters are naturally heated to 37–39°C year-round, rich in silica and minerals.",
    category: "Spa & Wellness",
    fact: "Water stays 37–39°C all year round",
  },
  {
    id: "strokkur",
    name: "Strokkur Geyser",
    coordinates: [-20.3002, 64.3128] as [number, number],
    description: "Part of the Golden Circle, Strokkur is Iceland's most active geyser — shooting boiling water up to 40 metres into the air every 6–10 minutes.",
    category: "Natural Wonder",
    fact: "Erupts every 6–10 minutes",
  },
  {
    id: "gullfoss",
    name: "Gullfoss",
    coordinates: [-20.1214, 64.327] as [number, number],
    description: "The 'Golden Falls' plunge 32 metres in two dramatic tiers into a rugged canyon carved by the Hvítá River — one of Iceland's most beloved landmarks.",
    category: "Waterfall",
    fact: "Drops 32 m into a 2.5 km long canyon",
  },
  {
    id: "thingvellir",
    name: "Þingvellir",
    coordinates: [-21.129, 64.2553] as [number, number],
    description: "A UNESCO World Heritage Site where the North American and Eurasian tectonic plates visibly drift apart. Iceland's first parliament was established here in 930 AD.",
    category: "UNESCO Heritage",
    fact: "The tectonic plates drift 2 cm apart each year",
  },
  {
    id: "seljalandsfoss",
    name: "Seljalandsfoss",
    coordinates: [-19.9886, 63.6156] as [number, number],
    description: "A 60-metre waterfall famous for the path that leads behind its curtain of water through a cave — one of Iceland's most photogenic spots.",
    category: "Waterfall",
    fact: "You can walk behind the waterfall",
  },
  {
    id: "skogafoss",
    name: "Skógafoss",
    coordinates: [-19.5138, 63.532] as [number, number],
    description: "One of Iceland's largest waterfalls at 60 metres tall and 25 metres wide. Rainbows frequently form in the mist, and 370 steps lead to a viewpoint at the top.",
    category: "Waterfall",
    fact: "60 m tall — 370 steps climb to the top",
  },
  {
    id: "reynisfjara",
    name: "Reynisfjara Beach",
    coordinates: [-19.0445, 63.401] as [number, number],
    description: "Iceland's most dramatic black sand beach, with towering basalt column stacks rising from the Atlantic. Featured in Game of Thrones and numerous films.",
    category: "Beach",
    fact: "Basalt columns formed from lava 8 million years ago",
  },
  {
    id: "jokulsarlon",
    name: "Jökulsárlón",
    coordinates: [-16.1788, 64.0784] as [number, number],
    description: "A stunning glacial lagoon filled with icebergs calving from Breiðamerkurjökull glacier. Seals regularly rest on the floating ice beside the Ring Road.",
    category: "Glacial Lagoon",
    fact: "Icebergs drift to Diamond Beach just 1 km away",
  },
  {
    id: "hallgrimskirkja",
    name: "Hallgrímskirkja",
    coordinates: [-21.9269, 64.1417] as [number, number],
    description: "Reykjavik's iconic 74-metre Lutheran church, its design inspired by Iceland's basalt lava columns. The tower offers panoramic views across the city.",
    category: "Landmark",
    fact: "Tallest building in Iceland — took 41 years to build",
  },
  {
    id: "snaefellsjokull",
    name: "Snæfellsjökull",
    coordinates: [-23.7753, 64.8076] as [number, number],
    description: "A glacier-capped stratovolcano at the tip of Snæfellsnes Peninsula, immortalised as the entrance to the Earth's core in Jules Verne's famous novel.",
    category: "Glacier & Volcano",
    fact: "Jules Verne's 'Journey to the Centre of the Earth' starts here",
  },
  {
    id: "dettifoss",
    name: "Dettifoss",
    coordinates: [-16.3841, 65.8146] as [number, number],
    description: "Europe's most powerful waterfall by volume — 500 cubic metres of water per second thunder 44 metres into the rugged Jökulsárgljúfur canyon in north Iceland.",
    category: "Waterfall",
    fact: "Most powerful waterfall in Europe",
  },
  {
    id: "myvatn",
    name: "Lake Mývatn",
    coordinates: [-17.0, 65.55] as [number, number],
    description: "A shallow volcanic lake surrounded by lava formations, pseudocraters, and bubbling mud pools. One of Europe's richest bird habitats with thousands of ducks in summer.",
    category: "Lake & Geothermal",
    fact: "Home to more duck species than anywhere else in Europe",
  },
];

type Attraction = (typeof ATTRACTIONS)[0];

const TOOLTIP_W = 300;
const TOOLTIP_H = 360;

export default function Home() {
  const [active, setActive] = useState<Attraction | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [images, setImages] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch real attraction photos from Wikipedia on mount
  useEffect(() => {
    Promise.all(
      Object.entries(WIKI_TITLES).map(async ([id, title]) => {
        try {
          const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
          );
          const data = await res.json();
          return [id, data.thumbnail?.source ?? ""] as const;
        } catch {
          return [id, ""] as const;
        }
      })
    ).then((entries) => setImages(Object.fromEntries(entries)));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const tooltipStyle = (() => {
    if (!containerRef.current) return { left: 0, top: 0 };
    const w = containerRef.current.offsetWidth;
    const h = containerRef.current.offsetHeight;
    const gap = 18;
    let left = mousePos.x + gap;
    let top = mousePos.y - TOOLTIP_H / 2;
    if (left + TOOLTIP_W > w - gap) left = mousePos.x - TOOLTIP_W - gap;
    if (top < gap) top = gap;
    if (top + TOOLTIP_H > h - gap) top = h - TOOLTIP_H - gap;
    return { left, top };
  })();

  return (
    <main className="h-screen bg-[#0d1b2a] text-white flex flex-col overflow-hidden select-none">
      <header className="text-center py-5 px-4 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Iceland Explorer</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Hover the markers to discover Iceland&apos;s top tourist attractions
        </p>
      </header>

      {/* flex-1 min-h-0 constrains to remaining viewport height; SVG preserveAspectRatio fits within it */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0"
        onMouseMove={handleMouseMove}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [-18.5, 65], scale: 3500 }}
          width={800}
          height={500}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          {/* Iceland land outline */}
          <Geographies geography={COUNTRY_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies
                .filter((geo: any) => String(geo.id) === "352")
                .map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1a3d30"
                    stroke="#34d399"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
            }
          </Geographies>

          {/* Glacier outlines */}
          <Geographies geography={GLACIERS_GEO}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#dbeafe"
                  stroke="#93c5fd"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: "none", opacity: 0.82 },
                    hover: { outline: "none", opacity: 0.82 },
                    pressed: { outline: "none", opacity: 0.82 },
                  }}
                />
              ))
            }
          </Geographies>

          {/* River paths — temporarily disabled */}
          {/* <Geographies geography={RIVERS_GEO}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth={0.9}
                  style={{
                    default: { outline: "none", opacity: 0.7 },
                    hover: { outline: "none", opacity: 0.7 },
                    pressed: { outline: "none", opacity: 0.7 },
                  }}
                />
              ))
            }
          </Geographies> */}

          {/* Attraction markers */}
          {ATTRACTIONS.map((attraction) => (
            <Marker key={attraction.id} coordinates={attraction.coordinates}>
              <circle
                r={active?.id === attraction.id ? 9 : 6}
                fill={active?.id === attraction.id ? "#fb923c" : "#f97316"}
                stroke="white"
                strokeWidth={1.5}
                style={{ cursor: "pointer", transition: "r 0.15s ease" }}
                onMouseEnter={() => setActive(attraction)}
                onMouseLeave={() => setActive(null)}
              />
            </Marker>
          ))}
        </ComposableMap>

        {/* Hover tooltip */}
        {active && (
          <div
            className="absolute z-20 rounded-xl overflow-hidden shadow-2xl border border-slate-600/50 pointer-events-none"
            style={{ width: TOOLTIP_W, ...tooltipStyle }}
          >
            {images[active.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[active.id]}
                alt={active.name}
                className="w-full h-40 object-cover bg-slate-700"
              />
            ) : (
              <div className="w-full h-40 bg-slate-700 flex items-center justify-center">
                <span className="text-slate-500 text-xs">Loading image…</span>
              </div>
            )}
            <div className="bg-slate-800/95 backdrop-blur-sm p-4">
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                {active.category}
              </span>
              <h3 className="font-bold text-base leading-snug">{active.name}</h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                {active.description}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-amber-400 flex gap-1.5 items-start">
                <span className="flex-shrink-0">★</span>
                <span>{active.fact}</span>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-slate-500 pointer-events-none">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
            {ATTRACTIONS.length} attractions
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-2 rounded-sm bg-blue-200/80" />
            Glaciers
          </span>
        </div>
      </div>
    </main>
  );
}
