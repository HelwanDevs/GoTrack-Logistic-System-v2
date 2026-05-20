import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Pagination } from "@/components/Pagination";
import {
  useInventoryItemsQuery,
  useSearchInventoryItemsQuery,
  useReceiveItemsMutation,
  type InventoryItemRequest,
  type InventorySearchParams,
  type InventoryStatus,
} from "@/features/inventory";
import { useBranchesQuery, type BranchDTO } from "@/features/branches";
import { usePickupsQuery, type PickupRequestDTO } from "@/features/pickups";

interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  branchId: number;
  branchName: string;
  uniqueSku: string;
  status: InventoryStatus;
  merchantId: number;
  merchantName: string;
}

interface ReceiveItemsForm {
  productId: number;
  branchId: number;
  pickupRequestId: number;
  uniqueSkus: string[];
}

export const InventoryItemsPage = () => {
  // ── UI State ──
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // ── Pagination ──
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // ── Filters ──
  const [branchFilter, setBranchFilter] = useState<number | undefined>(
    undefined,
  );
  const [skuSearch, setSkuSearch] = useState("");
  const [merchantFilter, setMerchantFilter] = useState<number | undefined>(
    undefined,
  );

  // ── Receive Items Form State ──
  const [receiveForm, setReceiveForm] = useState<ReceiveItemsForm>({
    productId: 0,
    branchId: 0,
    pickupRequestId: 0,
    uniqueSkus: [""],
  });

  // ── API Hooks ──
  const {
    data: itemsData,
    isLoading: itemsLoading,
    error: itemsError,
  } = useInventoryItemsQuery(page, pageSize);

  const {
    data: searchData,
    isLoading: isSearching,
    error: searchError,
  } = useSearchInventoryItemsQuery({
    branchId: branchFilter,
    uniqueSku: skuSearch || undefined,
    MerchantId: merchantFilter,
    page: 0,
    size: 50,
  });

  const receiveMutation = useReceiveItemsMutation();

  // ── Fetch Branches, Pickups ──
  const { data: branchesData, isLoading: branchesLoading } = useBranchesQuery({
    page: 0,
    size: 100,
  });

  const { data: pickupsData, isLoading: pickupsLoading } = usePickupsQuery(
    0,
    50,
  );

  const branches: { id: number; name: string }[] =
    branchesData?.content?.map((b: BranchDTO) => ({
      id: b.id,
      name: b.name,
    })) || [];

  const pickups: { id: number; MERCHANTId: number }[] =
    pickupsData?.content?.map((p: PickupRequestDTO) => ({
      id: p.id || 0,
      MERCHANTId: p.MERCHANTId || 0,
    })) || [];

  // ── Derived Data ──
  const isSearchActive = Boolean(branchFilter || skuSearch || merchantFilter);

  const inventoryItems =
    (isSearchActive
      ? searchData?.data?.content
      : itemsData?.data?.content
    )?.map((item: any) => ({
      ...item,
      merchantId: item.merchantId || item.MerchantId,
      branchName: getBranchName(item.branchId),
      merchantName: getMerchantName(item.merchantId || item.MerchantId),
      productName: getProductName(item.productId),
    })) || [];

  const totalCount = isSearchActive
    ? searchData?.data?.totalElements
    : itemsData?.data?.totalElements;
  const totalPages = isSearchActive
    ? searchData?.data?.totalPages
    : itemsData?.data?.totalPages;

  const getBranchName = (branchId: number) => {
    const branch = branches.find((b) => b.id === branchId);
    return branch?.name || "فرع";
  };

  const getMerchantName = (merchantId: number) => {
    return `تاجر ${merchantId}`;
  };

  const getProductName = (productId: number) => {
    return `منتج ${productId}`;
  };

  // ── Handlers ──
  const handleReceiveItems = async () => {
    const errors: Record<string, string> = {};

    if (!receiveForm.productId) {
      errors.productId = "المنتج مطلوب";
    }
    if (!receiveForm.branchId) {
      errors.branchId = "الفرع مطلوب";
    }
    if (!receiveForm.pickupRequestId) {
      errors.pickupRequestId = "طلب البيك آب مطلوب";
    }
    if (
      !receiveForm.uniqueSkus.length ||
      receiveForm.uniqueSkus.some((sku) => !sku.trim())
    ) {
      errors.uniqueSkus = "يجب إدخال رموز SKU";
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await receiveMutation.mutateAsync({
        productId: receiveForm.productId,
        branchId: receiveForm.branchId,
        pickupRequestId: receiveForm.pickupRequestId,
        uniqueSkus: receiveForm.uniqueSkus.filter((sku) => sku.trim()),
      } as InventoryItemRequest);

      setReceiveForm({
        productId: 0,
        branchId: 0,
        pickupRequestId: 0,
        uniqueSkus: [""],
      });
      setShowReceiveForm(false);
    } catch (error: any) {
      console.error("Failed to receive items:", error);
    }
  };

  const handleAddSkuField = () => {
    setReceiveForm({
      ...receiveForm,
      uniqueSkus: [...receiveForm.uniqueSkus, ""],
    });
  };

  const handleRemoveSkuField = (index: number) => {
    const newSkus = receiveForm.uniqueSkus.filter((_, i) => i !== index);
    setReceiveForm({ ...receiveForm, uniqueSkus: newSkus });
  };

  const handleSkuChange = (index: number, value: string) => {
    const newSkus = [...receiveForm.uniqueSkus];
    newSkus[index] = value;
    setReceiveForm({ ...receiveForm, uniqueSkus: newSkus });
  };

  const getStatusBadge = (status: InventoryStatus) => {
    const statusColors: Record<
      InventoryStatus,
      { bg: string; text: string; label: string }
    > = {
      IN_STOCK: { bg: "bg-green-100", text: "text-green-700", label: "متوفر" },
      RESERVED: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "محجوز",
      },
      SHIPPED: { bg: "bg-blue-100", text: "text-blue-700", label: "مشحن" },
    };

    const colors = statusColors[status] || statusColors.IN_STOCK;

    return (
      <span
        className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1`}
      >
        <span className="w-2 h-2 rounded-full bg-current"></span>
        {colors.label}
      </span>
    );
  };

  const isSearchingOrLoading =
    itemsLoading || branchesLoading || pickupsLoading;

  const handleResetFilters = () => {
    setBranchFilter(undefined);
    setSkuSearch("");
    setMerchantFilter(undefined);
    setPage(0);
  };

  const statusOptions: { value: string; label: string }[] = [
    { value: "IN_STOCK", label: "متوفر" },
    { value: "RESERVED", label: "محجوز" },
    { value: "SHIPPED", label: "مشحن" },
  ];

  return (
    <main className="flex-1 p-6 lg:p-10 flex flex-col gap-8">
      {/* Page Header */}
      <Header
        title="إدارة المخزون"
        subtitle="تتبع وإدارة عناصر المخزون ومستويات المخزون"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowReceiveForm(!showReceiveForm);
              setReceiveForm({
                productId: 0,
                branchId: 0,
                pickupRequestId: 0,
                uniqueSkus: [""],
              });
            }}
          >
            {showReceiveForm ? "إلغاء" : "+ استلام عناصر"}
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-sm border border-outline-variant">
          <div>
            <div className="font-headline-xl text-headline-xl text-primary">
              {totalCount || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              إجمالي عناصر المخزون
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-outline-variant">
          <div>
            <div className="font-headline-xl text-headline-xl text-primary">
              {inventoryItems?.filter((item) => item.status === "IN_STOCK")
                .length || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              متوفر في المخزون
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-outline-variant">
          <div>
            <div className="font-headline-xl text-headline-xl text-primary">
              {branches.length || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              الفروع النشطة
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md text-on-background mb-1">
            تصفية عناصر المخزون
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            عدد العناصر: {totalCount || 0}
          </p>
        </div>

        <div className="mb-6 space-y-4 p-4 bg-surface-container-low rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select
                label="الفرع"
                value={branchFilter ? String(branchFilter) : ""}
                onChange={(e) => {
                  setBranchFilter(
                    e.target.value ? Number(e.target.value) : undefined,
                  );
                  setPage(0);
                }}
                options={[
                  { value: "", label: "الكل" },
                  ...branches.map((b) => ({
                    value: String(b.id),
                    label: b.name,
                  })),
                ]}
              />
            </div>

            <div>
              <Input
                label="البحث برمز SKU"
                type="text"
                placeholder="ابحث برمز SKU..."
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
              />
            </div>

            <div>
              <Select
                label="الحالة"
                value={""}
                onChange={() => {}}
                options={statusOptions}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={handleResetFilters}
              >
                إعادة تعيين الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Receive Items Form */}
      {showReceiveForm && (
        <Card className="bg-surface-container-low border-2 border-secondary-container/20">
          <h3 className="font-headline-md text-headline-md text-on-background mb-6">
            استلام عناصر جديدة
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select
              label="المنتج"
              value={String(receiveForm.productId)}
              onChange={(e) =>
                setReceiveForm({
                  ...receiveForm,
                  productId: Number(e.target.value),
                })
              }
              options={[
                { value: "0", label: "اختر المنتج" },
                ...Array.from({ length: 10 }, (_, i) => ({
                  value: String(i + 1),
                  label: `منتج ${i + 1}`,
                })),
              ]}
            />

            <Select
              label="الفرع"
              value={receiveForm.branchId ? String(receiveForm.branchId) : ""}
              onChange={(e) =>
                setReceiveForm({
                  ...receiveForm,
                  branchId: Number(e.target.value),
                })
              }
              options={[
                { value: "0", label: "اختر الفرع" },
                ...branches.map((b) => ({
                  value: String(b.id),
                  label: b.name,
                })),
              ]}
            />

            <Select
              label="طلب البيك آب"
              value={
                receiveForm.pickupRequestId
                  ? String(receiveForm.pickupRequestId)
                  : ""
              }
              onChange={(e) =>
                setReceiveForm({
                  ...receiveForm,
                  pickupRequestId: Number(e.target.value),
                })
              }
              options={[
                { value: "0", label: "اختر طلب البيك آب" },
                ...pickups
                  .filter((p) => p.id > 0)
                  .map((p) => ({
                    value: String(p.id),
                    label: `طلب #${p.id}`,
                  })),
              ]}
            />
          </div>

          <div className="mb-4">
            <label className="font-label-md text-label-md text-on-surface block mb-2">
              رموز SKU الفريدة
            </label>
            <div className="space-y-2">
              {receiveForm.uniqueSkus.map((sku, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={`SKU ${index + 1}`}
                    value={sku}
                    onChange={(e) => handleSkuChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {index > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveSkuField(index)}
                    >
                      إزالة
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={handleAddSkuField}>
                + إضافة SKU
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleReceiveItems}
              disabled={receiveMutation.isPending}
              isLoading={receiveMutation.isPending}
            >
              {receiveMutation.isPending
                ? "جاري الاستلام..."
                : "استلام العناصر"}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setShowReceiveForm(false);
                setReceiveForm({
                  productId: 0,
                  branchId: 0,
                  pickupRequestId: 0,
                  uniqueSkus: [""],
                });
              }}
            >
              إلغاء
            </Button>
          </div>
        </Card>
      )}

      {/* Inventory Items Table */}
      <Card>
        {/* Loading State */}
        {isSearchingOrLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {(itemsError || searchError) && !isSearchingOrLoading && (
          <div className="p-4 bg-error/10 border border-error rounded-lg mb-4">
            <p className="text-error text-body-md">
              خطأ في تحميل عناصر المخزون. يرجى المحاولة مرة أخرى.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isSearchingOrLoading &&
          inventoryItems.length === 0 &&
          !itemsError &&
          !searchError && (
            <div className="text-center py-12">
              <p className="text-on-surface-variant text-body-md mb-4">
                لا توجد عناصر مخزون حالياً
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowReceiveForm(true)}
              >
                استلام عناصر الآن
              </Button>
            </div>
          )}

        {/* Inventory Items Table */}
        {!isSearchingOrLoading && inventoryItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    المنتج
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    رمز SKU
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
                {inventoryItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-surface-variant hover:bg-surface-container-low transition"
                  >
                    <td className="p-4">
                      <p className="text-body-md text-on-surface font-headline-md">
                        {item.productName}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-label-sm font-label-md bg-secondary-container text-on-primary">
                        {item.uniqueSku}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="text-body-sm">{item.branchName}</span>
                    </td>

                    <td className="p-4">{getStatusBadge(item.status)}</td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          تفاصيل
                        </Button>
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
                isLoading={isSearchingOrLoading}
                totalPages={totalPages}
              />
            )}
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="font-headline-md text-headline-md text-on-background mb-4">
              تفاصيل عنصر المخزون
            </h3>

            <div className="space-y-3">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  المنتج
                </label>
                <p className="text-body-md text-on-surface font-bold">
                  {selectedItem.productName}
                </p>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  رمز SKU
                </label>
                <p className="text-body-md text-on-surface">
                  {selectedItem.uniqueSku}
                </p>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  الفرع
                </label>
                <p className="text-body-md text-on-surface">
                  {selectedItem.branchName}
                </p>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  الحالة
                </label>
                <div className="mt-1">
                  {getStatusBadge(selectedItem.status)}
                </div>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">
                  التاجر
                </label>
                <p className="text-body-md text-on-surface">
                  {selectedItem.merchantName}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedItem(null)}
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
