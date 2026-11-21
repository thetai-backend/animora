"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Package,
  Receipt,
  FolderHeart,
  Users,
  Sparkles,
  Globe,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { ManagerDashboardTab } from "./ManagerDashboardTab";
import {
  ManagerInventoryTab,
  type BatchItem,
  type InventoryProduct,
  type SlipItem,
  type StockTransactionItem,
} from "./ManagerInventoryTab";
import {
  ManagerInvoicesTab,
  type FlatAuditLog,
  type ManagerInvoice,
} from "./ManagerInvoicesTab";
import {
  ManagerRecordsTab,
  type ManagerCustomer,
  type ManagerMedicalRecord,
  type ManagerPet,
} from "./ManagerRecordsTab";
import { ManagerStaffTab, type StaffMember } from "./ManagerStaffTab";
import {
  ManagerPromotionsTab,
  type ManagerPromotion,
} from "./ManagerPromotionsTab";
import {
  ManagerCmsTab,
  type CmsService,
  type CmsSettings,
  type CmsShopProduct,
} from "./ManagerCmsTab";

type ManagerTabKey =
  | "DASHBOARD"
  | "INVENTORY"
  | "INVOICES"
  | "RECORDS"
  | "STAFF"
  | "PROMOTIONS"
  | "CMS";

export function ManagerPortalClient() {
  const [tab, setTab] = useState<ManagerTabKey>("DASHBOARD");
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Inventory
  const [products, setProducts] = useState<(InventoryProduct & CmsShopProduct)[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<BatchItem[]>([]);
  const [negativeStockProducts, setNegativeStockProducts] = useState<InventoryProduct[]>([]);
  const [internalSlips, setInternalSlips] = useState<SlipItem[]>([]);
  const [disposalSlips, setDisposalSlips] = useState<SlipItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransactionItem[]>([]);

  // Records & Invoices
  const [records, setRecords] = useState<ManagerMedicalRecord[]>([]);
  const [invoices, setInvoices] = useState<ManagerInvoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<FlatAuditLog[]>([]);
  const [customers, setCustomers] = useState<ManagerCustomer[]>([]);
  const [pets, setPets] = useState<ManagerPet[]>([]);

  // Staff, Promotions, CMS
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [promotions, setPromotions] = useState<ManagerPromotion[]>([]);
  const [settings, setSettings] = useState<CmsSettings | null>(null);
  const [services, setServices] = useState<CmsService[]>([]);

  const notify = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5500);
  };

  const loadAll = async () => {
    const safeJson = async (url: string) => {
      const r = await fetch(url);
      return r.ok ? r.json() : {};
    };
    const [invRes, recRes, staffRes, promoRes, settingsRes, srvRes] = await Promise.all([
      safeJson("/api/inventory"),
      safeJson("/api/manager/records"),
      safeJson("/api/manager/staff"),
      safeJson("/api/manager/promotions"),
      safeJson("/api/manager/cms/settings"),
      safeJson("/api/manager/cms/services"),
    ]);

    setProducts(invRes.products || []);
    setExpiringBatches(invRes.expiringBatches || []);
    setNegativeStockProducts(invRes.negativeStockProducts || []);
    setInternalSlips(invRes.internalSlips || []);
    setDisposalSlips(invRes.disposalSlips || []);
    setTransactions(invRes.transactions || []);

    setRecords(recRes.medicalRecords || []);
    setInvoices(recRes.invoices || []);
    setAuditLogs(recRes.auditLogs || []);
    setCustomers(recRes.customers || []);
    setPets(recRes.pets || []);

    setStaff(staffRes.staff || []);
    setPromotions(promoRes.promotions || []);
    setSettings(settingsRes.settings || null);
    setServices(srvRes.services || []);
    setRefreshSignal((n) => n + 1);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const alertCount = expiringBatches.length + negativeStockProducts.length;

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold ${
            toast.type === "err"
              ? "border-rose-300 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {toast.type === "err" ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Thanh 7 Tabs Toàn diện của Quản lý */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-[#0F766E]/15 bg-white p-1.5 shadow-xs">
          {[
            { key: "DASHBOARD", label: "Doanh thu & Chốt ca", icon: BarChart3 },
            {
              key: "INVENTORY",
              label: "Kho thông minh",
              icon: Package,
              badge: alertCount > 0 ? alertCount : undefined,
              badgeRed: true,
            },
            { key: "INVOICES", label: `Hóa đơn & Audit Log (${invoices.length})`, icon: Receipt },
            { key: "RECORDS", label: "Toàn bộ Hồ sơ", icon: FolderHeart },
            { key: "STAFF", label: `Nhân sự (${staff.length})`, icon: Users },
            { key: "PROMOTIONS", label: `Sự kiện & Ưu đãi (${promotions.length})`, icon: Sparkles },
            { key: "CMS", label: "CMS Trang Quảng cáo", icon: Globe },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key as ManagerTabKey)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  tab === item.key
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "text-[#476268] hover:text-[#132A2E]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={loadAll}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F766E]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#0F766E] hover:bg-[#0F766E]/5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới toàn bộ
        </button>
      </div>

      {tab === "DASHBOARD" && <ManagerDashboardTab refreshSignal={refreshSignal} />}

      {tab === "INVENTORY" && (
        <ManagerInventoryTab
          products={products}
          expiringBatches={expiringBatches}
          negativeStockProducts={negativeStockProducts}
          internalSlips={internalSlips}
          disposalSlips={disposalSlips}
          transactions={transactions}
          onReload={loadAll}
          notify={notify}
        />
      )}

      {tab === "INVOICES" && (
        <ManagerInvoicesTab
          invoices={invoices}
          auditLogs={auditLogs}
          onReload={loadAll}
          notify={notify}
        />
      )}

      {tab === "RECORDS" && (
        <ManagerRecordsTab
          customers={customers}
          pets={pets}
          records={records}
          onReload={loadAll}
          notify={notify}
        />
      )}

      {tab === "STAFF" && (
        <ManagerStaffTab staff={staff} onReload={loadAll} notify={notify} />
      )}

      {tab === "PROMOTIONS" && (
        <ManagerPromotionsTab promotions={promotions} onReload={loadAll} notify={notify} />
      )}

      {tab === "CMS" && (
        <ManagerCmsTab
          settings={settings}
          services={services}
          products={products}
          doctors={staff.filter((s) => s.role === "DOCTOR")}
          onReload={loadAll}
          notify={notify}
        />
      )}
    </div>
  );
}
