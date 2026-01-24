import AdminNav from "@/components/admin/AdminNav";

export default function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminNav />
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}
