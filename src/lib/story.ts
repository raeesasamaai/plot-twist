import type { Story } from "./types";
export const rooms = [
  {
    title: "The Reading Room",
    subtitle: "Every story has a beginning.",
    relic: "The brass key",
    icon: "key",
    description:
      "A forgotten desk. A locked drawer. Somewhere between the pages, your first clue is waiting.",
  },
  {
    title: "The Hall of Echoes",
    subtitle: "The past is listening.",
    relic: "The silver compass",
    icon: "compass",
    description:
      "Footsteps follow your own. The shelves rearrange themselves. Trust what you know, not what you hear.",
  },
  {
    title: "The Clockwork Vault",
    subtitle: "Write your own ending.",
    relic: "The final page",
    icon: "page",
    description:
      "Behind the last door, a machine is writing tomorrow. Find the missing page before it writes you out.",
  },
];
export const originalStory: Story = {
  intro:
    "At 11:59, a book arrives with your name on the cover. Inside is a single sentence: “The archive closes at midnight. So does your way home.” You turn the page. The door behind you disappears.",
  rooms: [
    "A desk lamp flickers to life. Five questions appear in the margin of an unfinished manuscript. Answer at least three correctly to open the drawer. The archivist has left you one small mercy: a clue that removes two wrong answers.",
    "The brass key turns in a lock you cannot see. Beyond it, a corridor of whispering books stretches into darkness. A silver compass spins on a pedestal. Five more questions will still its needle and point the way forward.",
    "The compass leads to a vault of turning gears. At its heart, a typewriter taps out the last chapter of your story. An empty space waits where the final page should be. Answer three of its five questions, and the ending is yours.",
  ],
  ending:
    "You slide the missing page into the typewriter. The gears stop. A door opens onto the morning, and the book closes gently in your hands. Beneath your name, a new sentence appears: “Some stories refuse to end the way they are written.”",
};
