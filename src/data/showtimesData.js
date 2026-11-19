import { getCinemasForCity, getShowtimesForMovieAndCity } from "./cityCinemasData";

export { getCinemasForCity, getShowtimesForMovieAndCity };

// Default generic map for backward compatibility with dynamic lookup fallback
const baseShowtimesData = {
  "spider-man": getCinemasForCity("Ahmedabad"),
  "naadi-dosh": getCinemasForCity("Ahmedabad"),
  "dhurandhar": getCinemasForCity("Ahmedabad"),
  "cheelo-divas": getCinemasForCity("Ahmedabad"),
  "animal": getCinemasForCity("Ahmedabad"),
  "crew": getCinemasForCity("Ahmedabad"),
  "ye-jawani-hai-diwani": getCinemasForCity("Ahmedabad"),
  "kalank": getCinemasForCity("Ahmedabad"),
  "bed-news": getCinemasForCity("Ahmedabad"),
  "teri-bato-me-aesa-ulja-jiya": getCinemasForCity("Ahmedabad"),
  "dhamaal-4": getCinemasForCity("Ahmedabad"),
  "toxic": getCinemasForCity("Ahmedabad"),
  "batwara": getCinemasForCity("Ahmedabad"),
  "hip-hip-hurray": getCinemasForCity("Ahmedabad"),
  "get-set-go": getCinemasForCity("Ahmedabad"),
  "awarapan-2": getCinemasForCity("Ahmedabad"),
};

const showtimesData = new Proxy(baseShowtimesData, {
  get(target, prop) {
    if (prop in target) return target[prop];
    if (typeof prop === "string" && prop !== "toJSON") {
      return getCinemasForCity("Ahmedabad");
    }
    return undefined;
  },
});

export default showtimesData;
