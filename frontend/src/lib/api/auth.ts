import { getCurrentUser } from "@/actions/auth";
import { callAction } from "./client";
import type { StudioSession } from "./types";

export const getCurrentStudioUser = () => callAction<StudioSession>(getCurrentUser());
