import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { isPlaceholder } from "@/config/site";
import type { TeamMember } from "@/lib/site-pages/queries";

/** Members whose name is still "[Нэр]" are left out until someone fills them in. */
export function visibleTeam(members: TeamMember[]): TeamMember[] {
  return members.filter((member) => !isPlaceholder(member.name));
}

/** Photo, name and role cards: two per row on phones, four from sm up. */
export function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
      {members.map((member) => (
        <li key={member.id} className="flex flex-col gap-3">
          {member.photo_path ? (
            <ResponsiveImage
              path={member.photo_path}
              // The name is written right under the photo.
              alt=""
              sizes="(min-width: 1024px) 180px, (min-width: 640px) 25vw, 50vw"
              className="aspect-square w-full object-cover"
            />
          ) : (
            <ImagePlaceholder className="aspect-square w-full" />
          )}
          <div className="flex flex-col gap-1">
            <p className="text-[15px] leading-snug font-semibold">{member.name}</p>
            {member.role && !isPlaceholder(member.role) && (
              <p className="font-mono text-[11px] tracking-label text-muted uppercase">
                {member.role}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
