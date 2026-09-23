import { Suspense } from "react";
import { CommunityMobileNav } from "@/components/community-mobile-nav";
import { CommunitySidebar } from "@/components/community-sidebar";
import { CommunityTrendingWidget } from "@/components/community-trending-widget";
import { QuestionsForYouWidget } from "@/components/questions-for-you-widget";

/**
 * Shared 3-column shell for every /community/* route (feed, post detail,
 * profile, explore, following/followers lists) — scoped to this section
 * only, the rest of the app keeps its existing single-column (site)/layout.tsx.
 * Left nav is hidden below lg (see CommunityMobileNav for the mobile
 * equivalent); the trending rail is hidden below xl to avoid a cramped
 * middle column on medium screens.
 */
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    // The site shell reserves pt-24 under the fixed navbar for every page (see
    // (site)/layout.tsx) — that's generous breathing room on desktop but leaves
    // a visibly dead strip above the compact mobile nav here, so pull just this
    // section up on mobile only (lg+ leaves the shared offset alone).
    <div className="mx-auto -mt-6 flex max-w-7xl items-start gap-6 lg:mt-0">
      <aside className="sticky top-24 hidden w-64 shrink-0 border-r border-ink-100 pr-4 lg:block">
        <Suspense fallback={null}>
          <CommunitySidebar />
        </Suspense>
      </aside>

      <div className="min-w-0 flex-1">
        <Suspense fallback={null}>
          <CommunityMobileNav className="mb-0.5 lg:hidden" />
        </Suspense>
        {children}
      </div>

      <aside className="sticky top-24 hidden w-72 shrink-0 xl:block">
        <QuestionsForYouWidget limit={3} className="mb-4" />
        <CommunityTrendingWidget />
      </aside>
    </div>
  );
}
