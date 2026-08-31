import { studioFetch } from "./client";
import type { StudioSession } from "./types";

export const getCurrentStudioUser = () => studioFetch<StudioSession>("/auth/me");
