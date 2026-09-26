import { RoleGate } from "@/components/role-gate";
import { AccountSidebar } from "@/components/account/account-sidebar";

/** Two-pane shell for the whole /account section (mirrors community/layout.tsx's pattern) —
 *  the sidebar only shows at md+; below that, each page is its own full-width screen. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate>
      <div className="mx-auto max-w-5xl md:flex md:items-start md:gap-10">
        <aside className="hidden md:sticky md:top-24 md:block md:w-64 md:shrink-0">
          <AccountSidebar />
        </aside>
        <div className="min-w-0 flex-1 md:max-w-2xl md:py-2">{children}</div>
      </div>
    </RoleGate>
  );
}
