import { SkeletonImage, SkeletonPage, SkeletonText } from "@/components/site/skeleton";

/** Breadcrumb, title, lead and byline; then the cover and text beside the side column. */
export default function ArticleLoading() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-6 py-8 lg:px-12 lg:pt-14 lg:pb-10">
        <SkeletonText className="h-3 w-48" />
        <div className="flex max-w-260 flex-col gap-2.5 lg:gap-3.5">
          <SkeletonText className="h-8 w-full lg:h-13" />
          <SkeletonText className="h-8 w-3/4 lg:h-13" />
        </div>
        <SkeletonText className="h-5 w-full max-w-205" />
        <div className="flex items-center gap-3.5 border-t border-line pt-5">
          <SkeletonImage className="size-11" />
          <SkeletonText className="h-4 w-40" />
        </div>
      </div>
      <div className="grid border-t border-line lg:grid-cols-12">
        <div className="flex flex-col gap-3 py-8 lg:col-span-8 lg:border-r lg:border-line lg:px-12 lg:pt-10">
          <SkeletonImage className="mb-5 aspect-video w-full" />
          {["w-full", "w-full", "w-11/12", "w-full", "w-2/3"].map((width, index) => (
            <SkeletonText key={index} className={`h-4.5 ${width}`} />
          ))}
        </div>
        <div className="hidden flex-col gap-4 lg:col-span-4 lg:flex lg:px-8 lg:pt-10">
          <SkeletonText className="h-5 w-32" />
          <SkeletonText className="h-4 w-full" />
          <SkeletonText className="h-4 w-5/6" />
        </div>
      </div>
    </SkeletonPage>
  );
}
