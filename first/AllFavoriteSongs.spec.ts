import { beforeAll, beforeEach, expect, test } from "vitest";
import { AllFavoriteSongs, Song, UserId } from "./AllFavoriteSongs";
import connect, { DatabaseConnection } from "@databases/sqlite";
import sqlite3 from "sqlite3";
import { FakeClock, seconds } from "./Clock";

let db: DatabaseConnection;
let allFavoriteSongs: AllFavoriteSongs;
let clock: FakeClock;
beforeAll(async () => {
  db = connect();
  sqlite3.verbose();
});

beforeEach(async () => {
  clock = new FakeClock();
  allFavoriteSongs = new AllFavoriteSongs(db, clock);
  await allFavoriteSongs.init();
  await allFavoriteSongs.reset();
});

const hadrienmp = "hadrienmp" as UserId;

const deliveranceByOpeth = {
  id: "1" as Song["id"],
  name: "Deliverance",
  artist: "Opeth",
  album: "Deliverance",
};
const hayloftByNickelCreek = {
  id: "2" as Song["id"],
  name: "Hayloft",
  artist: "Nickel Creek",
  album: "A Dotted Line",
};

test("returns the favorite songs of the user", async () => {
  await allFavoriteSongs.add(hadrienmp, deliveranceByOpeth);
  const favoriteSongs = await allFavoriteSongs.findBy(hadrienmp);
  expect(favoriteSongs).toEqual([deliveranceByOpeth]);
});

test("returns an empty array when there is no songs for the user", async () => {
  const favoriteSongs = await allFavoriteSongs.findBy(hadrienmp);
  expect(favoriteSongs).toEqual([]);
});

test("don't call the database again when the data is fresh", async () => {
  await allFavoriteSongs.add(hadrienmp, deliveranceByOpeth);
  await allFavoriteSongs.findBy(hadrienmp);
  clock.advance(seconds(60));
  await allFavoriteSongs.add(hadrienmp, hayloftByNickelCreek);

  const favoriteSongs = await allFavoriteSongs.findBy(hadrienmp);

  expect(favoriteSongs).toEqual([deliveranceByOpeth]);
});

test("data goes stale after 1 minute", async () => {
  await allFavoriteSongs.add(hadrienmp, deliveranceByOpeth);
  await allFavoriteSongs.findBy(hadrienmp);
  clock.advance(seconds(61));
  await allFavoriteSongs.add(hadrienmp, hayloftByNickelCreek);

  const favoriteSongs = await allFavoriteSongs.findBy(hadrienmp);

  expect(favoriteSongs).toEqual([deliveranceByOpeth, hayloftByNickelCreek]);
});
