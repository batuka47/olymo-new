import {
  SkeletonGrid,
  SkeletonImage,
  SkeletonPage,
  SkeletonText,
} from "@/components/site/skeleton";

/** The hero (text and search on the left, lead story on the right), then the featured row. */
export default function HomeLoading() {
  return (
    <SkeletonPage>
      <div className="grid gap-y-7 pb-8 lg:grid-cols-12 lg:pb-0">
        <div className="flex flex-col gap-4 pt-8 lg:col-span-7 lg:gap-7 lg:border-r lg:border-line lg:pt-22 lg:pr-14 lg:pb-18 lg:pl-12">
          <SkeletonText className="h-3 w-48" />
          <div className="flex flex-col gap-2.5 lg:gap-4">
            <SkeletonText className="h-8 w-full lg:h-15" />
            <SkeletonText className="h-8 w-5/6 lg:h-15" />
            <SkeletonText className="h-8 w-2/3 lg:h-15" />
          </div>
          <SkeletonText className="h-4 w-full max-w-140" />
          <SkeletonText className="h-4 w-4/5 max-w-112" />
          <SkeletonText className="h-12 w-full max-w-140 lg:h-14" />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5 lg:p-8">
          <SkeletonImage className="aspect-video w-full" />
          <SkeletonText className="h-6 w-full" />
          <SkeletonText className="h-6 w-2/3" />
        </div>
      </div>
      <div className="border-t border-line pt-8 lg:pt-10">
        <SkeletonText className="mb-5 h-7 w-40 lg:mx-8 lg:mb-6 lg:h-9" />
        <SkeletonGrid count={4} columns={4} />
      </div>
    </SkeletonPage>
  );
}
