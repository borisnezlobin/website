import type { TrekData } from "./trek";
import { intComma } from "./chart";

// The page's FAQ, derived from the data so the prose, the structured data, and
// the numbers can never drift apart. The FAQ doubles as the FAQPage JSON-LD,
// which is what earns the answer box in Google.

export interface QA {
  q: string;
  a: string;
}

export function buildFaq(trek: TrekData): QA[] {
  const t = trek.totals;
  const total = intComma(t.totalStairs);
  const min = intComma(t.minStairs);
  const up = intComma(t.up);
  const down = intComma(t.down);
  const start = intComma(trek.profile[0].elev);
  const end = intComma(trek.profile[trek.profile.length - 1].elev);
  const peak = intComma(trek.maxElev);
  const climb = intComma(trek.ascentM);
  const drop = intComma(trek.descentM);
  const dist = trek.totalKm.toFixed(0);
  const dwpUp = intComma(trek.perDay[1].totals.upTotal); // day two climb to the pass
  const dayThreeDown = intComma(trek.perDay[2].totals.downTotal); // day three descent

  return [
    {
      q: "How many steps are on the Inca Trail?",
      a: `Counted one by one along the 4-day Classic Inca Trail (Km 82 to Machu Picchu), there are about ${total} stone steps. You climb at least ${min} of them on the most direct route, and the rest sit on optional detours and side-paths. Of the steps you take, roughly ${up} lead up and ${down} lead down.`,
    },
    {
      q: "How many stairs do you actually have to climb?",
      a: `At minimum ${min}—that skips every avoidable step, ignores the ambiguous ones, and takes the shorter side wherever the trail forks. Realistically, this is near impossible to actually achieve, as in many cases it’s easier to take the step rather than avoid it. The full count of stairs that physically exist, both sides of every fork included, is about ${total}. The average hiker will climb somewhere in between, depending on how many side-paths they take (and if they take detours to various ruins or campsites).`,
    },
    {
      q: "What is the elevation profile of the Inca Trail?",
      a: `Measured from a real GPS track sampled against 30-metre topographic data, the trail starts around ${start} m at Km 82, drops to cross the Urubamba, then climbs to its high point of ${peak} m at Dead Woman’s Pass at almost exactly halfway. From there it undulates down past Runkurakay, Sayacmarca and Phuyupatamarca to Machu Picchu at about ${end} m. You gain roughly ${climb} m and lose about ${drop} m overall.`,
    },
    {
      q: "What is the highest point of the Inca Trail?",
      a: `Dead Woman’s Pass (Warmiwañusca), at about ${peak} m by 30-metre topographic data is reached at the midpoint of the trek, at the top of the day-two climb.`,
    },
    {
      q: "How many stairs is the climb to Dead Woman’s Pass?",
      a: `From the day-one camp up to Dead Woman’s Pass (Warmiwañusca) you climb roughly ${dwpUp} stone stairs, almost all of it unbroken uphill. It is the single biggest staircase of the four days: a relentless flight of Inca steps up to the ${peak} m pass, after which the trail tips over and begins its long descent toward Machu Picchu.`,
    },
    {
      q: "How many stairs are on the day-three descent of the Inca Trail?",
      a: `Day three is the longest day and the hardest on the knees: an almost continuous stone descent of about ${dayThreeDown} stairs down through the cloud forest past Sayacmarca and Phuyupatamarca. It holds more downhill stairs than any other day of the trek—more than half of all the descending steps on the whole route.`,
    },
    {
      q: "How long is the Inca Trail and how many days does it take?",
      a: `By GPS the Classic Inca Trail measures about ${dist} km from Km 82 to Machu Picchu (it is often cited as 43 km, but a firsthand GPS recording and the Ministry of Culture’s own map both put it near ${dist} km). It is almost always walked over 4 days and 3 nights, though some marathon runners have completed it in under three and a half hours.`,
    },
    {
      q: "How were the steps counted?",
      a: `By hand! I walked the Inca Trail with a notebook and wrote down every time I climbed a staircase. Doubtful steps (about ${intComma(
        t.ambiguousStairs,
      )} of them) are held aside as “maybe”, and steps you can step around, or that sit on a fork in the trail, are tracked separately, so the count can give both a true total and a realistic minimum. And yes: this means that when there were forks in the path, I went down both sides.`,
    },
  ];
}
