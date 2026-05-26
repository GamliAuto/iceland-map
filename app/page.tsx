"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const COUNTRY_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Simplified outlines for major Iceland glaciers
const GLACIERS_GEO = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Vatnajökull" },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-18.3, 64.15], [-17.0, 63.92], [-15.8, 63.98], [-15.0, 64.3],
          [-15.1, 64.68], [-16.0, 64.93], [-17.5, 64.93], [-18.5, 64.65],
          [-18.7, 64.35], [-18.3, 64.15],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Langjökull" },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-20.5, 64.55], [-19.5, 64.5], [-19.4, 64.75], [-19.7, 64.95],
          [-20.4, 64.92], [-20.6, 64.72], [-20.5, 64.55],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Hofsjökull" },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-18.85, 64.8], [-18.1, 64.78], [-17.9, 65.05], [-18.3, 65.22],
          [-18.9, 65.05], [-18.85, 64.8],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Mýrdalsjökull" },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-19.75, 63.55], [-19.0, 63.52], [-18.88, 63.75], [-19.3, 63.87],
          [-19.82, 63.75], [-19.75, 63.55],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Eyjafjallajökull" },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-19.7, 63.59], [-19.38, 63.58], [-19.35, 63.7], [-19.7, 63.72], [-19.7, 63.59],
        ]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Snæfellsjökull" },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-23.9, 64.77], [-23.55, 64.77], [-23.52, 64.86], [-23.75, 64.89],
          [-23.93, 64.83], [-23.9, 64.77],
        ]],
      },
    },
  ],
};

// Simplified paths for major Iceland rivers
const RIVERS_GEO = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Þjórsá" },
      geometry: {
        type: "LineString" as const,
        coordinates: [[-18.8, 64.5], [-19.0, 64.35], [-19.4, 64.15], [-19.9, 64.0], [-20.2, 63.83]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Hvítá" },
      geometry: {
        type: "LineString" as const,
        coordinates: [[-20.2, 64.35], [-20.4, 64.2], [-20.65, 64.05], [-20.75, 63.9]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Jökulsá á Fjöllum" },
      geometry: {
        type: "LineString" as const,
        coordinates: [[-16.5, 64.7], [-16.45, 65.0], [-16.38, 65.4], [-16.35, 65.8], [-16.2, 66.05]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Skjálfandafljót" },
      geometry: {
        type: "LineString" as const,
        coordinates: [[-18.3, 65.0], [-18.0, 65.35], [-17.6, 65.7], [-17.35, 65.95]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Markarfljót" },
      geometry: {
        type: "LineString" as const,
        coordinates: [[-18.5, 63.92], [-18.9, 63.82], [-19.5, 63.7], [-20.0, 63.62]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Öxará" },
      geometry: {
        type: "LineString" as const,
        coordinates: [[-21.15, 64.42], [-21.1, 64.35], [-21.1, 64.25]],
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
    <main className="min-h-screen bg-[#0d1b2a] text-white flex flex-col select-none">
      <header className="text-center py-5 px-4 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Iceland Explorer</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Hover the markers to discover Iceland&apos;s top tourist attractions
        </p>
      </header>

      {/* Aspect-ratio wrapper keeps the map fully visible at all screen widths */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ aspectRatio: "8 / 5" }}
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

          {/* Glacier outlines — temporarily disabled */}
          {/* <Geographies geography={GLACIERS_GEO}>
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
          </Geographies> */}

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
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t border-blue-400" />
            Rivers
          </span>
        </div>
      </div>
    </main>
  );
}
