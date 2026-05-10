import type { SportType } from "@/lib/store";

export const SPORTS: { value: SportType; label: string; emoji: string }[] = [
  { value: "football", label: "Football", emoji: "⚽" },
  { value: "cricket", label: "Cricket", emoji: "🏏" },
  { value: "basketball", label: "Basketball", emoji: "🏀" },
  { value: "volleyball", label: "Volleyball", emoji: "🏐" },
  { value: "badminton", label: "Badminton", emoji: "🏸" },
  { value: "kabaddi", label: "Kabaddi", emoji: "🤼" },
  { value: "other", label: "Other", emoji: "🏆" },
];

export function sportLabel(s: SportType) {
  return SPORTS.find((x) => x.value === s)?.label ?? s;
}
export function sportEmoji(s: SportType) {
  return SPORTS.find((x) => x.value === s)?.emoji ?? "🏆";
}
