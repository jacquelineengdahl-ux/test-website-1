"use client";

import AuthenticatedLayout from "@/app/components/AuthenticatedLayout";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
