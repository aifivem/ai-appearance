import type { Parent } from "./nui";

/** Heritage parents (head blend faces of the base game) with their creator portraits. */
export const MOTHERS: Parent[] = [
  { id: 21, name: "Hannah", image: "char_creator_portraits/female_0" },
  { id: 22, name: "Audrey", image: "char_creator_portraits/female_1" },
  { id: 23, name: "Jasmine", image: "char_creator_portraits/female_2" },
  { id: 24, name: "Giselle", image: "char_creator_portraits/female_3" },
  { id: 25, name: "Amelia", image: "char_creator_portraits/female_4" },
  { id: 26, name: "Isabella", image: "char_creator_portraits/female_5" },
  { id: 27, name: "Zoe", image: "char_creator_portraits/female_6" },
  { id: 28, name: "Ava", image: "char_creator_portraits/female_7" },
  { id: 29, name: "Camila", image: "char_creator_portraits/female_8" },
  { id: 30, name: "Violet", image: "char_creator_portraits/female_9" },
  { id: 31, name: "Sophia", image: "char_creator_portraits/female_10" },
  { id: 32, name: "Evelyn", image: "char_creator_portraits/female_11" },
  { id: 33, name: "Nicole", image: "char_creator_portraits/female_12" },
  { id: 34, name: "Ashley", image: "char_creator_portraits/female_13" },
  { id: 35, name: "Grace", image: "char_creator_portraits/female_14" },
  { id: 36, name: "Brianna", image: "char_creator_portraits/female_15" },
  { id: 37, name: "Natalie", image: "char_creator_portraits/female_16" },
  { id: 38, name: "Olivia", image: "char_creator_portraits/female_17" },
  { id: 39, name: "Elizabeth", image: "char_creator_portraits/female_18" },
  { id: 40, name: "Charlotte", image: "char_creator_portraits/female_19" },
  { id: 41, name: "Emma", image: "char_creator_portraits/female_20" },
  { id: 45, name: "Misty", image: "char_creator_portraits/special_female_0" },
];

export const FATHERS: Parent[] = [
  { id: 0, name: "Benjamin", image: "char_creator_portraits/male_0" },
  { id: 1, name: "Daniel", image: "char_creator_portraits/male_1" },
  { id: 2, name: "Joshua", image: "char_creator_portraits/male_2" },
  { id: 3, name: "Noah", image: "char_creator_portraits/male_3" },
  { id: 4, name: "Andrew", image: "char_creator_portraits/male_4" },
  { id: 5, name: "Juan", image: "char_creator_portraits/male_5" },
  { id: 6, name: "Alex", image: "char_creator_portraits/male_6" },
  { id: 7, name: "Isaac", image: "char_creator_portraits/male_7" },
  { id: 8, name: "Evan", image: "char_creator_portraits/male_8" },
  { id: 9, name: "Ethan", image: "char_creator_portraits/male_9" },
  { id: 10, name: "Vincent", image: "char_creator_portraits/male_10" },
  { id: 11, name: "Angel", image: "char_creator_portraits/male_11" },
  { id: 12, name: "Diego", image: "char_creator_portraits/male_12" },
  { id: 13, name: "Adrian", image: "char_creator_portraits/male_13" },
  { id: 14, name: "Gabriel", image: "char_creator_portraits/male_14" },
  { id: 15, name: "Michael", image: "char_creator_portraits/male_15" },
  { id: 16, name: "Santiago", image: "char_creator_portraits/male_16" },
  { id: 17, name: "Kevin", image: "char_creator_portraits/male_17" },
  { id: 18, name: "Louis", image: "char_creator_portraits/male_18" },
  { id: 19, name: "Samuel", image: "char_creator_portraits/male_19" },
  { id: 20, name: "Anthony", image: "char_creator_portraits/male_20" },
  { id: 42, name: "Claude", image: "char_creator_portraits/special_male_0" },
  { id: 43, name: "Niko", image: "char_creator_portraits/special_male_1" },
  { id: 44, name: "John", image: "char_creator_portraits/special_male_2" },
];

/** Texture dictionary of the portraits; loaded on the client before the creator opens. */
export const PORTRAIT_DICT = "char_creator_portraits";
