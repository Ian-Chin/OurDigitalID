import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  height?: number;
  width?: number;
  videoId?: string;
  play?: boolean;
  onChangeState?: (state: string) => void;
  [key: string]: any;
};

export default function YoutubePlayer({ height = 220, width, videoId, play }: Props) {
  if (!videoId) return null;
  const src = `https://www.youtube.com/embed/${videoId}${play ? "?autoplay=1" : ""}`;
  return (
    <View style={[styles.container, { height, width: width ?? "100%" }]}>
      {/* @ts-ignore - iframe is a DOM element rendered only on web */}
      <iframe
        src={src}
        width="100%"
        height="100%"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#000", overflow: "hidden" },
});
