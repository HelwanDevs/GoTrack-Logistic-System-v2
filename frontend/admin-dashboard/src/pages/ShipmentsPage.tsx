import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Pagination } from "@/components/Pagination";
import {
  useMyShipmentsQuery,
  useSearchShipmentsQuery,
  useCreateShipmentMutation,
  useUpdateShipmentStatusMutation,
  type ShipmentDTO,
  type ShipmentFilter,
  type ShipmentPageResponse,
} from "@/features/shipments";
import { ShipmentStatus } from "@/features/shipments/types";
import { useBranchesQuery, type BranchDTO } from "@/features/branches";
import { usePickupsQuery, type PickupRequestDTO, PickupStatus } from "@/features/pickups";

interface Shipment {
  id: string;
  pickupRequestId?: string;
  pickupRequestCode?: string;
  status: ShipmentStatus;
  branchId?: string;
  branchName?: string;
  courierId?: string;
  courierName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EditingShipment {
  id: string;
  status: ShipmentStatus;
}

interface CreateShipmentForm {
  pickupRequestId: string;
  branchId: string;
}

export const ShipmentsPage = () => {
  // ── UI State ──
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // ── Edit Form State ──
  const [editForm, setEditForm] = useState<EditingShipment>({
    id: "",
    status: ShipmentStatus.PENDING,
  });

  // ── Pagination ──
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // ── Filters ──
  const [shipmentIdSearch, setShipmentIdSearch] = useState("");
  const [pickupFilter, setPickupFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "">("");
  const [dateFilter, setDateFilter] = useState("");

  // ── Create Form State ──
  const [createForm, setCreateForm] = useState<CreateShipmentForm>({
    pickupRequestId: "",
    branchId: "",
  });

  // ── API Hooks ──
  const {
    data: shipmentsData,
    isLoading: shipmentsLoading,
    error: shipmentsError,
  } = useMyShipmentsQuery(page, pageSize);

  const {
    data: searchData,
    isLoading: isSearching,
    error: searchError,
  } = useSearchShipmentsQuery({
    status: statusFilter || undefined,
    pickupRequestId: pickupFilter ? Number(pickupFilter) : undefined,
    branchId: branchFilter ? Number(branchFilter) : undefined,
    page: 0,
    size: 50,
  });

  const createMutation = useCreateShipmentMutation();
  const updateMutation = useUpdateShipmentStatusMutation();

  // ── Fetch Pickups and Branches ──
  const { data: pickupsData, isLoading: pickupsLoading } = usePickupsQuery(0, 100);
  const { data: branchesData, isLoading: branchesLoading } = useBranchesQuery({ page: 0, size: 100 });

  // ── Derived Data ──
  const isSearchActive = Boolean(
    shipmentIdSearch ||
    pickupFilter ||
    branchFilter ||
    statusFilter ||
    dateFilter,
  );

  const shipments =
    (isSearchActive ? searchData?.content : shipmentsData?.content)?.map(
      (shipment: ShipmentDTO) => ({
        id: String(shipment.id || ""),
        pickupRequestId: shipment.pickupRequestId
          ? String(shipment.pickupRequestId)
          : undefined,
        pickupRequestCode: shipment.pickupRequestId
          ? `#${String(shipment.pickupRequestId).padStart(5, "0")}`
          : undefined,
        status: shipment.status || ShipmentStatus.PENDING,
        branchId: shipment.branchId ? String(shipment.branchId) : undefined,
        branchName: getBranchName(shipment.branchId),
        courierId: shipment.courierId ? String(shipment.courierId) : undefined,
        courierName: shipment.courierId ? getCourierName(shipment.courierId) : undefined,
        createdAt: shipment.createdAt || new Date().toISOString(),
        updatedAt: shipment.updatedAt || new Date().toISOString(),
      }),
    ) || [];

  const totalCount = isSearchActive
    ? searchData?.totalElements
    : shipmentsData?.totalElements;
  const totalPages = isSearchActive
    ? searchData?.totalPages
    : shipmentsData?.totalPages;

  const pickups: { id: string; code: string; merchantName: string }[] =
    pickupsData?.content?.map((p: PickupRequestDTO) => ({
      id: String(p.id || ""),
      code: `#${String(p.id || "").padStart(5, "0")}`,
      merchantName: `تاجر #${p.MERCHANTId}`,
    })) || [];

  const branches: { id: string; name: string }[] =
    branchesData?.content?.map((b: BranchDTO) => ({
      id: String(b.id),
      name: b.name,
    })) || [];

  const getBranchName = (branchId?: number) => {
    if (!branchId) return "غير محدد";
    const id = String(branchId);
    const branch = branches.find((b) => b.id === id);
    return branch?.name || "فرع";
  };

  const getCourierName = (courierId?: number) => {
    if (!courierId) return "غير محدد";
    // This would typically come from a profiles query
    return `مندوب #${courierId}`;
  };

  // ── Handlers ──
  const handleCreateShipment = async () => {
    const errors: Record<string, string> = {};

    if (!createForm.pickupRequestId) {
      errors.pickupRequestId = "طلب البيك آب مطلوب";
    }
    if (!createForm.branchId) {
      errors.branchId = "الفرع مطلوب";
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        pickupRequestId: Number(createForm.pickupRequestId),
        branchId: Number(createForm.branchId),
      } as ShipmentDTO);

      setCreateForm({ pickupRequestId: "", branchId: "" });
      setShowCreateForm(false);
    } catch (error: any) {
      console.error("Failed to create shipment:", error);
    }
  };

  const handleEditClick = (shipment: Shipment) => {
    setEditingId(shipment.id);
    setEditForm({
      id: shipment.id,
      status: shipment.status,
    });
  };

  const handleSaveEdit = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: Number(editingId),
          data: {
            status: editForm.status,
          } as ShipmentDTO,
        });

        setEditingId(null);
        setEditForm({
          id: "",
          status: ShipmentStatus.PENDING,
        });
      }
    } catch (error: any) {
      console.error("Failed to update shipment:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      id: "",
      status: ShipmentStatus.PENDING,
    });
  };

  const handleUpdateStatus = async (
    shipmentId: string,
    newStatus: ShipmentStatus,
  ) => {
    try {
      await updateMutation.mutateAsync({
        id: Number(shipmentId),
        data: {
          status: newStatus,
        } as ShipmentDTO,
      });
    } catch (error: any) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    const statusColors: Record<
      ShipmentStatus,
      { bg: string; text: string; label: string }
    > = {
      PENDING: {
        bg: "bg-secondary-fixed",
        text: "text-on-secondary-container",
        label: "في الانتظار",
      },
      IN_TRANSIT: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "قيد التوصيل",
      },
      DELIVERED: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "تم التسليم",
      },
      CANCELLED: { bg: "bg-error/10", text: "text-error", label: "ملغي" },
      RETURNED: { bg: "bg-amber-100", text: "text-amber-700", label: "مسترجع" },
    };

    const colors = statusColors[status] || statusColors.PENDING;

    return (
      <span
        className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1`}
      >
        <span className="w-2 h-2 rounded-full bg-current"></span>
        {colors.label}
      </span>
    );
  };

  const isSearchingOrUpdating =
    shipmentsLoading || branchesLoading || pickupsLoading;

  const handleResetFilters = () => {
    setShipmentIdSearch("");
    setPickupFilter("");
    setBranchFilter("");
    setStatusFilter("");
    setDateFilter("");
    setPage(0);
  };

  const statusOptions: { value: string; label: string }[] = [
    { value: "PENDING", label: "في الانتظار" },
    { value: "IN_TRANSIT", label: "قيد التوصيل" },
    { value: "DELIVERED", label: "تم التسليم" },
    { value: "CANCELLED", label: "ملغي" },
    { value: "RETURNED", label: "مسترجع" },
  ];

  return (
    <main className="flex-1 p-6 lg:p-10 flex flex-col gap-8">
      {/* Page Header */}
      <Header
        title="إدارة الشحنات"
        subtitle="إنشاء وتتبع وإدارة حالات الشحنات"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setCreateForm({ pickupRequestId: "", branchId: "" });
            }}
          >
            {showCreateForm ? "إلغاء" : "+ شحنة جديدة"}
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 shadow-sm border border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary-fixed rounded-lg text-primary">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="font-headline-xl text-headline-xl text-primary">
              {totalCount || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              إجمالي الشحنات
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary-fixed rounded-lg text-secondary">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 18h2v-6h-2v6zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4-8c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="font-headline-xl text-headline-xl text-primary">
              {shipments?.filter((s) => s.status === ShipmentStatus.PENDING).length || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              في الانتظار
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="font-headline-xl text-headline-xl text-primary">
              {shipments?.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              قيد التوصيل
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="font-headline-xl text-headline-xl text-primary">
              {shipments?.filter((s) => s.status === ShipmentStatus.DELIVERED).length || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              تم التسليم
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md text-on-background mb-1">
            تصفية النتائج
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            عدد الشحنات: {totalCount || 0}
          </p>
        </div>

        <div className="mb-6 space-y-4 p-4 bg-surface-container-low rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Input
                label="رقم الشحنة"
                type="text"
                placeholder="#SH-12345"
                value={shipmentIdSearch}
                onChange={(e) => setShipmentIdSearch(e.target.value)}
              />
            </div>

            <div>
              <Select
                label="طلب البيك آب"
                value={pickupFilter}
                onChange={(e) => {
                  setPickupFilter(e.target.value);
                  setPage(0);
                }}
                options={[
                  { value: "", label: "الكل" },
                  ...pickups.map((p) => ({ value: p.id, label: `${p.code} - ${p.merchantName}` })),
                ]}
              />
            </div>

            <div>
              <Select
                label="الفرع"
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setPage(0);
                }}
                options={[
                  { value: "", label: "الكل" },
                  ...branches.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
            </div>

            <div>
              <Select
                label="حالة الشحنة"
                value={statusFilter || ""}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ShipmentStatus | "");
                  setPage(0);
                }}
                options={[
                  { value: "", label: "الكل" },
                  ...statusOptions,
                ]}
              />
            </div>

            <div>
              <Input
                label="النطاق الزمني"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              إعادة تعيين
            </Button>
            <Button variant="primary" size="sm" onClick={() => setPage(0)}>
              تطبيق الفلاتر
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Shipment Form */}
      {showCreateForm && (
        <Card className="bg-surface-container-low border-2 border-secondary-container/20">
          <h3 className="font-headline-md text-headline-md text-on-background mb-6">
            إنشاء شحنة جديدة
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="طلب البيك آب"
              value={createForm.pickupRequestId}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  pickupRequestId: e.target.value,
                })
              }
              options={[
                { value: "", label: "اختر طلب البيك آب" },
                ...pickups.map((p) => ({ value: p.id, label: `${p.code} - ${p.merchantName}` })),
              ]}
              required
            />

            <Select
              label="الفرع"
              value={createForm.branchId}
              onChange={(e) =>
                setCreateForm({ ...createForm, branchId: e.target.value })
              }
              options={[
                { value: "", label: "اختر الفرع" },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateShipment}
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الشحنة"}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setShowCreateForm(false);
                setCreateForm({ pickupRequestId: "", branchId: "" });
              }}
            >
              إلغاء
            </Button>
          </div>
        </Card>
      )}

      {/* Shipments Table */}
      <Card>
        {/* Loading State */}
        {isSearchingOrUpdating && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {(shipmentsError || searchError) && !isSearchingOrUpdating && (
          <div className="p-4 bg-error/10 border border-error rounded-lg mb-4">
            <p className="text-error text-body-md">
              خطأ في تحميل الشحنات. يرجى المحاولة مرة أخرى.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isSearchingOrUpdating &&
          shipments.length === 0 &&
          !shipmentsError &&
          !searchError && (
            <div className="text-center py-12">
              <p className="text-on-surface-variant text-body-md mb-4">
                لا توجد شحنات حالياً
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowCreateForm(true)}
              >
                إنشاء شحنة الآن
              </Button>
            </div>
          )}

        {/* Shipments Table */}
        {!isSearchingOrUpdating && shipments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    رقم الشحنة
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    طلب البيك آب
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    الفرع
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    المندوب
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    الحالة
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    className="border-b border-surface-variant hover:bg-surface-container-low transition"
                  >
                    <td className="p-4 font-bold text-primary">
                      #{shipment.id.padStart(5, "0")}
                    </td>
                    <td className="p-4">
                      <span className="text-body-sm">
                        {shipment.pickupRequestCode || "غير محدد"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-body-sm">
                        {shipment.branchName || "غير محدد"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-body-sm">
                        {shipment.courierName || "غير محدد"}
                      </span>
                    </td>
                    <td className="p-4">
                      {editingId === shipment.id ? (
                        <Select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              status: e.target.value as ShipmentStatus,
                            })
                          }
                          options={statusOptions}
                        />
                      ) : (
                        getStatusBadge(shipment.status as ShipmentStatus)
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {editingId === shipment.id ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isPending}
                              isLoading={updateMutation.isPending}
                            >
                              حفظ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              إلغاء
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                handleEditClick({
                                  id: shipment.id,
                                  status: shipment.status as ShipmentStatus,
                                })
                              }
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedShipment({
                                  id: shipment.id,
                                  status: shipment.status as ShipmentStatus,
                                  pickupRequestId: shipment.pickupRequestId,
                                  pickupRequestCode: shipment.pickupRequestCode,
                                  branchId: shipment.branchId,
                                  branchName: shipment.branchName,
                                  courierId: shipment.courierId,
                                  courierName: shipment.courierName,
                                });
                              }}
                            >
                              تفاصيل
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages && totalPages > 1 && (
              <Pagination
                page={page}
                setPage={setPage}
                size={pageSize}
                setSize={setPageSize}
                totalCount={totalCount || 0}
                isLoading={isSearching}
                totalPages={totalPages}
              />
            )}
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-headline-md text-headline-md text-on-background mb-4">
              تفاصيل الشحنة
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-label-sm text-on-surface-variant">رقم الشحنة</label>
                <p className="text-body-md text-on-background">#{selectedShipment.id.padStart(5, "0")}</p>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant">طلب البيك آب</label>
                <p className="text-body-md text-on-background">
                  {selectedShipment.pickupRequestCode || "غير محدد"}
                </p>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant">الفرع</label>
                <p className="text-body-md text-on-background">
                  {selectedShipment.branchName || "غير محدد"}
                </p>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant">المندوب</label>
                <p className="text-body-md text-on-background">
                  {selectedShipment.courierName || "غير محدد"}
                </p>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant">الحالة</label>
                <div className="mt-1">
                  {getStatusBadge(selectedShipment.status as ShipmentStatus)}
                </div>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant">تاريخ الإنشاء</label>
                <p className="text-body-md text-on-background">
                  {selectedShipment.createdAt
                    ? new Date(selectedShipment.createdAt).toLocaleDateString("ar-EG")
                    : "غير محدد"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setSelectedShipment(null);
                }}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
