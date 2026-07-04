import { useContext } from "react";

import {
  StlViewerContext,
} from "../context/StlViewerContext";

export function useStlViewer() {

  const context =
    useContext(StlViewerContext);

  if (!context) {
    throw new Error(
      "useStlViewer must be used within StlViewerProvider"
    );
  }

  return context;
}