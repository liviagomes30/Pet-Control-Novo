"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PawPrint, Heart, Calendar, Package, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sair } from "@/app/(auth)/login/_actions/login.actions";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: PawPrint },
  { href: "/animais", label: "Animais", icon: PawPrint },
  { href: "/adocoes", label: "Adoções", icon: Heart },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/produtos", label: "Estoque", icon: Package },
];

export function DashboardNav({ userEmail }: { userEmail: string | undefined }) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 overflow-x-auto">
          <span className="font-bold text-lg shrink-0">🐾 PetControl</span>
          <nav className="flex items-center gap-1">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {userEmail && (
            <span className="text-sm text-gray-500 hidden sm:inline">{userEmail}</span>
          )}
          <form action={sair}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
