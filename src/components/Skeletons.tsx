import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`bg-black/[0.06] dark:bg-white/[0.08] animate-shimmer rounded-xl ${className}`}
      {...props}
    />
  )
}

/**
 * Skeleton for single institution card in grid
 */
export const InstitutionCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl p-xl flex flex-col h-full border border-black/5 dark:border-white/10 shadow-sm animate-fadeIn">
      <div className="flex flex-col gap-xs flex-1 min-w-0 mb-lg">
        <div className="flex items-start justify-between gap-sm">
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
        <Skeleton className="w-4/5 h-5 rounded-lg mt-sm" />
        <Skeleton className="w-3/5 h-5 rounded-lg mt-1" />
      </div>

      <div className="mt-auto w-full flex flex-col gap-lg">
        <div className="flex items-center gap-xs">
          <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
          <Skeleton className="w-24 h-3.5 rounded-md" />
        </div>
        <div className="flex items-center justify-between pt-lg border-t border-border-secondary w-full shrink-0">
          <Skeleton className="w-12 h-6 rounded-full" />
          <Skeleton className="w-20 h-4 rounded-md" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for the entire institution list view (Home page)
 */
export const InstitutionListSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-2xl animate-fadeIn">
      {/* Search Header Banner */}
      <div className="relative z-30 flex flex-col gap-xl p-2xl rounded-3xl shadow-lg shadow-black/5">
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-3xl -z-10" />
        <div className="flex flex-col gap-xs">
          <Skeleton className="w-64 h-8 rounded-xl" />
          <Skeleton className="w-96 max-w-full h-4 rounded-lg mt-1" />
        </div>

        {/* Search input skeleton */}
        <div className="h-12 bg-white/30 dark:bg-black/30 border border-black/5 dark:border-white/10 rounded-2xl px-xl flex items-center gap-md">
          <Skeleton className="w-5 h-5 rounded-full shrink-0" />
          <Skeleton className="w-64 max-w-[70%] h-4 rounded-md" />
        </div>

        {/* Filter / Sort Row skeleton */}
        <div className="flex items-center gap-lg flex-wrap">
          <div className="flex items-center gap-sm">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-10 h-4 rounded" />
          </div>
          <Skeleton className="w-48 h-9 rounded-2xl" />
          <div className="flex items-center gap-sm ml-auto">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-16 h-4 rounded" />
          </div>
          <div className="flex gap-sm">
            <Skeleton className="w-16 h-9 rounded-full" />
            <Skeleton className="w-20 h-9 rounded-full" />
            <Skeleton className="w-24 h-9 rounded-full" />
          </div>
        </div>
      </div>

      {/* Grid count header */}
      <div>
        <div className="flex items-center justify-between mb-lg">
          <Skeleton className="w-32 h-4 rounded-md" />
          <Skeleton className="w-24 h-4 rounded-md" />
        </div>

        {/* Institution Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {Array.from({ length: 8 }).map((_, i) => (
            <InstitutionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for Professor Details View
 */
export const ProfessorDetailsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-2xl animate-fadeIn">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-sm flex-wrap">
        <Skeleton className="w-20 h-4 rounded-md" />
        <span className="text-text-tertiary">/</span>
        <Skeleton className="w-28 h-4 rounded-md" />
        <span className="text-text-tertiary">/</span>
        <Skeleton className="w-32 h-4 rounded-md" />
        <span className="text-text-tertiary">/</span>
        <Skeleton className="w-36 h-4 rounded-md" />
      </div>

      {/* Main Top Grid (Profile Card & Summary Stats) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Left: Profile & Primary Scores */}
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl flex flex-col gap-xl">
          {/* Big Score Header */}
          <div className="flex flex-col gap-xs">
            <Skeleton className="w-24 h-12 rounded-2xl" />
            <Skeleton className="w-40 h-4 rounded-md mt-1" />
          </div>

          {/* Professor Identity */}
          <div className="flex items-center gap-lg">
            <Skeleton className="w-16 h-16 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="w-48 max-w-full h-7 rounded-xl" />
              <Skeleton className="w-64 max-w-full h-4 rounded-md" />
            </div>
          </div>

          {/* Stat Blocks */}
          <div className="flex gap-2xl py-lg border-y border-border-secondary">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-16 h-7 rounded-lg" />
              <Skeleton className="w-20 h-3 rounded-md" />
            </div>
            <div className="w-px bg-border-secondary" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-16 h-7 rounded-lg" />
              <Skeleton className="w-16 h-3 rounded-md" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-sm">
            <Skeleton className="h-11 rounded-full" />
            <Skeleton className="h-11 rounded-full" />
            <Skeleton className="h-11 rounded-full" />
          </div>
        </div>

        {/* Right: Star Breakdown & Tags */}
        <div className="flex flex-col gap-xl">
          {/* Star Distribution Box */}
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg">
            <Skeleton className="w-36 h-5 rounded-lg" />
            <div className="flex flex-col gap-3">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-lg">
                  <Skeleton className="w-14 h-4 rounded" />
                  <Skeleton className="flex-1 h-2.5 rounded-full" />
                  <Skeleton className="w-6 h-4 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Tags Skeleton */}
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg">
            <Skeleton className="w-36 h-5 rounded-lg" />
            <div className="flex flex-wrap gap-sm">
              <Skeleton className="w-24 h-7 rounded-full" />
              <Skeleton className="w-32 h-7 rounded-full" />
              <Skeleton className="w-28 h-7 rounded-full" />
              <Skeleton className="w-20 h-7 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col sm:flex-row gap-lg justify-between items-start sm:items-center">
        <div className="flex items-center gap-sm flex-wrap">
          <Skeleton className="w-20 h-4 rounded-md mr-2" />
          <Skeleton className="w-16 h-8 rounded-full" />
          <Skeleton className="w-24 h-8 rounded-full" />
          <Skeleton className="w-28 h-8 rounded-full" />
        </div>
        <div className="flex items-center gap-md">
          <Skeleton className="w-14 h-4 rounded-md" />
          <Skeleton className="w-44 h-9 rounded-2xl" />
        </div>
      </div>

      {/* Reviews List Section */}
      <div className="flex flex-col gap-lg">
        <Skeleton className="w-48 h-6 rounded-xl mb-sm" />

        {/* 2 Review Card Skeletons */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg"
          >
            <div className="flex flex-col md:flex-row justify-between gap-lg border-b border-border-secondary pb-lg">
              <div className="flex flex-col gap-md">
                <div>
                  <Skeleton className="w-36 h-5 rounded-lg" />
                  <Skeleton className="w-24 h-3.5 rounded-md mt-1.5" />
                </div>
                <div className="flex gap-lg">
                  <Skeleton className="w-16 h-14 rounded-2xl" />
                  <Skeleton className="w-16 h-14 rounded-2xl" />
                </div>
              </div>
              <Skeleton className="w-32 h-5 rounded-lg" />
            </div>

            {/* Criteria mini tags */}
            <div className="flex flex-wrap gap-sm">
              <Skeleton className="w-24 h-6 rounded-lg" />
              <Skeleton className="w-28 h-6 rounded-lg" />
              <Skeleton className="w-20 h-6 rounded-lg" />
              <Skeleton className="w-24 h-6 rounded-lg" />
            </div>

            {/* Comment lines */}
            <div className="flex flex-col gap-2">
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-11/12 h-4 rounded-md" />
              <Skeleton className="w-4/5 h-4 rounded-md" />
            </div>

            {/* Vote footer */}
            <div className="flex items-center gap-md pt-sm">
              <Skeleton className="w-20 h-8 rounded-full" />
              <Skeleton className="w-20 h-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for Institution Details View
 */
export const InstitutionDetailsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-2xl animate-fadeIn">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-sm flex-wrap">
        <Skeleton className="w-20 h-4 rounded-md" />
        <span className="text-text-tertiary">/</span>
        <Skeleton className="w-36 h-4 rounded-md" />
      </div>

      {/* Header Banner */}
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
        <div className="flex flex-col gap-xs">
          <Skeleton className="w-20 h-6 rounded-full" />
          <Skeleton className="w-72 max-w-full h-8 rounded-xl mt-1" />
          <div className="flex items-center gap-xs mt-1">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="w-28 h-4 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <Skeleton className="w-24 h-9 rounded-full" />
          <Skeleton className="w-28 h-9 rounded-full" />
        </div>
      </div>

      {/* Rating Breakdown & Metrics */}
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl grid grid-cols-1 lg:grid-cols-3 gap-xl items-center">
        <div className="flex flex-col items-center justify-center p-xl gap-2">
          <Skeleton className="w-24 h-14 rounded-2xl" />
          <Skeleton className="w-36 h-4 rounded-md" />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-xl">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="w-28 h-4 rounded" />
                <Skeleton className="w-12 h-6 rounded-full" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="w-28 h-4 rounded" />
                <Skeleton className="w-12 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Departments Grid Skeleton */}
      <div className="flex flex-col gap-lg">
        <Skeleton className="w-48 h-6 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-4"
            >
              <Skeleton className="w-4/5 h-5 rounded-lg" />
              <Skeleton className="w-24 h-4 rounded-md" />
              <div className="mt-auto flex justify-end">
                <Skeleton className="w-5 h-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for Department Details View
 */
export const DepartmentDetailsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-2xl animate-fadeIn">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-sm flex-wrap">
        <Skeleton className="w-20 h-4 rounded-md" />
        <span className="text-text-tertiary">/</span>
        <Skeleton className="w-28 h-4 rounded-md" />
        <span className="text-text-tertiary">/</span>
        <Skeleton className="w-36 h-4 rounded-md" />
      </div>

      {/* Header */}
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
        <div className="flex flex-col gap-xs">
          <Skeleton className="w-32 h-4 rounded-md" />
          <Skeleton className="w-60 max-w-full h-8 rounded-xl mt-1" />
          <Skeleton className="w-24 h-4 rounded-md mt-1" />
        </div>
        <Skeleton className="w-36 h-9 rounded-full" />
      </div>

      {/* Search Input Skeleton */}
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl">
        <div className="h-12 bg-white/30 dark:bg-black/30 border border-black/5 dark:border-white/10 rounded-xl px-xl flex items-center gap-md">
          <Skeleton className="w-5 h-5 rounded-full shrink-0" />
          <Skeleton className="w-48 h-4 rounded-md" />
        </div>
      </div>

      {/* Professors 2-column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg"
          >
            <div className="flex items-start justify-between gap-lg">
              <div className="flex items-center gap-lg">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="w-36 h-5 rounded-lg" />
                  <Skeleton className="w-20 h-3.5 rounded-md" />
                </div>
              </div>
              <Skeleton className="w-12 h-6 rounded-full" />
            </div>
            <div className="mt-auto flex gap-xl pt-lg border-t border-border-secondary">
              <div className="flex flex-col gap-1">
                <Skeleton className="w-12 h-3 rounded" />
                <Skeleton className="w-8 h-4 rounded" />
              </div>
              <div className="flex flex-col gap-1">
                <Skeleton className="w-12 h-3 rounded" />
                <Skeleton className="w-10 h-4 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
