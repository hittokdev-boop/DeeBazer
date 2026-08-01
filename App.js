import React from "react";
import { Text, View } from "react-native";
import Navigation from "./Src/Navigation";
import { ThemeProvider } from "./Src/Context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}