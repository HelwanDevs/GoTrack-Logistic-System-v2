import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import {
  useProfileDetailQuery,
  useUpdateProfileMutation,
  type ProfileResponseDTO,
  type UpdateProfileRequest,
} from "@/features/profiles";
import { ProfileType, ProfileStatus } from "@/types/enums";
import {
  useMyShipmentsQuery,
  useSearchShipmentsQuery,
  type ShipmentDTO,
} from "@/features/shipments";
import { ShipmentStatus } from "@/features/shipments/types";
import {
  usePickupsQuery,
  useSearchPickupsQuery,
  PickupStatus,
  type PickupRequestDTO,
} from "@/features/pickups";
import {
  useProductsByMerchantQuery,
  type ProductDTO,
} from "@/features/inventory";
import { useWalletsSearchQuery, type WalletDTO } from "@/features/wallets";
import { useBranchesQuery, type BranchDTO } from "@/features/branches";

interface ProfileWithDetails extends ProfileResponseDTO {
  account?: {
    id: string;
    email: string;
    role: string;
  };
}

export const ProfileDetailPage = () => {
  const { profileId } = useParams({ from: "/dashboard/_layout/profile/$profileId" });
  const navigate = useNavigate();

  // ── UI State ──
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // ── Forms ──
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({});
  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    type: "CREDIT",
    description: "",
  });

  // ── Pagination for different sections ──
  const [shipmentsPage, setShipmentsPage] = useState(0);
  const [pickupsPage, setPickupsPage] = useState(0);
  const [productsPage, setProductsPage] = useState(0);
  const pageSize = 10;

  // ── API Hooks ──
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfileDetailQuery(Number(profileId));

  const updateMutation = useUpdateProfileMutation();

  // ── Related Data Hooks ──
  const { data: shipmentsData, isLoading: shipmentsLoading } =
    useSearchShipmentsQuery({
      page: shipmentsPage,
      size: pageSize,
    });

  const { data: pickupsData, isLoading: pickupsLoading } =
    useSearchPickupsQuery({
      MERCHANTId: Number(profileId),
      page: pickupsPage,
      size: pageSize,
    });

  const { data: productsData, isLoading: productsLoading } =
    useProductsByMerchantQuery(Number(profileId), productsPage, pageSize);

  const { data: walletData, isLoading: walletLoading } = useWalletsSearchQuery(
    Number(profileId),
  );

  const { data: branchesData, isLoading: branchesLoading } = useBranchesQuery({
    page: 0,
    size: 100,
  });

  const shipments = shipmentsData?.content || [];
  const pickups = pickupsData?.content || [];
  const products = productsData?.data?.content || [];
  const wallet = walletData?.content?.[0];
  const branches = branchesData?.content || [];

  // ── Handlers ──
  const handleUpdateProfile = async () => {
    try {
      if (profile) {
        await updateMutation.mutateAsync({
          id: profile.id,
          data: editForm,
        });
        setShowEditForm(false);
        setEditForm({});
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleTransaction = async () => {
    // This would integrate with a transaction API
    console.log("Transaction:", transactionForm);
    setShowTransactionModal(false);
    setTransactionForm({ amount: "", type: "CREDIT", description: "" });
  };

  const getStatusBadge = (status: ProfileStatus | string) => {
    const statusColors: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      [ProfileStatus.ACTIVE]: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "نشط",
      },
      [ProfileStatus.INACTIVE]: {
        bg: "bg-error/10",
        text: "text-error",
        label: "غير نشط",
      },
      [ShipmentStatus.PENDING]: {
        bg: "bg-secondary-fixed",
        text: "text-on-secondary-container",
        label: "في الانتظار",
      },
      [ShipmentStatus.IN_TRANSIT]: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "قيد التوصيل",
      },
      [ShipmentStatus.DELIVERED]: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "تم التسليم",
      },
      [PickupStatus.ASSIGNED]: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "تم تعيين مندوب",
      },
      [PickupStatus.COMPLETED]: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "مكتمل",
      },
    };

    const colors =
      statusColors[status as string] || statusColors[ProfileStatus.ACTIVE];
    if (!colors) return null;

    return (
      <span
        className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1`}
      >
        <span className="w-2 h-2 rounded-full bg-current"></span>
        {colors.label}
      </span>
    );
  };

  const getProfileTypeLabel = (type: ProfileType) => {
    const labels = {
      [ProfileType.MERCHANT]: "تاجر",
      [ProfileType.COURIER]: "مندوب توصيل",
      [ProfileType.EMPLOYEE]: "موظف",
      [ProfileType.ADMIN]: "مدير النظام",
    };
    return labels[type] || type;
  };

  // ── Loading State ──
  if (profileLoading) {
    return (
      <main className="flex-1 p-6 lg:p-10 flex justify-center items-center">
        <LoadingSpinner />
      </main>
    );
  }

  // ── Error State ──
  if (profileError || !profile) {
    return (
      <main className="flex-1 p-6 lg:p-10">
        <div className="p-4 bg-error/10 border border-error rounded-lg">
          <p className="text-error text-body-md">
            خطأ في تحميل بيانات الملف الشخصي. يرجى المحاولة مرة أخرى.
          </p>
        </div>
      </main>
    );
  }

  // ── Render different layouts based on profile type ──
  const renderProfileContent = () => {
    switch (profile.type) {
      case ProfileType.MERCHANT:
        return renderMerchantProfile();
      case ProfileType.COURIER:
        return renderCourierProfile();
      case ProfileType.EMPLOYEE:
        return renderEmployeeProfile();
      case ProfileType.ADMIN:
        return renderAdminProfile();
      default:
        return renderDefaultProfile();
    }
  };

  const renderMerchantProfile = () => (
    <div className="space-y-8">
      {/* Merchant Info Card */}
      <Card>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-2">
              معلومات التاجر
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              {getProfileTypeLabel(profile.type)} -{" "}
              {getStatusBadge(profile.status)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEditForm(true)}
            >
              تحديث المعلومات
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTransactionModal(true)}
            >
              إجراء معاملة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-label-sm text-on-surface-variant">
              الاسم الكامل
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.fullName}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              رقم الهاتف
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.phoneNumber}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              الفرع
            </label>
            <p className="text-body-md text-on-background mt-1">
              {branches.find((b) => b.id === profile.branchId)?.name ||
                "غير محدد"}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              الحساب
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.accountId ? `#${profile.accountId}` : "غير مرتبط"}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              تاريخ الإنشاء
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("ar-EG")
                : "غير محدد"}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              رصيد المحفظة
            </label>
            <p className="text-body-md text-on-background mt-1 font-bold text-primary">
              {wallet?.balance || 0} جنية
            </p>
          </div>
        </div>
      </Card>

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
              {shipments.length}
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
              {pickups.length}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              طلبات البيك آب
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="font-headline-xl text-headline-xl text-primary">
              {products.length}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              المنتجات
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.81.45 1.61 1.67 1.61 1.16 0 1.6-.64 1.6-1.46 0-.84-.68-1.22-2.34-1.68-1.67-.46-3.36-1.11-3.36-3.18 0-1.86 1.39-2.96 3.11-3.32V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.63-1.63-1.63-1.01 0-1.46.54-1.46 1.34 0 .88.65 1.22 2.3 1.67 1.66.45 3.4 1.06 3.4 3.23 0 1.87-1.41 2.97-3.2 3.14z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="font-headline-xl text-headline-xl text-primary">
              {wallet?.balance || 0}
            </div>
            <div className="font-label-md text-label-md text-on-surface-variant">
              رصيد المحفظة (جنية)
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant">
        <nav className="flex space-x-8">
          {[
            { id: "info", label: "معلومات أساسية" },
            { id: "shipments", label: "الشحنات" },
            { id: "pickups", label: "طلبات البيك آب" },
            { id: "products", label: "المنتجات" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "info" && (
          <Card>
            <h3 className="font-headline-md text-headline-md text-on-background mb-4">
              معلومات الحساب
            </h3>
            {profile.accountId ? (
              <div className="space-y-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant">
                    معرف الحساب
                  </label>
                  <p className="text-body-md text-on-background mt-1">
                    #{profile.accountId}
                  </p>
                </div>
                {/* Additional account info would go here */}
              </div>
            ) : (
              <p className="text-on-surface-variant">لا يوجد حساب مرتبط</p>
            )}
          </Card>
        )}

        {activeTab === "shipments" && (
          <Card>
            <h3 className="font-headline-md text-headline-md text-on-background mb-4">
              الشحنات الأخيرة
            </h3>
            {shipmentsLoading ? (
              <LoadingSpinner />
            ) : shipments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                        رقم الشحنة
                      </th>
                      <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                        الحالة
                      </th>
                      <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                        التاريخ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment: ShipmentDTO) => (
                      <tr
                        key={shipment.id}
                        className="border-b border-surface-variant hover:bg-surface-container-low transition"
                      >
                        <td className="p-4 font-bold text-primary">
                          #{String(shipment.id || "").padStart(5, "0")}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(shipment.status || "PENDING")}
                        </td>
                        <td className="p-4 text-body-sm">
                          {shipment.createdAt
                            ? new Date(shipment.createdAt).toLocaleDateString(
                                "ar-EG",
                              )
                            : "غير محدد"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-on-surface-variant text-center py-8">
                لا توجد شحنات
              </p>
            )}
          </Card>
        )}

        {activeTab === "pickups" && (
          <Card>
            <h3 className="font-headline-md text-headline-md text-on-background mb-4">
              طلبات البيك آب الأخيرة
            </h3>
            {pickupsLoading ? (
              <LoadingSpinner />
            ) : pickups.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                        رقم الطلب
                      </th>
                      <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                        الحالة
                      </th>
                      <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                        التاريخ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickups.map((pickup: PickupRequestDTO) => (
                      <tr
                        key={pickup.id}
                        className="border-b border-surface-variant hover:bg-surface-container-low transition"
                      >
                        <td className="p-4 font-bold text-primary">
                          #{String(pickup.id || "").padStart(5, "0")}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(
                            pickup.status || PickupStatus.PENDING,
                          )}
                        </td>
                        <td className="p-4 text-body-sm">
                          {pickup.createdAt
                            ? new Date(pickup.createdAt).toLocaleDateString(
                                "ar-EG",
                              )
                            : "غير محدد"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-on-surface-variant text-center py-8">
                لا توجد طلبات بيك آب
              </p>
            )}
          </Card>
        )}

        {activeTab === "products" && (
          <Card>
            <h3 className="font-headline-md text-headline-md text-on-background mb-4">
              المنتجات
            </h3>
            {productsLoading ? (
              <LoadingSpinner />
            ) : products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                        اسم المنتج
                      </th>
                      <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                        SKU
                      </th>
                      <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                        السعر
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product: any, index: number) => (
                      <tr
                        key={index}
                        className="border-b border-surface-variant hover:bg-surface-container-low transition"
                      >
                        <td className="p-4">{product.name}</td>
                        <td className="p-4">{product.baseSku}</td>
                        <td className="p-4 text-body-sm">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-on-surface-variant text-center py-8">
                لا توجد منتجات
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );

  const renderCourierProfile = () => (
    <div className="space-y-8">
      <Card>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-2">
              معلومات مندوب التوصيل
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              {getProfileTypeLabel(profile.type)} -{" "}
              {getStatusBadge(profile.status)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEditForm(true)}
          >
            تحديث المعلومات
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-label-sm text-on-surface-variant">
              الاسم الكامل
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.fullName}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              رقم الهاتف
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.phoneNumber}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              الفرع
            </label>
            <p className="text-body-md text-on-background mt-1">
              {branches.find((b) => b.id === profile.branchId)?.name ||
                "غير محدد"}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              رصيد المحفظة
            </label>
            <p className="text-body-md text-on-background mt-1 font-bold text-primary">
              {wallet?.balance || 0} جنية
            </p>
          </div>
        </div>
      </Card>

      {/* Assigned Pickups */}
      <Card>
        <h3 className="font-headline-md text-headline-md text-on-background mb-4">
          الطلبات المعينة
        </h3>
        {pickupsLoading ? (
          <LoadingSpinner />
        ) : pickups.length > 0 ? (
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
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {pickups.map((pickup: PickupRequestDTO) => (
                  <tr
                    key={pickup.id}
                    className="border-b border-surface-variant hover:bg-surface-container-low transition"
                  >
                    <td className="p-4 font-bold text-primary">
                      #{String(pickup.id || "").padStart(5, "0")}
                    </td>
                    <td className="p-4">تاجر #{pickup.MERCHANTId}</td>
                    <td className="p-4">
                      {getStatusBadge(pickup.status || PickupStatus.PENDING)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-on-surface-variant text-center py-8">
            لا توجد طلبات معينة
          </p>
        )}
      </Card>
    </div>
  );

  const renderEmployeeProfile = () => (
    <div className="space-y-8">
      <Card>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-2">
              معلومات الموظف
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              {getProfileTypeLabel(profile.type)} -{" "}
              {getStatusBadge(profile.status)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEditForm(true)}
          >
            تحديث المعلومات
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-label-sm text-on-surface-variant">
              الاسم الكامل
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.fullName}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              رقم الهاتف
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.phoneNumber}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              الفرع
            </label>
            <p className="text-body-md text-on-background mt-1">
              {branches.find((b) => b.id === profile.branchId)?.name ||
                "غير محدد"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAdminProfile = () => (
    <div className="space-y-8">
      <Card>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-2">
              معلومات مدير النظام
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              {getProfileTypeLabel(profile.type)} -{" "}
              {getStatusBadge(profile.status)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEditForm(true)}
          >
            تحديث المعلومات
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-label-sm text-on-surface-variant">
              الاسم الكامل
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.fullName}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              رقم الهاتف
            </label>
            <p className="text-body-md text-on-background mt-1">
              {profile.phoneNumber}
            </p>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">
              صلاحيات النظام
            </label>
            <p className="text-body-md text-on-background mt-1">كاملة</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderDefaultProfile = () => (
    <Card>
      <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">
        معلومات الملف الشخصي
      </h2>
      <p className="text-on-surface-variant">نوع الملف الشخصي غير معروف</p>
    </Card>
  );

  return (
    <main className="flex-1 p-6 lg:p-10">
      {/* Page Header */}
      <Header
        title={`ملف ${profile.fullName}`}
        subtitle={getProfileTypeLabel(profile.type)}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/dashboard/profiles" })}
          >
            العودة للقائمة
          </Button>
        }
      />

      {/* Profile Content */}
      {renderProfileContent()}

      {/* Edit Profile Modal */}
      {showEditForm && (
        <Modal
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          title="تحديث المعلومات الشخصية"
        >
          <div className="space-y-4">
            <div>
              <Input
                label="الاسم الكامل"
                value={editForm.fullName || profile.fullName}
                onChange={(e) =>
                  setEditForm({ ...editForm, fullName: e.target.value })
                }
              />
            </div>
            <div>
              <Input
                label="رقم الهاتف"
                value={editForm.phoneNumber || profile.phoneNumber}
                onChange={(e) =>
                  setEditForm({ ...editForm, phoneNumber: e.target.value })
                }
              />
            </div>
            <div>
              <Select
                label="الحالة"
                value={editForm.status || profile.status}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value as ProfileStatus,
                  })
                }
                options={[
                  { value: ProfileStatus.ACTIVE, label: "نشط" },
                  { value: ProfileStatus.INACTIVE, label: "غير نشط" },
                ]}
              />
            </div>
            <div>
              <Select
                label="الفرع"
                value={String(editForm.branchId || profile.branchId || "")}
                onChange={(e) =>
                  setEditForm({ ...editForm, branchId: Number(e.target.value) })
                }
                options={[
                  { value: "", label: "اختر الفرع" },
                  ...branches.map((b) => ({
                    value: String(b.id),
                    label: b.name,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="primary"
              onClick={handleUpdateProfile}
              disabled={updateMutation.isPending}
              isLoading={updateMutation.isPending}
            >
              {updateMutation.isPending ? "جاري التحديث..." : "تحديث"}
            </Button>
            <Button variant="outline" onClick={() => setShowEditForm(false)}>
              إلغاء
            </Button>
          </div>
        </Modal>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          title="إجراء معاملة مالية"
        >
          <div className="space-y-4">
            <div>
              <Input
                label="المبلغ"
                type="number"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    amount: e.target.value,
                  })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Select
                label="نوع المعاملة"
                value={transactionForm.type}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    type: e.target.value,
                  })
                }
                options={[
                  { value: "CREDIT", label: "إيداع" },
                  { value: "DEBIT", label: "سحب" },
                ]}
              />
            </div>
            <div>
              <Input
                label="الوصف"
                value={transactionForm.description}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    description: e.target.value,
                  })
                }
                placeholder="وصف المعاملة"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="primary"
              onClick={handleTransaction}
              disabled={!transactionForm.amount}
            >
              تنفيذ المعاملة
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTransactionModal(false)}
            >
              إلغاء
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
};
