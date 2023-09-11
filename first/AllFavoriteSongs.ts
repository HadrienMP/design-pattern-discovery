import connect, { DatabaseConnection, sql } from "@databases/sqlite";
import { Clock, RealClock, seconds, toMs } from "./Clock";

export type UserId = string & { _tag: "userId" };
export type Song = {
  id: string & { _tag: "favoriteSongId" };
  name: string;
  artist: string;
  album: string;
};

export class AllFavoriteSongs {
  private static maxAge = seconds(60);
  private db: DatabaseConnection;
  private cache: Record<UserId, { cachedAt: Date; songs: Song[] }> = {};
  private clock: Clock;
  constructor(db: DatabaseConnection, clock: Clock = RealClock) {
    this.db = db;
    this.clock = clock;
  }
  async init() {
    await this.db.query(
      sql`CREATE TABLE IF NOT EXISTS favorite_songs (
        id VARCHAR NOT NULL PRIMARY KEY, 
        name VARCHAR NOT NULL, 
        artist VARCHAR NOT NULL, 
        album VARCHAR NOT NULL, 
        userId VARCHAR NOT NULL
      );`
    );
  }
  async reset() {
    await this.db.query(sql`DELETE FROM favorite_songs;`);
    this.cache = {};
  }
  async add(userId: UserId, song: Song) {
    return await this.db.query(
      sql`INSERT INTO favorite_songs VALUES (
            ${song.id}, 
            ${song.name}, 
            ${song.artist}, 
            ${song.album}, 
            ${userId})`
    );
  }
  async findBy(userId: UserId): Promise<Song[]> {
    if (
      this.clock.now().getTime() -
        (this.cache[userId]?.cachedAt?.getTime() ?? 0) <=
      toMs(AllFavoriteSongs.maxAge)
    )
      return this.cache[userId].songs;

    const result = await this.db.query(sql`
        SELECT id, name, artist, album FROM favorite_songs WHERE userId=${userId};
    `);
    this.cache[userId] = { cachedAt: this.clock.now(), songs: result };
    return result;
  }
}
