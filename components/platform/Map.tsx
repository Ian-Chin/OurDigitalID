import React from "react";
import { Text, View } from "react-native";
import RNMapView, {
    Marker as RNMarker,
    Polyline as RNPolyline,
    type MapPressEvent,
    type Region,
} from "react-native-maps";

type Coordinate = { latitude: number; longitude: number };

type MarkerProps = {
  coordinate: Coordinate;
  title?: string;
  description?: string;
  pinColor?: string;
  label?: string;
  labelBackgroundColor?: string;
  labelTextColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
};

type PolylineProps = {
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
  geodesic?: boolean;
};

function Marker(props: MarkerProps) {
  const {
    label,
    labelBackgroundColor,
    labelTextColor,
    children,
    ...markerProps
  } = props;

  if (label) {
    return (
      <RNMarker {...markerProps}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor:
              labelBackgroundColor ?? markerProps.pinColor ?? "#1D4ED8",
            borderRadius: 999,
            borderWidth: 2,
            borderColor: "#FFF",
          }}
        >
          <Text
            style={{
              color: labelTextColor ?? "#FFF",
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            {label}
          </Text>
        </View>
      </RNMarker>
    );
  }

  return <RNMarker {...markerProps}>{children}</RNMarker>;
}

function Polyline(props: PolylineProps) {
  return <RNPolyline {...props} />;
}

export default RNMapView;
export { Marker, Polyline };
export type { MapPressEvent, Region };

