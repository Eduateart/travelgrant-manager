import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import {
  markAllNotificationsRead,
  notificationsFor,
  useStore,
  type CurrentUser,
} from "@/lib/stgs/store";
import { fmtDate } from "./shared";

export function NotificationsBell({ user }: { user: CurrentUser }) {
  const notifs = useStore(() => notificationsFor(user));
  const unread = notifs.filter((n) => !n.read).length;
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="relative gap-1.5"
          aria-label={`Notifications (${unread} unread)`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => markAllNotificationsRead(user)}
            disabled={unread === 0}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications.
            </div>
          ) : (
            notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (n.applicationId) {
                    navigate({
                      to: "/app/$id",
                      params: { id: n.applicationId },
                    });
                  }
                }}
                className={`w-full text-left px-3 py-2 border-b last:border-0 hover:bg-accent transition-colors ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {fmtDate(n.at)}
                      {n.applicationId && ` · ${n.applicationId}`}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
