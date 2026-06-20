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

  return [
    {
      q: "How many steps are on the Inca Trail?",
      a: `Counted one by one along the 4-day Classic Inca Trail (Km 82 to Machu Picchu), there are about ${total} stone steps. You climb at least ${min} of them on the most direct route — the rest sit on optional detours and side-paths. Of the steps you take, roughly ${up} lead up and ${down} lead down.`,
    },
    {
      q: "How many stairs do you actually have to climb?",
      a: `At minimum ${min} — that skips every avoidable step, ignores the ambiguous ones, and takes the shorter side wherever the trail forks. The full count of stairs that physically exist, both sides of every fork included, is about ${total}.`,
    },
    {
      q: "What is the elevation profile of the Inca Trail?",
      a: `Measured from a real GPS track sampled against 30-metre topographic data, the trail starts around ${start} m at Km 82, drops to cross the Urubamba, then climbs to its high point of ${peak} m at Dead Woman's Pass — almost exactly halfway. From there it undulates down past Runkurakay, Sayacmarca and Phuyupatamarca to Machu Picchu at about ${end} m. You gain roughly ${climb} m and lose about ${drop} m overall.`,
    },
    {
      q: "What is the highest point of the Inca Trail?",
      a: `Dead Woman's Pass (Warmiwañusca), at about ${peak} m by 30-metre topographic data — reached at the midpoint of the trek, at the top of the day-two climb.`,
    },
    {
      q: "How long is the Inca Trail and how many days does it take?",
      a: `By GPS the Classic Inca Trail measures about ${dist} km from Km 82 to Machu Picchu (it is often cited as 43 km, but a firsthand GPS recording and the Ministry of Culture's own map both put it near ${dist} km). It is almost always walked over 4 days and 3 nights, camping each night.`,
    },
    {
      q: "How were the steps counted?",
      a: `By hand, on foot, with a notebook — every staircase tallied in real time over the four days, then transcribed and parsed. Steps that might not really count as steps are held aside (the "±" band of about ${intComma(
        t.ambiguousStairs,
      )}), and avoidable or forked steps are tracked so both a true total and a minimum can be given.`,
    },
  ];
}
