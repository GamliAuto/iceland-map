"use client";

import { useState, useCallback, useRef } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const ATTRACTIONS = [
  {
    id: "blue-lagoon",
    name: "Blue Lagoon",
    coordinates: [-22.4495, 63.8804] as [number, number],
    description: "Iceland's most famous geothermal spa, set in a lava field on the Reykjanes Peninsula. The milky-blue waters are naturally heated to 37–39°C year-round, rich in silica and minerals.",
    image: "https://source.unsplash.com/600x400/?blue+lagoon+iceland+geothermal",
    category: "Spa & Wellness",
    fact: "Water stays 37–39°C all year round",
  },
  {
    id: "strokkur",
    name: "Strokkur Geyser",
    coordinates: [-20.3002, 64.3128] as [number, number],
    description: "Part of the Golden Circle, Strokkur is Iceland's most active geyser — shooting boiling water up to 40 metres into the air every 6–10 minutes.",
    image: "https://source.unsplash.com/600x400/?geyser+eruption+hot+spring",
    category: "Natural Wonder",
    fact: "Erupts every 6–10 minutes",
  },
  {
    id: "gullfoss",
    name: "Gullfoss",
    coordinates: [-20.1214, 64.327] as [number, number],
    description: "The 'Golden Falls' plunge 32 metres in two dramatic tiers into a rugged canyon carved by the Hvítá River — one of Iceland's most beloved landmarks.",
    image: "https://source.unsplash.com/600x400/?gullfoss+waterfall+iceland",
    category: "Waterfall",
    fact: "Drops 32 m into a 2.5 km long canyon",
  },
  {
    id: "thingvellir",
    name: "Þingvellir",
    coordinates: [-21.129, 64.2553] as [number, number],
    description: "A UNESCO World Heritage Site where the North American and Eurasian tectonic plates visibly drift apart. Iceland's first parliament was established here in 930 AD.",
    image: "https://source.unsplash.com/600x400/?thingvellir+iceland+rift+valley",
    category: "UNESCO Heritage",
    fact: "The tectonic plates drift 2 cm apart each year",
  },
  {
    id: "seljalandsfoss",
    name: "Seljalandsfoss",
    coordinates: [-19.9886, 63.6156] as [number, number],
    description: "A 60-metre waterfall famous for the path that leads behind its curtain of water through a cave — one of Iceland's most photogenic spots.",
    image: "https://source.unsplash.com/600x400/?seljalandsfoss+waterfall+iceland",
    category: "Waterfall",
    fact: "You can walk behind the waterfall",
  },
  {
    id: "skogafoss",
    name: "Skógafoss",
    coordinates: [-19.5138, 63.532] as [number, number],
    description: "One of Iceland's largest waterfalls at 60 metres tall and 25 metres wide. Rainbows frequently form in the mist, and 370 steps lead to a viewpoint at the top.",
    image: "https://source.unsplash.com/600x400/?skogafoss+waterfall+rainbow+iceland",
    category: "Waterfall",
    fact: "60 m tall — 370 steps climb to the top",
  },
  {
    id: "reynisfjara",
    name: "Reynisfjara Beach",
    coordinates: [-19.0445, 63.401] as [number, number],
    description: "Iceland's most dramatic black sand beach, with towering basalt column stacks rising from the Atlantic. Featured in Game of Thrones and numerous films.",
    image: "https://source.unsplash.com/600x400/?black+sand+beach+basalt+iceland",
    category: "Beach",
    fact: "Basalt columns formed from lava 8 million years ago",
  },
  {
    id: "jokulsarlon",
    name: "Jökulsárlón",
    coordinates: [-16.1788, 64.0784] as [number, number],
    description: "A stunning glacial lagoon filled with icebergs calving from Breiðamerkurjökull glacier. Seals regularly rest on the floating ice beside the Ring Road.",
    image: "https://source.unsplash.com/600x400/?glacier+lagoon+icebergs+iceland",
    category: "Glacial Lagoon",
    fact: "Icebergs drift to Diamond Beach just 1 km away",
  },
  {
    id: "hallgrimskirkja",
    name: "Hallgrímskirkja",
    coordinates: [-21.9269, 64.1417] as [number, number],
    description: "Reykjavik's iconic 74-metre Lutheran church, its design inspired by Iceland's basalt lava columns. The tower offers panoramic views across the city.",
    image: "https://source.unsplash.com/600x400/?hallgrimskirkja+church+reykjavik",
    category: "Landmark",
    fact: "Tallest building in Iceland — took 41 years to build",
  },
  {
    id: "snaefellsjokull",
    name: "Snæfellsjökull",
    coordinates: [-23.7753, 64.8076] as [number, number],
    description: "A glacier-capped stratovolcano at the tip of Snæfellsnes Peninsula, immortalised as the entrance to the Earth's core in Jules Verne's famous novel.",
    image: "https://source.unsplash.com/600x400/?glacier+volcano+iceland+snow+mountain",
    category: "Glacier & Volcano",
    fact: "Jules Verne's 'Journey to the Centre of the Earth' starts here",
  },
  {
    id: "dettifoss",
    name: "Dettifoss",
    coordinates: [-16.3841, 65.8146] as [number, number],
    description: "Europe's most powerful waterfall by volume — 500 cubic metres of water per second thunder 44 metres into the rugged Jökulsárgljúfur canyon in north Iceland.",
    image: "https://source.unsplash.com/600x400/?powerful+waterfall+canyon+mist",
    category: "Waterfall",
    fact: "Most powerful waterfall in Europe",
  },
  {
    id: "myvatn",
    name: "Lake Mývatn",
    coordinates: [-17.0, 65.55] as [number, number],
    description: "A shallow volcanic lake surrounded by lava formations, pseudocraters, and bubbling mud pools. One of Europe's richest bird habitats with thousands of ducks in summer.",
    image: "https://source.unsplash.com/600x400/?volcanic+lake+geothermal+steam",
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
  const containerRef = useRef<HTMLDivElement>(null);

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

      <div
        ref={containerRef}
        className="relative flex-1"
        onMouseMove={handleMouseMove}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [-18.5, 65], scale: 3500 }}
          width={800}
          height={500}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
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

        {active && (
          <div
            className="absolute z-20 rounded-xl overflow-hidden shadow-2xl border border-slate-600/50 pointer-events-none"
            style={{ width: TOOLTIP_W, ...tooltipStyle }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.image}
              alt={active.name}
              className="w-full h-40 object-cover"
            />
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

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-500 text-xs flex items-center gap-2 pointer-events-none">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
          {ATTRACTIONS.length} attractions — hover to explore
        </div>
      </div>
    </main>
  );
}
