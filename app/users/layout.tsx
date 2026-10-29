import RoleProtectedLayout from "@/app/_auth/RoleProtectedLayout";

export default function UsersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleProtectedLayout roles={["ADMIN"]}>
      {children}
    </RoleProtectedLayout>
  );
}
