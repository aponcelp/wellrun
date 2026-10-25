/** Billboard-style movement chip: ▲/▼ with places moved, NEW, or a flat dash. Same look every week. */
export default function ChartMove({ rank, lw, isNew }: { rank: number; lw: number | null; isNew: boolean }) {
  if (isNew) return <span className="mv mv--new">NEW</span>;
  if (lw == null) return <span className="mv mv--flat" aria-label="No last week rank">–</span>;
  if (lw > rank) return <span className="mv mv--up" aria-label={`Up ${lw - rank} from ${lw}`}>▲<b>{lw - rank}</b></span>;
  if (lw < rank) return <span className="mv mv--down" aria-label={`Down ${rank - lw} from ${lw}`}>▼<b>{rank - lw}</b></span>;
  return <span className="mv mv--flat" aria-label="Same as last week">=</span>;
}
