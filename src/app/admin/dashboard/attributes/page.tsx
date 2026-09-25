"use client";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AttributesPage() {
  return (
    <div className="flex flex-1 min-h-0 min-w-0 flex-col space-y-6">
      <AdminBreadcrumb items={[{ label: "Catalog" }, { label: "Attributes" }]} />
      <AdminPageHeader title="Attributes" description="Manage product attributes" />
      <AdminContent>
        <Card>
          <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">This feature is under development.</p></CardContent>
        </Card>
      </AdminContent>
    </div>
  );
}
