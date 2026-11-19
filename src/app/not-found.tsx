import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <p className="text-4xl">🧭</p>
      <p className="mt-3">No encontramos este panorama. / We couldn&apos;t find this plan.</p>
      <Link href="/" className="btn-primary mt-5">
        Panoramas
      </Link>
    </div>
  );
}
