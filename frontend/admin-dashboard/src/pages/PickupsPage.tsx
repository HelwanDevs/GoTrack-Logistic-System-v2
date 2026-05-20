import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Pagination } from "@/components/Pagination";
import {
  usePickupsQuery,
  useSearchPickupsQuery,
  useCreatePickupMutation,
  useUpdatePickupMutation,
  useAssignCourierMutation,
  type PickupRequestDTO,
  type PickupFilter,
  type PickupPageResponse,
  PickupStatus,
} from "@/features/pickups";
import { useProfilesQuery, type ProfileResponseDTO } from "@/features/profiles";

import { useBranchesQuery, type BranchDTO } from "@/features/branches";
import { ProfileType } from "@/types/enums";

interface Pickup {
  id: string;
  MERCHANTId: string;
  merchantName: string;
  branchId: string;
  branchName: string;
  courierProfileId?: string;
  courierName?: string;
  status: PickupStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface EditingPickup {
  id: string;
  MERCHANTId: string;
  branchId: string;
  status: PickupStatus;
}

interface CreatePickupForm {
  MERCHANTId: string;
  branchId: string;
}
export const PickupsPage = () => {
  // ── UI State ──
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
  const [assigningCourier, setAssigningCourier] = useState<Pickup | null>(null);
  const [courierId, setCourierId] = useState<string>("");

  // ── Edit Form State ──
  const [editForm, setEditForm] = useState<EditingPickup>({
    id: "",
    MERCHANTId: "",
    branchId: "",
    status: PickupStatus.PENDING,
  });

  // ── Pagination ──
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // ── Filters ──
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [merchantSearch, setMerchantSearch] = useState("");
  const [courierFilter, setCourierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PickupStatus | "">("");
  const [dateFilter, setDateFilter] = useState("");

  // ── Create Form State ──
  const [createForm, setCreateForm] = useState<CreatePickupForm>({
    MERCHANTId: "",
    branchId: "",
  });

  // ── API Hooks ──
  const {
    data: pickupsData,
    isLoading: pickupsLoading,
    error: pickupsError,
  } = usePickupsQuery(page, pageSize);

  const {
    data: searchData,
    isLoading: isSearching,
    error: searchError,
  } = useSearchPickupsQuery({
    status: statusFilter || undefined,
    MERCHANTId: merchantSearch ? Number(merchantSearch) : undefined,
    courierProfileId: courierFilter ? Number(courierFilter) : undefined,
    branchId: undefined,
    page: 0,
    size: 50,
  });

  const createMutation = useCreatePickupMutation();
  const updateMutation = useUpdatePickupMutation();
  const assignCourierMutation = useAssignCourierMutation();

  // ── Fetch Merchants, Couriers, Branches ──
  const { data: merchantsData, isLoading: merchantsLoading } = useProfilesQuery(
    {
      page: 0,
      size: 100,
      sortBy: "fullName",
      type: ProfileType.MERCHANT,
    },
  );

  const { data: couriersData, isLoading: couriersLoading } = useProfilesQuery({
    page: 0,
    size: 100,
    sortBy: "fullName",
    type: ProfileType.COURIER,
  });

  const { data: branchesData, isLoading: branchesLoading } = useBranchesQuery({
    page: 0,
    size: 100,
  });

  // ── Derived Data ──
  const isSearchActive = Boolean(
    orderIdSearch ||
    merchantSearch ||
    courierFilter ||
    statusFilter ||
    dateFilter,
  );

  const pickups =
    (isSearchActive ? searchData?.content : pickupsData?.content)?.map(
      (pickup: PickupRequestDTO) => ({
        id: String(pickup.id || ""),
        MERCHANTId: String(pickup.MERCHANTId || ""),
        merchantName: getMerchantName(pickup.MERCHANTId),
        branchId: String(pickup.branchId || ""),
        branchName: getBranchName(pickup.branchId),
        courierProfileId: pickup.courierProfileId
          ? String(pickup.courierProfileId)
          : undefined,
        courierName: pickup.courierProfileId
          ? getCourierName(pickup.courierProfileId)
          : undefined,
        status: pickup.status || "PENDING",
        createdAt: pickup.createdAt || new Date().toISOString(),
        updatedAt: pickup.updatedAt || new Date().toISOString(),
      }),
    ) || [];

  const totalCount = isSearchActive
    ? searchData?.totalElements
    : pickupsData?.totalElements;
  const totalPages = isSearchActive
    ? searchData?.totalPages
    : pickupsData?.totalPages;

  const merchants: { id: string; name: string }[] =
    merchantsData?.content?.map((p: ProfileResponseDTO) => ({
      id: String(p.id),
      name: p.fullName,
    })) || [];

  const couriers: { id: string; name: string }[] =
    couriersData?.content?.map((p: ProfileResponseDTO) => ({
      id: String(p.id),
      name: p.fullName,
    })) || [];

  const branches: { id: string; name: string }[] =
    branchesData?.content?.map((b: BranchDTO) => ({
      id: String(b.id),
      name: b.name,
    })) || [];

  const getMerchantName = (merchantId: string | number) => {
    const id = String(merchantId);
    const merchant = merchants.find((m) => m.id === id);
    return merchant?.name || "تاجر";
  };

  const getBranchName = (branchId: string | number) => {
    const id = String(branchId);
    const branch = branches.find((b) => b.id === id);
    return branch?.name || "فرع";
  };

  const getCourierName = (courierId: string | number) => {
    const id = String(courierId);
    const courier = couriers.find((c) => c.id === id);
    return courier?.name;
  };

  // ── Handlers ──
  const handleCreatePickup = async () => {
    const errors: Record<string, string> = {};

    if (!createForm.MERCHANTId) {
      errors.MERCHANTId = "التاجر مطلوب";
    }
    if (!createForm.branchId) {
      errors.branchId = "الفرع مطلوب";
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        MERCHANTId: Number(createForm.MERCHANTId),
        branchId: Number(createForm.branchId),
      } as PickupRequestDTO);

      setCreateForm({ MERCHANTId: "", branchId: "" });
      setShowCreateForm(false);
    } catch (error: any) {
      console.error("Failed to create pickup:", error);
    }
  };

  const handleEditClick = (pickup: Pickup) => {
    setEditingId(pickup.id);
    setEditForm({
      id: pickup.id,
      MERCHANTId: pickup.MERCHANTId,
      branchId: pickup.branchId,
      status: pickup.status,
    });
  };

  const handleSaveEdit = async () => {
    const errors: Record<string, string> = {};

    if (!editForm.MERCHANTId) {
      errors.MERCHANTId = "التاجر مطلوب";
    }
    if (!editForm.branchId) {
      errors.branchId = "الفرع مطلوب";
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: Number(editingId),
          data: {
            MERCHANTId: Number(editForm.MERCHANTId),
            branchId: Number(editForm.branchId),
            status: editForm.status,
          } as PickupRequestDTO,
        });

        setEditingId(null);
        setEditForm({
          id: "",
          MERCHANTId: "",
          branchId: "",
          status: PickupStatus.PENDING,
        });
      }
    } catch (error: any) {
      console.error("Failed to update pickup:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      id: "",
      MERCHANTId: "",
      branchId: "",
      status: PickupStatus.PENDING,
    });
  };

  const handleAssignCourier = async (pickupId: string) => {
    try {
      await assignCourierMutation.mutateAsync({
        id: Number(pickupId),
        courierId: Number(courierId),
      });

      setAssigningCourier(null);
      setCourierId("");
    } catch (error: any) {
      console.error("Failed to assign courier:", error);
    }
  };

  const handleUpdateStatus = async (
    pickupId: string,
    newStatus: PickupStatus,
  ) => {
    try {
      await updateMutation.mutateAsync({
        id: Number(pickupId),
        data: {
          status: newStatus,
        } as PickupRequestDTO,
      });
    } catch (error: any) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusBadge = (status: PickupStatus) => {
    const statusColors: Record<
      PickupStatus,
      { bg: string; text: string; label: string }
    > = {
      PENDING: {
        bg: "bg-secondary-fixed",
        text: "text-on-secondary-container",
        label: "بانتظار القبول",
      },
      ASSIGNED: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "تم تعيين مندوب",
      },
      COMPLETED: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "مكتمل",
      },
      CANCELLED: { bg: "bg-error/10", text: "text-error", label: "ملغي" },
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
    pickupsLoading || branchesLoading || couriersLoading || merchantsLoading;

  const handleResetFilters = () => {
    setOrderIdSearch("");
    setMerchantSearch("");
    setCourierFilter("");
    setStatusFilter("");
    setDateFilter("");
    setPage(0);
  };

  const statusOptions: { value: string; label: string }[] = [
    { value: "PENDING", label: "بانتظار القبول" },
    { value: "ASSIGNED", label: "تم تعيين مندوب" },
    { value: "COMPLETED", label: "مكتمل" },
    { value: "CANCELLED", label: "ملغي" },
  ];

  return (
    <main className="flex-1 p-6 lg:p-10 flex flex-col gap-8">
      {/* Page Header */}
      <Header
        title="إدارة طلبات البيك آب"
        subtitle="إنشاء وتحديث وتعيين مندوبي جمع الطلبات"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setCreateForm({ MERCHANTId: "", branchId: "" });
            }}
          >
            {showCreateForm ? "إلغاء" : "+ طلب بيك آب جديد"}
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
              إجمالي الطلبات
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
              {pickups?.filter((p) => p.status === "PENDING").length || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              بانتظار القبول
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
              {pickups?.filter((p) => p.status === "ASSIGNED").length || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              قيد التنفيذ
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
              {pickups?.filter((p) => p.status === "COMPLETED").length || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              مكتملة
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
            عدد الطلبات: {totalCount || 0}
          </p>
        </div>

        <div className="mb-6 space-y-4 p-4 bg-surface-container-low rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Input
                label="رقم الطلب"
                type="text"
                placeholder="#PK-12345"
                value={orderIdSearch}
                onChange={(e) => setOrderIdSearch(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="هوية التاجر"
                type="text"
                placeholder="اسم أو معرف التاجر"
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
              />
            </div>

            <div>
              <Select
                label="المندوب"
                value={courierFilter}
                onChange={(e) => {
                  setCourierFilter(e.target.value);
                  setPage(0);
                }}
                options={[
                  { value: "", label: "الكل" },
                  ...couriers.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>

            <div>
              <Select
                label="حالة الطلب"
                value={statusFilter || ""}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PickupStatus | "");
                  setPage(0);
                }}
                options={[
                  { value: "", label: "الكل" },
                  { value: "PENDING", label: "بانتظار القبول" },
                  { value: "ASSIGNED", label: "تم تعيين مندوب" },
                  { value: "COMPLETED", label: "مكتمل" },
                  { value: "CANCELLED", label: "ملغي" },
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

      {/* Create Pickup Form */}
      {showCreateForm && (
        <Card className="bg-surface-container-low border-2 border-secondary-container/20">
          <h3 className="font-headline-md text-headline-md text-on-background mb-6">
            إنشاء طلب بيك آب جديد
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="التاجر"
              value={createForm.MERCHANTId}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  MERCHANTId: e.target.value,
                })
              }
              options={[
                { value: "", label: "اختر التاجر" },
                ...merchants.map((m) => ({ value: m.id, label: m.name })),
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
              onClick={handleCreatePickup}
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الطلب"}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setShowCreateForm(false);
                setCreateForm({ MERCHANTId: "", branchId: "" });
              }}
            >
              إلغاء
            </Button>
          </div>
        </Card>
      )}

      {/* Pickups Table */}
      <Card>
        {/* Loading State */}
        {isSearchingOrUpdating && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {(pickupsError || searchError) && !isSearchingOrUpdating && (
          <div className="p-4 bg-error/10 border border-error rounded-lg mb-4">
            <p className="text-error text-body-md">
              خطأ في تحميل طلبات البيك آب. يرجى المحاولة مرة أخرى.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isSearchingOrUpdating &&
          pickups.length === 0 &&
          !pickupsError &&
          !searchError && (
            <div className="text-center py-12">
              <p className="text-on-surface-variant text-body-md mb-4">
                لا توجد طلبات بيك آب حالياً
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowCreateForm(true)}
              >
                إنشاء طلب الآن
              </Button>
            </div>
          )}

        {/* Pickups Table */}
        {!isSearchingOrUpdating && pickups.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    رقم الطلب
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    التاجر
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    المندوب
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    الفرع
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
                {pickups.map((pickup) => (
                  <tr
                    key={pickup.id}
                    className="border-b border-surface-variant hover:bg-surface-container-low transition"
                  >
                    <td className="p-4 font-bold text-primary">
                      #{pickup.id.padStart(5, "0")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {editingId === pickup.id ? (
                          <Select
                            value={editForm.MERCHANTId}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                MERCHANTId: e.target.value,
                              })
                            }
                            options={[
                              { value: "", label: "اختر التاجر" },
                              ...merchants.map((m) => ({
                                value: m.id,
                                label: m.name,
                              })),
                            ]}
                          />
                        ) : (
                          <span className="text-body-sm">
                            {getMerchantName(pickup.MERCHANTId)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {pickup.courierName || (
                        <span className="text-on-surface-variant text-sm italic">
                          لم يتم التعيين
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === pickup.id ? (
                        <Select
                          value={editForm.branchId}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              branchId: e.target.value,
                            })
                          }
                          options={[
                            { value: "", label: "اختر الفرع" },
                            ...branches.map((b) => ({
                              value: b.id,
                              label: b.name,
                            })),
                          ]}
                        />
                      ) : (
                        <span className="text-body-sm">
                          {getBranchName(pickup.branchId)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === pickup.id ? (
                        <Select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              status: e.target.value as PickupStatus,
                            })
                          }
                          options={statusOptions}
                        />
                      ) : (
                        getStatusBadge(pickup.status as PickupStatus)
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {editingId === pickup.id ? (
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
                                  id: pickup.id,
                                  MERCHANTId: pickup.MERCHANTId,
                                  branchId: pickup.branchId,
                                  status: pickup.status as PickupStatus,
                                  branchName: pickup.branchName,
                                  courierName: pickup.courierName,
                                  merchantName: pickup.merchantName,
                                })
                              }
                            >
                              تعديل
                            </Button>
                            {!pickup.courierProfileId &&
                              pickup.status === PickupStatus.PENDING && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setAssigningCourier({
                                      id: pickup.id,
                                      MERCHANTId:
                                        pickup.MERCHANTId,
                                      branchId: pickup.branchId,
                                      status: pickup.status as PickupStatus,
                                      branchName: pickup.branchName,
                                      courierName: pickup.courierName,
                                      merchantName: pickup.merchantName,
                                    });
                                    setCourierId("");
                                  }}
                                >
                                  تعيين مندوب
                                </Button>
                              )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPickup({
                                  id: pickup.id,
                                  MERCHANTId: pickup.MERCHANTId,
                                  branchId: pickup.branchId,
                                  status: pickup.status as PickupStatus,
                                  branchName: pickup.branchName,
                                  courierName: pickup.courierName,
                                  merchantName: pickup.merchantName,
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

      {/* Assign Courier Modal */}
      {assigningCourier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-headline-md text-headline-md text-on-background mb-4">
              تعيين مندوب
            </h3>

            <Select
              label="اختر المندوب"
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
              options={[
                { value: "", label: "اختر المندوب" },
                ...couriers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleAssignCourier(assigningCourier.id)}
                disabled={!courierId || assignCourierMutation.isPending}
                isLoading={assignCourierMutation.isPending}
              >
                {assignCourierMutation.isPending
                  ? "جاري التعيين..."
                  : "تأكيد التعيين"}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setAssigningCourier(null);
                  setCourierId("");
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedPickup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="font-headline-md text-headline-md text-on-background mb-4">
              تفاصيل طلب البيك آب
            </h3>

            <div className="space-y-3">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  رقم الطلب
                </label>
                <p className="text-body-md text-on-surface font-bold">
                  #{selectedPickup.id.padStart(5, "0")}
                </p>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  التاجر
                </label>
                <p className="text-body-md text-on-surface">
                  {getMerchantName(selectedPickup.MERCHANTId)}
                </p>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  الفرع
                </label>
                <p className="text-body-md text-on-surface">
                  {getBranchName(selectedPickup.branchId)}
                </p>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  المندوب
                </label>
                <p className="text-body-md text-on-surface">
                  {selectedPickup.courierName || "لم يتم التعيين"}
                </p>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  الحالة
                </label>
                <div className="mt-1">
                  {getStatusBadge(selectedPickup.status)}
                </div>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  تاريخ الإنشاء
                </label>
                <p className="text-body-md text-on-surface">
                  {new Date(
                    selectedPickup.createdAt || new Date(),
                  ).toLocaleDateString("ar-SA")}
                </p>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  تاريخ التعديل
                </label>
                <p className="text-body-md text-on-surface">
                  {new Date(
                    selectedPickup.updatedAt || new Date(),
                  ).toLocaleDateString("ar-SA")}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedPickup(null)}
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
