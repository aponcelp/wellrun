/** Billboard-style movement mark: a small up/down arrow, a flat dash, or NEW. */
export default function ChartMove({ rank, lw, isNew }: { rank: number; lw: number | null; isNew: boolean }) {
  if (isNew) return <span className="mv mv--new">NEW</span>;
  if (lw == null) return <span className="mv mv--flat" aria-label="No last week rank">–</span>;
  if (lw > rank) return <span className="mv mv--up" aria-label={`Up from ${lw}`}>▲</span>;
  if (lw < rank) return <span className="mv mv--down" aria-label={`Down from ${lw}`}>▼</span>;
  return <span className="mv mv--flat" aria-label="Same as last week">–</span>;
}
