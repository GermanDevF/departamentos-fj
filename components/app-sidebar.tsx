"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  IconLayoutDashboard,
  IconHome,
  IconUsers,
  IconCash,
  IconFileDescription,
  IconLogout,
  IconChevronDown,
  IconBuilding,
  IconUserShield,
  IconUserPlus,
  IconSettings,
} from "@tabler/icons-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useAdminPendingRealtime } from "@/components/admin-pending-realtime-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

function useNavItems() {
  const { isAdmin } = useAuth();

  const navMain = [
    {
      label: "General",
      items: [
        { title: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
      ],
    },
    {
      label: "Gestión",
      items: [
        { title: "Propiedades", href: "/dashboard/propiedades", icon: IconHome },
        { title: "Inquilinos", href: "/dashboard/inquilinos", icon: IconUsers },
        { title: "Contratos", href: "/dashboard/contratos", icon: IconFileDescription },
        { title: "Pagos", href: "/dashboard/pagos", icon: IconCash },
      ],
    },
    ...(isAdmin
      ? [
        {
          label: "Administración",
          items: [
            {
              title: "Solicitudes de acceso",
              href: "/dashboard/solicitudes",
              icon: IconUserPlus,
            },
            { title: "Usuarios", href: "/dashboard/usuarios", icon: IconUserShield },
          ],
        },
      ]
      : []),
  ];

  return navMain;
}

function getUserInitials(name: string | null, email: string): string {
  function fromEmail(e: string): string {
    const local = e.split("@")[0] ?? e;
    const letters = local.replace(/[^a-zA-ZÀ-ÿ0-9]/gi, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (letters.length === 1) return `${letters}U`.toUpperCase();
    return "??";
  }

  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0]?.[0];
      const b = parts[parts.length - 1]?.[0];
      if (a && b) return `${a}${b}`.toUpperCase();
    }
    const word = parts[0] ?? "";
    if (word.length >= 2) return word.slice(0, 2).toUpperCase();
    if (word.length === 1) {
      const fe = fromEmail(email);
      const extra = fe.slice(1, 2) || fe[0] || "U";
      return `${word}${extra}`.toUpperCase().slice(0, 2);
    }
  }
  return fromEmail(email);
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const navMain = useNavItems();
  const { user, loading } = useAuth();
  const { pendingCount } = useAdminPendingRealtime();

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/dashboard"
                aria-current={pathname === "/dashboard" ? "page" : undefined}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IconBuilding className="size-4" />
                </div>
                <div className="grid min-h-9 flex-1 content-center text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Departamentos FJ
                  </span>
                  {loading ? (
                    <Skeleton className="mt-0.5 h-3 w-24 max-w-full" />
                  ) : user ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {user.role === "admin" ? "Administrador" : "Staff"}
                    </span>
                  ) : (
                    <span className="truncate text-xs text-muted-foreground">
                      …
                    </span>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navMain.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isNavItemActive(pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          {item.href === "/dashboard/solicitudes" &&
                            pendingCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-auto size-5 justify-center rounded-full p-0 text-[0.625rem]"
                              >
                                {pendingCount}
                              </Badge>
                            )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavUser() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsKey, setSettingsKey] = useState(0);

  if (!loading && !user) return null;

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            className="flex h-12 w-full items-center gap-2 rounded-md p-2"
            aria-busy="true"
            aria-label="Cargando cuenta de usuario"
          >
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <div className="grid min-w-0 flex-1 gap-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3.5 w-24 max-w-full" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) return null;

  const initials = getUserInitials(user.name, user.email);
  const displayName = user.name ?? user.email;
  const accountMenuLabel = `Menú de cuenta de ${displayName}`;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SettingsDialog
        key={settingsKey}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={displayName}
              aria-label={accountMenuLabel}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:[&>div]:hidden group-data-[collapsible=icon]:[&>svg:last-child]:hidden"
            >
              <Avatar size="sm" className="shrink-0">
                {user.avatarUrl ? (
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={displayName}
                  />
                ) : null}
                <AvatarFallback className="text-[0.625rem]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.name ?? user.email}
                </span>
                {user.name && (
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                )}
              </div>
              <IconChevronDown className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="end"
            className="w-56"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-start gap-3">
                <Avatar className="size-10 shrink-0">
                  {user.avatarUrl ? (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={displayName}
                    />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="truncate text-sm font-medium leading-none">
                    {user.name ?? "Usuario"}
                  </p>
                  <p className="truncate text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <Badge variant="secondary" className="w-fit text-[0.625rem] font-normal">
                    {user.role === "admin" ? "Administrador" : "Staff"}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSettingsKey((k) => k + 1);
                setSettingsOpen(true);
              }}
            >
              <IconSettings />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <IconLogout />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
