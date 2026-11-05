import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createThread, deleteThread, getThreads, useThreads } from "@/lib/chat-threads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistente")({
  component: AssistenteLayout,
});

function AssistenteLayout() {
  const threads = useThreads();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  function newThread() {
    const t = createThread();
    navigate({ to: "/assistente/$threadId", params: { threadId: t.id } });
  }

  function remove(id: string) {
    deleteThread(id);
    if (id === activeId) {
      const next = getThreads()[0] ?? createThread();
      navigate({ to: "/assistente/$threadId", params: { threadId: next.id }, replace: true });
    }
  }

  return (
    <div className="mx-auto grid h-[calc(100vh-81px)] max-w-7xl gap-4 px-4 py-4 md:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-sidebar p-3 md:flex">
        <Button variant="hero" onClick={newThread}>
          <Plus /> Nova conversa
        </Button>
        <p className="px-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Conversas</p>
        <ul className="flex-1 space-y-1 overflow-y-auto">
          {threads.map((t) => (
            <li
              key={t.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-sidebar-accent",
                t.id === activeId && "bg-sidebar-accent",
              )}
            >
              <Link
                to="/assistente/$threadId"
                params={{ threadId: t.id }}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-sm",
                  t.id === activeId ? "text-primary" : "text-sidebar-foreground",
                )}
              >
                <MessageSquare className="size-4 shrink-0" />
                <span className="truncate">{t.title}</span>
              </Link>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Apagar conversa ${t.title}`}
                className="opacity-60 group-hover:opacity-100"
                onClick={() => remove(t.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
        <p className="px-1 text-xs text-muted-foreground">Salvas apenas neste navegador.</p>
      </aside>
      <div className="flex min-h-0 flex-col">
        <div className="mb-3 flex md:hidden">
          <Button variant="hero" size="sm" onClick={newThread}>
            <Plus /> Nova conversa
          </Button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
