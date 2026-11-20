"use client";
import { useState } from "react";

type Labels = { publishAs: string; me: string; visibility: string; public: string; community: string };

export default function PublishAs({ communities, defaultId, labels }: { communities: { id: string; name: string }[]; defaultId?: string; labels: Labels }) {
  const [cid, setCid] = useState(defaultId ?? "");
  if (!communities.length) return null;
  return (
    <div className="space-y-3 rounded-xl bg-sea/5 p-4">
      <div>
        <label className="label">{labels.publishAs}</label>
        <select className="input" name="communityId" value={cid} onChange={(e) => setCid(e.target.value)}>
          <option value="">{labels.me}</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              👥 {c.name}
            </option>
          ))}
        </select>
      </div>
      {cid && (
        <div>
          <p className="label">{labels.visibility}</p>
          <div className="flex flex-wrap gap-2">
            {(["community", "public"] as const).map((v) => (
              <label key={v} className="cursor-pointer">
                <input type="radio" name="visibility" value={v} defaultChecked={v === "community"} className="peer sr-only" />
                <span className="chip border border-line bg-white px-3 py-1.5 text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white">
                  {v === "community" ? "🔒 " + labels.community : "🌐 " + labels.public}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
