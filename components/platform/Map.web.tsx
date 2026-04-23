import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";

// NOTE: Do not import "leaflet" at module scope — this file is imported during
// static rendering (SSR) where `window` is undefined. All leaflet access must
// happen inside effects / callbacks that run on the client.

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapPressEvent = any;

type Coordinate = { latitude: number; longitude: number };

type MarkerProps = {
  coordinate: Coordinate;
  title?: string;
  description?: string;
  pinColor?: string;
  onPress?: () => void;
};

type MapViewProps = {
  style?: any;
  initialRegion?: Region;
  region?: Region;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  onRegionChangeComplete?: (region: Region) => void;
  children?: React.ReactNode;
};

export type MapHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
};

function regionToZoom(region: Region): number {
  const delta = Math.max(region.latitudeDelta, region.longitudeDelta);
  if (delta >= 8) return 5;
  if (delta >= 4) return 6;
  if (delta >= 2) return 7;
  if (delta >= 1) return 8;
  if (delta >= 0.5) return 9;
  if (delta >= 0.2) return 10;
  if (delta >= 0.1) return 11;
  if (delta >= 0.05) return 12;
  if (delta >= 0.02) return 13;
  if (delta >= 0.01) return 14;
  return 15;
}

function makeColoredIcon(L: any, color: string) {
  const safe = color || "#EF4444";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 28 40'>
    <path d='M14 0C6.27 0 0 6.27 0 14c0 10 14 26 14 26s14-16 14-26C28 6.27 21.73 0 14 0z' fill='${safe}' stroke='#ffffff' stroke-width='2'/>
    <circle cx='14' cy='14' r='5' fill='#ffffff'/>
  </svg>`;
  const encoded = `data:image/svg+xml;base64,${window.btoa(svg)}`;
  return L.icon({
    iconUrl: encoded,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

const MapView = forwardRef<MapHandle, MapViewProps>(function MapView(
  props,
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userLayerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  const initial = props.region ?? props.initialRegion;

  useImperativeHandle(ref, () => ({
    animateToRegion(region: Region, duration = 400) {
      if (!mapRef.current) return;
      mapRef.current.flyTo(
        [region.latitude, region.longitude],
        regionToZoom(region),
        { duration: duration / 1000 },
      );
    },
  }));

  // Load Leaflet on the client only. We use synchronous require inside the
  // effect so Metro bundles it into the main chunk (no async split) while
  // still avoiding top-level evaluation during SSR where `window` is undefined.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mod = require("leaflet");
    require("leaflet/dist/leaflet.css");
    leafletRef.current = mod.default ?? mod;
    setLeafletReady(true);
  }, []);

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    const L = leafletRef.current;
    if (!leafletReady || !L || !containerRef.current || mapRef.current) return;
    const center: [number, number] = initial
      ? [initial.latitude, initial.longitude]
      : [3.139, 101.6869];
    const zoom = initial ? regionToZoom(initial) : 10;
    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on("moveend", () => {
      if (!props.onRegionChangeComplete) return;
      const c = map.getCenter();
      const b = map.getBounds();
      props.onRegionChangeComplete({
        latitude: c.lat,
        longitude: c.lng,
        latitudeDelta: Math.abs(b.getNorth() - b.getSouth()),
        longitudeDelta: Math.abs(b.getEast() - b.getWest()),
      });
    });

    // Ensure the map sizes correctly after mounting inside a flex container
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      userLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady]);

  // Sync controlled region prop
  useEffect(() => {
    if (!mapRef.current || !props.region) return;
    mapRef.current.setView(
      [props.region.latitude, props.region.longitude],
      regionToZoom(props.region),
    );
  }, [props.region]);

  // Render markers from children
  const childArray = React.Children.toArray(props.children).filter(
    Boolean,
  ) as React.ReactElement<MarkerProps>[];

  const markerSignature = useMemo(
    () =>
      childArray
        .map((c) => {
          const p = c.props || ({} as MarkerProps);
          const coord = p.coordinate;
          return `${coord?.latitude},${coord?.longitude},${p.title ?? ""},${p.pinColor ?? ""}`;
        })
        .join("|"),
    [childArray],
  );

  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    childArray.forEach((child) => {
      const p = child.props;
      if (!p?.coordinate) return;
      const marker = L.marker(
        [p.coordinate.latitude, p.coordinate.longitude],
        { icon: makeColoredIcon(L, p.pinColor || "#EF4444") },
      );
      const popup = [p.title, p.description].filter(Boolean).join("<br/>");
      if (popup) marker.bindPopup(popup);
      if (p.onPress) marker.on("click", () => p.onPress && p.onPress());
      marker.addTo(markersLayerRef.current!);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerSignature, leafletReady]);

  // Browser geolocation for showsUserLocation
  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !mapRef.current || !userLayerRef.current) return;
    userLayerRef.current.clearLayers();
    if (!props.showsUserLocation || typeof navigator === "undefined") return;
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!userLayerRef.current) return;
        userLayerRef.current.clearLayers();
        L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#2563EB",
          fillOpacity: 1,
        }).addTo(userLayerRef.current);
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [props.showsUserLocation, leafletReady]);

  return (
    <View style={[styles.container, props.style]}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </View>
  );
});

export default MapView;

export const Marker = (_props: MarkerProps): null => null;

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
});
