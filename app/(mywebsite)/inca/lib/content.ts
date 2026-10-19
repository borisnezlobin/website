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
      a: `There are ${total} stone steps on the 4-day Classic Inca Trail from Km 82 to Machu Picchu. That isn’t an estimate or a round number someone made up! I counted them by hand, one step at a time, over four days on the trail. You climb at least ${min} of them on the most direct route. The rest sit on the other side of forks in the trail or are steps you can walk around. Of the steps you actually take, ${up} lead up and ${down} lead down.`,
    },
    {
      q: "How many stairs do you actually have to climb?",
      a: `You have to climb at least ${min}. That number skips every step you can walk around, leaves out the ambiguous ones and takes the shorter side wherever the trail forks. Nobody manages it in practice, because walking around most of those steps is more work than climbing them. Counting both sides of every fork, ${total} stairs physically exist. Most hikers climb a number in between that depends on which side paths they take and which ruins or campsites they detour to.`,
    },
    {
      q: "Why is this count more accurate than other figures?",
      a: `No guidebook has ever counted the steps. Tour operators and travel blogs quote round numbers that never agree with each other, because each one is a guess. I walked the whole trail with a notebook and tallied every stone step by hand, on both sides of every fork. I also marked which steps were optional and which were ambiguous. I trust my count to within about 2%, which is infinitely more precise than a number nobody counted.`,
    },
    {
      q: "What is the elevation profile of the Inca Trail?",
      a: `Measured from a real GPS track sampled against 30-metre topographic data, the trail starts around ${start} m at Km 82, drops to cross the Urubamba, then climbs to its high point of ${peak} m at Dead Woman’s Pass at almost exactly halfway. From there it undulates down past Runkurakay, Sayacmarca and Phuyupatamarca to Machu Picchu at about ${end} m. You gain roughly ${climb} m and lose about ${drop} m overall.`,
    },
    {
      q: "What is the highest point of the Inca Trail?",
      a: `The highest point is Dead Woman’s Pass (Warmiwañusca), at about ${peak} m according to 30-metre topographic data. You reach it halfway through the trek, at the top of the day-two climb.`,
    },
    {
      q: "How many stairs is the climb to Dead Woman’s Pass?",
      a: `From the day-one camp up to Dead Woman’s Pass (Warmiwañusca), you climb ${dwpUp} stone stairs with almost no flat ground in between. It’s the biggest climb of the four days. After the ${peak} m pass, the trail starts its long descent toward Machu Picchu.`,
    },
    {
      q: "How many stairs are on the day-three descent of the Inca Trail?",
      a: `Day three is the longest day and the hardest on your knees. It’s an almost continuous stone descent of ${dayThreeDown} stairs through the cloud forest, past Sayacmarca and Phuyupatamarca. That’s more than half of all the downhill steps on the route.`,
    },
    {
      q: "How long is the Inca Trail and how many days does it take?",
      a: `My GPS recording puts the Classic Inca Trail at about ${dist} km from Km 82 to Machu Picchu. Most sources say 43 km, but the Peruvian Ministry of Culture’s own map also puts it near ${dist} km. Almost everyone walks it over 4 days and 3 nights, though some runners have finished it in under three and a half hours.`,
    },
    {
      q: "How were the steps counted?",
      a: `I counted them by hand! I walked the Inca Trail with a notebook and wrote down every staircase as I climbed or descended it. I set aside the doubtful steps (about ${intComma(
        t.ambiguousStairs,
      )} of them) as “maybe”. I tracked the steps you can walk around, and the ones on forks in the trail, separately. That way the count gives both a true total and a realistic minimum. And yes, that means I walked down both sides of every fork.`,
    },
  ];
}
