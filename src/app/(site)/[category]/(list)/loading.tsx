import {
  SkeletonGrid,
  SkeletonImage,
  SkeletonPage,
  SkeletonText,
} from "@/components/site/skeleton";

/** The big category title, the banner story, then the grid of cards. */
export default function CategoryLoading() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-4 py-10 lg:px-12 lg:pt-16 lg:pb-10">
        <SkeletonText className="h-3 w-24" />
        <SkeletonText className="h-11 w-3/4 max-w-120 lg:h-24" />
        <SkeletonText className="h-4.5 w-full max-w-160" />
      </div>
      <div className="grid border-t border-line lg:grid-cols-12">
        <SkeletonImage className="aspect-video w-full lg:col-span-7" />
        <div className="flex flex-col gap-3 py-6 lg:col-span-5 lg:p-10">
          <SkeletonText className="h-3 w-24" />
          <SkeletonText className="h-7 w-full" />
          <SkeletonText className="h-7 w-2/3" />
          <SkeletonText className="h-4 w-full" />
        </div>
      </div>
      <div className="border-t border-line pt-8 lg:pt-10">
        <SkeletonText className="mb-5 h-7 w-40 lg:mx-8 lg:mb-6 lg:h-9" />
        <SkeletonGrid count={6} />
      </div>
    </SkeletonPage>
  );
}
