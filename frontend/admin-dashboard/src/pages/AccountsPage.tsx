import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Checkbox } from "@/components/Checkbox";
import { Modal } from "@/components/Modal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Pagination } from "@/components/Pagination";
import {
  useAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useChangePasswordMutation,
  type Account,
  type CreateAccountRequest,
  type UpdateAccountRequest,
  type ListAccountsParams,
} from "@/features/accounts";
import { UserRole } from "@/types/enums";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useSearchProfilesQuery } from "@/features/profiles";

interface FormData {
  email: string;
  password: string;
  role: UserRole | "";
  profileId: number | null
}

interface EditingAccount {
  id: string;
  email: string;
  password: string;
  role: UserRole | "";
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export const AccountsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Pagination
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Filters
  const [emailSearch, setEmailSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">();
  const [deletedFilter, setDeletedFilter] = useState(false);

  // Fetch accounts from API with pagination and filters
  const queryParams: ListAccountsParams = {
    page,
    size,
    ...(emailSearch && { email: emailSearch }),
    ...(roleFilter && { role: roleFilter as UserRole }),
    ...(deletedFilter && { includeDeleted: deletedFilter }),
  };

  const {
    data: accountsData,
    isLoading,
    error: fetchError,
  } = useAccountsQuery(queryParams);

  const accounts = accountsData?.accounts || [];
  const totalCount = accountsData?.totalCount || 0;
  const totalPages = accountsData?.totalPages || 0;
  const [profileSearchQuery, setProfileSearchQuery] = useState("");

  const createMutation = useCreateAccountMutation();
  const updateMutation = useUpdateAccountMutation();
  const deleteMutation = useDeleteAccountMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const [profilePage, setProfilePage] = useState(0);
  const accountQuery = {
    page: profilePage,
    size: 10,
    name: profileSearchQuery || "",
  };
  const { data: profilesData , refetch: profilesRefetch } = useSearchProfilesQuery({ ...accountQuery });

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordAccountId, setChangePasswordAccountId] = useState<
    string | null
  >(null);
  const [changePasswordAccountEmail, setChangePasswordAccountEmail] =
    useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePasswordErrors, setChangePasswordErrors] = useState<
    Record<string, string>
  >({});

  const [createForm, setCreateForm] = useState<FormData>({
    email: "",
    password: "",
    role: "",
    profileId : null
  });

  const [editForm, setEditForm] = useState<EditingAccount>({
    id: "",
    email: "",
    password: "",
    role: "",
    createdAt: "",
    updatedAt: "",
    deleted: false,
  });

  const roleOptions = [
    { value: UserRole.ADMIN, label: "مسؤول" },
    { value: UserRole.EMPLOYEE, label: "موظف" },
    { value: UserRole.MERCHANT, label: "تاجر" },
  ];

  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!createForm.email) {
      errors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!createForm.password) {
      errors.password = "كلمة المرور مطلوبة";
    } else if (createForm.password.length < 6) {
      errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (!createForm.role) {
      errors.role = "الدور مطلوب";
    }

    if (!createForm.profileId) {
      errors.profileId = "معرف الملف الشخصي مطلوب";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editForm.email) {
      errors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = "البريد الإلكتروني غير صحيح";
    }

    if (editForm.password && editForm.password.length < 6) {
      errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (!editForm.role) {
      errors.role = "الدور مطلوب";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAccount = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateCreateForm()) {
      return;
    }

    try {
      await createMutation.mutateAsync(createForm as CreateAccountRequest);
      setCreateForm({ email: "", password: "", role: ""  , profileId : null});
      setShowCreateForm(false);
      setFormErrors({});
    } catch (error: any) {
      switch (error.status) {
        case 400:
          setFormErrors({
            submit: error.response?.data?.message || "بيانات غير صحيحة",
          });
          break;
        case 409:
          setFormErrors({
            submit: "الحساب موجود بالفعل",
          });
          break;
        default:
          setFormErrors({
            submit: error.message || "فشل إنشاء الحساب. حاول مرة أخرى",
          });
      }
    }
  };

  const handleEditAccount = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // e.preventDefault();

    if (!validateEditForm()) {
      return;
    }

    try {
      const updateData: UpdateAccountRequest = {
        email: editForm.email,
        role: editForm.role as UserRole,
      };

      if (editForm.password) {
        updateData.password = editForm.password;
      }

      await updateMutation.mutateAsync({
        accountId: editForm.id,
        data: updateData,
      });

      setEditingId(null);
      setEditForm({
        id: "",
        email: "",
        password: "",
        role: "",
        createdAt: "",
        updatedAt: "",
        deleted: false,
      });
      setFormErrors({});
    } catch (error: any) {
      setFormErrors({
        submit: error.message || "فشل تحديث الحساب. حاول مرة أخرى",
      });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("هل متأكد من رغبتك في حذف هذا الحساب؟")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(accountId);
    } catch (error: any) {
      alert(error.message || "فشل حذف الحساب. حاول مرة أخرى");
    }
  };

  const handleEditClick = (account: Account) => {
    setEditingId(account.id);
    setEditForm({
      id: account.id,
      email: account.email,
      password: "",
      role: account.role,
      createdAt: account.createdAt ?? "غير معروف",
      updatedAt: account.updatedAt ?? "غير معروف",
      deleted: account.deleted ?? false,
    });
    setFormErrors({});
  };

  const handleOpenChangePasswordModal = (account: Account) => {
    setChangePasswordAccountId(account.id);
    setChangePasswordAccountEmail(account.email);
    setNewPassword("");
    setChangePasswordErrors({});
    setShowChangePasswordModal(true);
  };

  const handleCloseChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setChangePasswordAccountId(null);
    setChangePasswordAccountEmail("");
    setNewPassword("");
    setChangePasswordErrors({});
  };

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};

    if (!newPassword) {
      errors.newPassword = "كلمة المرور الجديدة مطلوبة";
    } else if (newPassword.length < 6) {
      errors.newPassword = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (Object.keys(errors).length > 0) {
      setChangePasswordErrors(errors);
      return;
    }

    if (
      !confirm(
        `هل تأكد من رغبتك في تغيير كلمة المرور للحساب ${changePasswordAccountEmail}؟`,
      )
    ) {
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        accountId: changePasswordAccountId!,
        newPassword,
      });
      handleCloseChangePasswordModal();
      alert("تم تغيير كلمة المرور بنجاح");
    } catch (error: any) {
      switch (error.status) {
        case 403:
          setChangePasswordErrors({
            submit: "ليس لديك صلاحية لتغيير كلمة المرور لهذا الحساب",
          });
          break;
        case 404:
          setChangePasswordErrors({
            submit: "الحساب غير موجود",
          });
          break;
        case 400:
          setChangePasswordErrors({
            submit: "بيانات غير صحيحة",
          });
          break;

        default:
          setChangePasswordErrors({
            submit: "فشل تغيير كلمة المرور. حاول مرة أخرى",
          });
          break;
      }
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      [UserRole.ADMIN]: "مسؤول",
      [UserRole.EMPLOYEE]: "موظف",
      [UserRole.MERCHANT]: "تاجر",
    };
    return roleMap[role];
  };

  return (
    <main className="flex-1 p-6 lg:p-10 flex flex-col gap-8">
      <Header
        title="إدارة الحسابات"
        subtitle="إنشاء وتحديث وحذف حسابات المستخدمين"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if(showCreateForm) {
                profilesRefetch()
              }
              setEditingId(null);
              setCreateForm({ email: "", password: "", role: "" , profileId : null});
              setFormErrors({});
            }}
          >
            {showCreateForm ? "إلغاء" : "+ حساب جديد"}
          </Button>
        }
      />

      {/* Create Account Form */}
      {showCreateForm && (
        <Card className="bg-surface-container-low border-2 border-secondary-container/20">
          <h3 className="font-headline-md text-headline-md text-on-background mb-6">
            إنشاء حساب جديد
          </h3>

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="example@domain.com"
              value={createForm.email}
              onChange={(e) => {
                setCreateForm({
                  ...createForm,
                  email: e.target.value,
                });
                if (formErrors.email) {
                  setFormErrors({ ...formErrors, email: "" });
                }
              }}
              error={formErrors.email}
              required
            />

            <Input
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={createForm.password}
              onChange={(e) => {
                setCreateForm({
                  ...createForm,
                  password: e.target.value,
                });
                if (formErrors.password) {
                  setFormErrors({ ...formErrors, password: "" });
                }
              }}
              error={formErrors.password}
              required
            />

            <Select
              label="الدور"
              value={createForm.role}
              onChange={(e) => {
                setCreateForm({
                  ...createForm,
                  role: (e.target.value as UserRole) || "",
                });
                if (formErrors.role) {
                  setFormErrors({ ...formErrors, role: "" });
                }
              }}
              options={roleOptions}
              error={formErrors.role}
              required
            />


            <SearchableSelect 
              label="الملف الشخصي"
              options={profilesData?.content.filter(e => e.accountId == null).map(profile => ({
                value: profile.id.toString(),
                label: profile.fullName
              })) || []}
              searchQuery={profileSearchQuery}
              setSearchQuery={(value) => {
                setProfileSearchQuery(value)
                setProfilePage(0)
              }}
              onSelect={(option) => {
                setCreateForm({
                  ...createForm,
                  profileId: parseInt(option.value),
                });
              }}
              onClear={() => {
                setCreateForm({
                  ...createForm,
                  profileId: null
                })
              }}
              hasClear
            />
            {formErrors.submit && (
              <div className="p-3 bg-error/10 border border-error rounded-lg">
                <p className="text-error text-body-sm">{formErrors.submit}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={createMutation.isPending}
                isLoading={createMutation.isPending}
              >
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ email: "", password: "", role: "" , profileId: null});
                  setFormErrors({});
                }}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search and Filter Section */}
      <Card>
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md text-on-background mb-1">
            الحسابات
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            عدد الحسابات: {totalCount}
          </p>
        </div>

        <div className="mb-6 space-y-4 p-4 bg-surface-container-low rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="col-span-1 md:col-span-4">
              <Input
                label="البحث حسب البريد الإلكتروني"
                type="text"
                placeholder="ابحث..."
                value={emailSearch}
                onChange={(e) => {
                  setEmailSearch(e.target.value);
                  setPage(0); // Reset to first page on search
                }}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Select
                label="تصفية حسب الدور"
                value={roleFilter || ""}
                onChange={(e) => {
                  setRoleFilter((e.target.value as UserRole) || "");
                  setPage(0); // Reset to first page on filter change
                }}
                options={[
                  { value: "", label: "جميع الأدوار" },
                  { value: UserRole.ADMIN, label: "مسؤول" },
                  { value: UserRole.EMPLOYEE, label: "موظف" },
                  { value: UserRole.MERCHANT, label: "تاجر" },
                ]}
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex items-center">
              <Checkbox
                label="تضمين المحذوف"
                checked={deletedFilter}
                size="3xl"
                onChange={(e) => {
                  setDeletedFilter(e.target.checked);
                  setPage(0); // Reset to first page on filter change
                }}
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex items-end">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => {
                  setEmailSearch("");
                  setRoleFilter("");
                  setPage(0);
                }}
              >
                إعادة تعيين الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Accounts List */}
      <Card>
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {fetchError && !isLoading && (
          <div className="p-4 bg-error/10 border border-error rounded-lg mb-4">
            <p className="text-error text-body-md">
              خطأ في تحميل الحسابات. يرجى المحاولة مرة أخرى.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && accounts.length === 0 && !fetchError && (
          <div className="text-center py-12">
            <p className="text-on-surface-variant text-body-md mb-4">
              لا توجد حسابات حالياً
            </p>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowCreateForm(true)}
            >
              إنشاء حساب الآن
            </Button>
          </div>
        )}

        {/* Accounts Table */}
        {!isLoading && accounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    البريد الإلكتروني
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    الدور
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    تاريخ الإنشاء
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    تاريخ التعديل
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    محذوف
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    تعديل كملة المرور
                  </th>
                  <th className="text-right p-4 text-on-surface-variant font-label-md text-label-md">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-surface-variant hover:bg-surface-container-low transition"
                  >
                    <td className="p-4">
                      {editingId === account.id ? (
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              email: e.target.value,
                            })
                          }
                          className="text-body-sm"
                        />
                      ) : (
                        <p className="text-body-md text-on-surface">
                          {account.email}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      {editingId === account.id ? (
                        <Select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              role: (e.target.value as UserRole) || "",
                            })
                          }
                          options={roleOptions}
                        />
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-label-md font-label-md ${
                            account.role === UserRole.ADMIN
                              ? "bg-primary text-on-primary"
                              : account.role === UserRole.EMPLOYEE
                                ? "bg-secondary-container text-on-primary"
                                : "bg-surface-variant text-on-surface"
                          }`}
                        >
                          {getRoleLabel(account.role)}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-body-sm text-on-surface-variant">
                      {new Date(
                        account.createdAt ?? new Date(),
                      ).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="p-4 text-body-sm text-on-surface-variant">
                      {new Date(
                        account.updatedAt ?? new Date(),
                      ).toLocaleDateString("ar-SA")}
                    </td>
                    <td className={`p-6 text-body-sm`}>
                      <span
                        className={`px-4 py-1 rounded-full ${account.deleted ? "bg-error text-on-error" : "bg-surface-variant text-on-surface-variant"}`}
                      >
                        {account.deleted ? "نعم" : "لا"}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleOpenChangePasswordModal(account);
                        }}
                      >
                        تغيير كلمة المرور
                      </Button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {editingId === account.id ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleEditAccount}
                              disabled={updateMutation.isPending}
                              isLoading={updateMutation.isPending}
                            >
                              حفظ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setFormErrors({});
                              }}
                            >
                              إلغاء
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditClick(account)}
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id)}
                              disabled={deleteMutation.isPending}
                            >
                              حذف
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              page={page}
              setPage={setPage}
              size={size}
              setSize={setSize}
              totalCount={totalCount}
              isLoading={isLoading}
              totalPages={totalPages}
            />
          </div>
        )}
      </Card>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        title={`تغيير كلمة المرور - ${changePasswordAccountEmail}`}
        onClose={handleCloseChangePasswordModal}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleChangePassword();
          }}
          className="space-y-4"
        >
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (changePasswordErrors.newPassword) {
                setChangePasswordErrors({
                  ...changePasswordErrors,
                  newPassword: "",
                });
              }
            }}
            error={changePasswordErrors.newPassword}
            required
          />

          {changePasswordErrors.submit && (
            <div className="p-3 bg-error/10 border border-error rounded-lg">
              <p className="text-error text-body-sm">
                {changePasswordErrors.submit}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={changePasswordMutation.isPending}
              isLoading={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending
                ? "جاري التحديث..."
                : "تغيير كلمة المرور"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleCloseChangePasswordModal}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
};
