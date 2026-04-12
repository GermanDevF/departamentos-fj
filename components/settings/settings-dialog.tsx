"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconLoader2,
  IconMail,
  IconPhoto,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import { useAuth } from "@/components/auth/auth-provider";
import { saveMyProfileSettings } from "@/lib/profile/actions";
import {
  profileSettingsSchema,
  type ProfileSettingsFormValues,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type SettingsSection = "profile" | "account";

const navItems: { id: SettingsSection; label: string; icon: typeof IconUser }[] =
  [
    { id: "profile", label: "Perfil", icon: IconUser },
    { id: "account", label: "Cuenta", icon: IconMail },
  ];

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [ section, setSection ] = useState<SettingsSection>("profile");
  const [ pending, startTransition ] = useTransition();
  const [ avatarFile, setAvatarFile ] = useState<File | null>(null);
  const [ removeAvatar, setRemoveAvatar ] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: { name: user?.name ?? "" },
    mode: "onBlur",
  });

  const previewUrl = useMemo(() => {
    if (!avatarFile) return null;
    return URL.createObjectURL(avatarFile);
  }, [ avatarFile ]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [ previewUrl ]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setAvatarFile(null);
      setRemoveAvatar(false);
      form.clearErrors();
    }
    onOpenChange(next);
  }

  function initials() {
    const base = user?.name ?? user?.email ?? "?";
    return base
      .split(" ")
      .map((w) => w[ 0 ])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const displayImage =
    previewUrl ??
    (!removeAvatar && user?.avatarUrl ? user.avatarUrl : null);

  function onSubmit(values: ProfileSettingsFormValues) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", values.name);
      fd.set("removeAvatar", removeAvatar ? "true" : "false");
      if (avatarFile) fd.set("avatar", avatarFile);

      const result = await saveMyProfileSettings(fd);
      if (result.success) {
        toast.success("Perfil actualizado");
        setAvatarFile(null);
        setRemoveAvatar(false);
        await refresh();
        router.refresh();
        onOpenChange(false);
      } else {
        form.setError("root", { message: result.error });
      }
    });
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[min(90dvh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="border-b px-6 py-4 pr-14">
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Administra tu perfil y datos de la cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col sm:flex-row">
          <nav
            className="flex shrink-0 gap-1 border-b p-3 sm:w-48 sm:flex-col sm:border-r sm:border-b-0 sm:bg-muted/40"
            aria-label="Secciones de configuración"
          >
            {navItems.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={section === item.id ? "secondary" : "ghost"}
                className={cn(
                  "justify-start gap-2",
                  section === item.id && "bg-background shadow-sm",
                )}
                onClick={() => setSection(item.id)}
              >
                <item.icon className="size-4 shrink-0 opacity-70" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
            {section === "profile" && (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div>
                    <Label className="text-muted-foreground">Foto de perfil</Label>
                    <div className="mt-3 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                      <Avatar size="lg" className="size-20">
                        {displayImage ? (
                          <AvatarImage src={displayImage} alt="" />
                        ) : null}
                        <AvatarFallback className="text-lg">
                          {initials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[ 0 ];
                            setRemoveAvatar(false);
                            setAvatarFile(f ?? null);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <IconPhoto className="size-4" />
                          Subir imagen
                        </Button>
                        {(user.avatarUrl || avatarFile) && !removeAvatar && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setAvatarFile(null);
                              setRemoveAvatar(true);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          >
                            <IconTrash className="size-4" />
                            Quitar foto
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      JPG, PNG, GIF o WebP. Máximo 5 MB.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre visible</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Tu nombre"
                            autoComplete="name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {form.formState.errors.root.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={pending}>
                      {pending ? (
                        <>
                          <IconLoader2 className="size-4 animate-spin" />
                          Guardando…
                        </>
                      ) : (
                        "Guardar cambios"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {section === "account" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Correo electrónico</Label>
                  <Input value={user.email} readOnly className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">
                    El email no se puede cambiar desde aquí.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Verificación de email</Label>
                  <p className="text-sm">
                    {user.emailVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Verificado
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        Pendiente de verificación
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <p className="text-sm text-muted-foreground">
                    {user.role === "admin" ? "Administrador" : "Staff"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
