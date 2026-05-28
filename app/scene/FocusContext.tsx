"use client";

import { createContext } from "react";
import type { FocusContextValue } from "./types";

export const FocusContext = createContext<FocusContextValue>({
  focused: null,
  setFocused: () => {},
});
