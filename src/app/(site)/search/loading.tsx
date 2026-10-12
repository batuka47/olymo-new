import { SkeletonImage, SkeletonPage, SkeletonText } from "@/components/site/skeleton";

/** The title and the large search box, then rows of results. */
export default function SearchLoading() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-6 py-10 lg:gap-8 lg:px-12 lg:pt-16 lg:pb-12">
        <div className="flex flex-col gap-4">
          <SkeletonText className="h-11 w-48 lg:h-24 lg:w-96" />
          <SkeletonText className="h-4.5 w-full max-w-160" />
        </div>
        <SkeletonText className="h-14 w-full lg:h-20" />
      </div>
      <ul className="border-t border-line">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex gap-4 border-b border-line py-5 lg:px-12">
            <SkeletonImage className="size-23 shrink-0 lg:h-24 lg:w-40" />
            <div className="flex flex-1 flex-col gap-2.5">
              <SkeletonText className="h-3 w-24" />
              <SkeletonText className="h-5 w-full max-w-160" />
              <SkeletonText className="h-4 w-2/3 max-w-120" />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonPage>
  );
}
