import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page page--co">
      <p className="back"><Link href="/">← Back to the board</Link></p>
      <h1 className="co__name">Off course</h1>
      <p className="co__what">That page isn&apos;t on the board. It may have been renamed or dropped.</p>
    </div>
  );
}
