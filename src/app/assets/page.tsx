"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, X, Pencil, UserPlus, Search, Filter, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getAssetHealth } from "@/lib/asset-health";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  assetType: "HARDWARE" | "SOFTWARE";
  category:
    | "LAPTOP"
    | "DESKTOP"
    | "MONITOR"
    | "MOBILE"
    | "TABLET"
    | "PRINTER"
    | "PERIPHERAL"
    | "SOFTWARE_LICENSE"
    | "OTHER";
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  description: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  warrantyExpiry: string | null;
  licenseKey: string | null;
  licenseExpiry: string | null;
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED";
  status: "AVAILABLE" | "ASSIGNED" | "IN_REPAIR" | "RETURN_REQUESTED" | "RETIRED";
}

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
}

const ASSET_TYPES = ["HARDWARE", "SOFTWARE"] as const;

const ASSET_CATEGORIES = [
  "LAPTOP",
  "DESKTOP",
  "MONITOR",
  "MOBILE",
  "TABLET",
  "PRINTER",
  "PERIPHERAL",
  "SOFTWARE_LICENSE",
  "OTHER",
] as const;

const ASSET_CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "DAMAGED"] as const;

const ASSET_STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "IN_REPAIR",
  "RETURN_REQUESTED",
  "RETIRED",
] as const;

interface AssetFormState {
  assetTag: string;
  name: string;
  assetType: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  description: string;
  purchaseDate: string;
  purchasePrice: string;
  warrantyExpiry: string;
  licenseKey: string;
  licenseExpiry: string;
  condition: string;
  status: string;
}

interface AssignFormState {
  employeeId: string;
  assignedAt: string;
  assignedCondition: string;
  notes: string;
}

function getInitialFormState(): AssetFormState {
  return {
    assetTag: "",
    name: "",
    assetType: "",
    category: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    description: "",
    purchaseDate: "",
    purchasePrice: "",
    warrantyExpiry: "",
    licenseKey: "",
    licenseExpiry: "",
    condition: "GOOD",
    status: "AVAILABLE",
  };
}

function toDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  return "";
}

function getFormStateFromAsset(asset: Asset): AssetFormState {
  return {
    assetTag: asset.assetTag,
    name: asset.name,
    assetType: asset.assetType,
    category: asset.category,
    manufacturer: asset.manufacturer ?? "",
    model: asset.model ?? "",
    serialNumber: asset.serialNumber ?? "",
    description: asset.description ?? "",
    purchaseDate: toDateInputValue(asset.purchaseDate),
    purchasePrice:
      asset.purchasePrice !== null && asset.purchasePrice !== undefined
        ? String(asset.purchasePrice)
        : "",
    warrantyExpiry: toDateInputValue(asset.warrantyExpiry),
    licenseKey: asset.licenseKey ?? "",
    licenseExpiry: toDateInputValue(asset.licenseExpiry),
    condition: asset.condition,
    status: asset.status,
  };
}

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getInitialAssignFormState(asset: Asset): AssignFormState {
  return {
    employeeId: "",
    assignedAt: toDateTimeLocalValue(new Date()),
    assignedCondition: asset.condition,
    notes: "",
  };
}

async function fetchAssets(): Promise<Asset[]> {
  const res = await fetch("/api/assets");

  if (!res.ok) {
    throw new Error("Failed to fetch assets");
  }

  return res.json() as Promise<Asset[]>;
}

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch("/api/employees");

  if (!res.ok) {
    throw new Error("Failed to fetch employees");
  }

  return res.json() as Promise<Employee[]>;
}

function getStatusBadgeVariant(
  status: Asset["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "AVAILABLE":
      return "default";
    case "ASSIGNED":
      return "secondary";
    case "IN_REPAIR":
      return "destructive";
    case "RETURN_REQUESTED":
      return "outline";
    case "RETIRED":
      return "outline";
    default:
      return "outline";
  }
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getConditionBadgeVariant(
  condition: Asset["condition"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (condition) {
    case "EXCELLENT":
      return "default";
    case "GOOD":
      return "secondary";
    case "FAIR":
      return "outline";
    case "DAMAGED":
      return "destructive";
    default:
      return "outline";
  }
}

function isExpired(value: string | null): boolean {
  if (!value) return false;

  const expiryDate = new Date(value);
  if (Number.isNaN(expiryDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  return expiryDate < today;
}

function getAssetHealthForList(asset: Asset) {
  return getAssetHealth({
    condition: asset.condition,
    status: asset.status,
    warrantyExpired: isExpired(asset.warrantyExpiry),
    licenseExpired: isExpired(asset.licenseExpiry),
  });
}

function getHealthBadgeClass(level: ReturnType<typeof getAssetHealthForList>["level"]): string {
  switch (level) {
    case "HEALTHY":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "ATTENTION":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "AT_RISK":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400";
  }
}

function getStatusCounts(assets: Asset[]) {
  return {
    total: assets.length,
    available: assets.filter((asset) => asset.status === "AVAILABLE").length,
    assigned: assets.filter((asset) => asset.status === "ASSIGNED").length,
    inRepair: assets.filter((asset) => asset.status === "IN_REPAIR").length,
    retired: assets.filter((asset) => asset.status === "RETIRED").length,
  };
}

function validateAssetForm(formState: AssetFormState): {
  error: string | null;
  purchasePriceValue: number | undefined;
} {
  if (formState.assetTag.trim().length === 0) {
    return { error: "Asset Tag is required.", purchasePriceValue: undefined };
  }

  if (formState.name.trim().length === 0) {
    return { error: "Name is required.", purchasePriceValue: undefined };
  }

  if (!ASSET_TYPES.includes(formState.assetType as (typeof ASSET_TYPES)[number])) {
    return { error: "Asset Type is required.", purchasePriceValue: undefined };
  }

  if (!ASSET_CATEGORIES.includes(formState.category as (typeof ASSET_CATEGORIES)[number])) {
    return { error: "Category is required.", purchasePriceValue: undefined };
  }

  if (!ASSET_CONDITIONS.includes(formState.condition as (typeof ASSET_CONDITIONS)[number])) {
    return { error: "Condition is required.", purchasePriceValue: undefined };
  }

  if (!ASSET_STATUSES.includes(formState.status as (typeof ASSET_STATUSES)[number])) {
    return { error: "Status is required.", purchasePriceValue: undefined };
  }

  let purchasePriceValue: number | undefined;

  if (formState.purchasePrice.trim().length > 0) {
    const parsedPrice = Number(formState.purchasePrice);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return {
        error: "Purchase Price must be a valid non-negative number.",
        purchasePriceValue: undefined,
      };
    }

    purchasePriceValue = parsedPrice;
  }

  return { error: null, purchasePriceValue };
}

function buildAssetPayload(
  formState: AssetFormState,
  purchasePriceValue: number | undefined
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    assetTag: formState.assetTag.trim(),
    name: formState.name.trim(),
    assetType: formState.assetType,
    category: formState.category,
    condition: formState.condition,
    status: formState.status,
  };

  if (formState.manufacturer.trim().length > 0) {
    payload.manufacturer = formState.manufacturer.trim();
  }

  if (formState.model.trim().length > 0) {
    payload.model = formState.model.trim();
  }

  if (formState.serialNumber.trim().length > 0) {
    payload.serialNumber = formState.serialNumber.trim();
  }

  if (formState.description.trim().length > 0) {
    payload.description = formState.description.trim();
  }

  if (formState.purchaseDate.trim().length > 0) {
    payload.purchaseDate = formState.purchaseDate;
  }

  if (purchasePriceValue !== undefined) {
    payload.purchasePrice = purchasePriceValue;
  }

  if (formState.warrantyExpiry.trim().length > 0) {
    payload.warrantyExpiry = formState.warrantyExpiry;
  }

  if (formState.licenseKey.trim().length > 0) {
    payload.licenseKey = formState.licenseKey.trim();
  }

  if (formState.licenseExpiry.trim().length > 0) {
    payload.licenseExpiry = formState.licenseExpiry;
  }

  return payload;
}

function buildEditAssetPayload(
  formState: AssetFormState,
  purchasePriceValue: number | undefined
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    assetTag: formState.assetTag.trim(),
    name: formState.name.trim(),
    assetType: formState.assetType,
    category: formState.category,
    condition: formState.condition,
    status: formState.status,
  };

  payload.manufacturer =
    formState.manufacturer.trim().length > 0 ? formState.manufacturer.trim() : null;

  payload.model = formState.model.trim().length > 0 ? formState.model.trim() : null;

  payload.serialNumber =
    formState.serialNumber.trim().length > 0 ? formState.serialNumber.trim() : null;

  payload.description =
    formState.description.trim().length > 0 ? formState.description.trim() : null;

  payload.purchaseDate =
    formState.purchaseDate.trim().length > 0 ? formState.purchaseDate : null;

  payload.purchasePrice = purchasePriceValue !== undefined ? purchasePriceValue : null;

  payload.warrantyExpiry =
    formState.warrantyExpiry.trim().length > 0 ? formState.warrantyExpiry : null;

  payload.licenseKey =
    formState.licenseKey.trim().length > 0 ? formState.licenseKey.trim() : null;

  payload.licenseExpiry =
    formState.licenseExpiry.trim().length > 0 ? formState.licenseExpiry : null;

  return payload;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<AssetFormState>(getInitialFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editFormState, setEditFormState] = useState<AssetFormState>(getInitialFormState());
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);
  const [assignFormState, setAssignFormState] = useState<AssignFormState>({
    employeeId: "",
    assignedAt: "",
    assignedCondition: "GOOD",
    notes: "",
  });
  const [assignFormError, setAssignFormError] = useState<string | null>(null);
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("ALL");
const [categoryFilter, setCategoryFilter] = useState("ALL");
const [conditionFilter, setConditionFilter] = useState("ALL");
const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAssets();

        if (isMounted) {
          setAssets(data);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load assets:", err);
        setError("Unable to load assets right now. Please try again later.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);
  const filteredAssets = assets.filter((asset) => {
  const search = searchTerm.trim().toLowerCase();

  const matchesSearch =
    search.length === 0 ||
    asset.assetTag.toLowerCase().includes(search) ||
    asset.name.toLowerCase().includes(search) ||
    (asset.serialNumber?.toLowerCase().includes(search) ?? false) ||
    (asset.manufacturer?.toLowerCase().includes(search) ?? false) ||
    (asset.model?.toLowerCase().includes(search) ?? false);

  const matchesStatus =
    statusFilter === "ALL" || asset.status === statusFilter;

  const matchesCategory =
    categoryFilter === "ALL" || asset.category === categoryFilter;

  const matchesCondition =
    conditionFilter === "ALL" || asset.condition === conditionFilter;

  const matchesType =
    typeFilter === "ALL" || asset.assetType === typeFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesCategory &&
    matchesCondition &&
    matchesType
  );
});

  const statusCounts = getStatusCounts(assets);
  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    conditionFilter !== "ALL" ||
    typeFilter !== "ALL";

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setConditionFilter("ALL");
    setTypeFilter("ALL");
  }

  function updateField<K extends keyof AssetFormState>(field: K, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  function updateEditField<K extends keyof AssetFormState>(field: K, value: string) {
    setEditFormState((prev) => ({ ...prev, [field]: value }));
  }

  function updateAssignField<K extends keyof AssignFormState>(field: K, value: string) {
    setAssignFormState((prev) => ({ ...prev, [field]: value }));
  }

  function openDialog() {
    setFormState(getInitialFormState());
    setFormError(null);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    if (isSubmitting) return;
    setIsDialogOpen(false);
  }

  function openEditDialog(asset: Asset) {
    setEditingAssetId(asset.id);
    setEditFormState(getFormStateFromAsset(asset));
    setEditFormError(null);
    setIsEditDialogOpen(true);
  }

  function closeEditDialog() {
    if (isEditSubmitting) return;
    setIsEditDialogOpen(false);
    setEditingAssetId(null);
  }

  async function openAssignDialog(asset: Asset) {
    setAssigningAsset(asset);
    setAssignFormState(getInitialAssignFormState(asset));
    setAssignFormError(null);
    setIsAssignDialogOpen(true);
    setEmployeesError(null);
    setIsEmployeesLoading(true);

    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setEmployeesError("Unable to load employees right now.");
    } finally {
      setIsEmployeesLoading(false);
    }
  }

  function closeAssignDialog() {
    if (isAssignSubmitting) return;
    setIsAssignDialogOpen(false);
    setAssigningAsset(null);
    setAssignFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const { error: validationError, purchasePriceValue } = validateAssetForm(formState);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildAssetPayload(formState, purchasePriceValue);

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message =
          errorBody && typeof errorBody.message === "string"
            ? errorBody.message
            : "Failed to create asset. Please check the form and try again.";
        setFormError(message);
        setIsSubmitting(false);
        return;
      }

      const updatedAssets = await fetchAssets();
      setAssets(updatedAssets);

      setIsSubmitting(false);
      setIsDialogOpen(false);
      setFormState(getInitialFormState());
    } catch (err) {
      console.error("Failed to create asset:", err);
      setFormError("Unable to create asset right now. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditFormError(null);

    if (!editingAssetId) {
      return;
    }

    const { error: validationError, purchasePriceValue } = validateAssetForm(editFormState);

    if (validationError) {
      setEditFormError(validationError);
      return;
    }

    const payload = buildEditAssetPayload(editFormState, purchasePriceValue);

    setIsEditSubmitting(true);

    try {
      const res = await fetch(`/api/assets/${editingAssetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message =
          errorBody && typeof errorBody.message === "string"
            ? errorBody.message
            : "Failed to update asset. Please check the form and try again.";
        setEditFormError(message);
        setIsEditSubmitting(false);
        return;
      }

      const updatedAssets = await fetchAssets();
      setAssets(updatedAssets);

      setIsEditSubmitting(false);
      setIsEditDialogOpen(false);
      setEditingAssetId(null);
      setEditFormState(getInitialFormState());
    } catch (err) {
      console.error("Failed to update asset:", err);
      setEditFormError("Unable to update asset right now. Please try again.");
      setIsEditSubmitting(false);
    }
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAssignFormError(null);

    if (!assigningAsset) {
      return;
    }

    if (assignFormState.employeeId.trim().length === 0) {
      setAssignFormError("Please select an employee.");
      return;
    }

    if (
      assignFormState.assignedAt.trim().length === 0 ||
      Number.isNaN(Date.parse(assignFormState.assignedAt))
    ) {
      setAssignFormError("Please provide a valid Assigned At date/time.");
      return;
    }

    if (
      !ASSET_CONDITIONS.includes(
        assignFormState.assignedCondition as (typeof ASSET_CONDITIONS)[number]
      )
    ) {
      setAssignFormError("Please select a valid Assigned Condition.");
      return;
    }

    const payload: Record<string, unknown> = {
      assetId: assigningAsset.id,
      employeeId: assignFormState.employeeId,
      assignedAt: new Date(assignFormState.assignedAt).toISOString(),
      assignedCondition: assignFormState.assignedCondition,
    };

    if (assignFormState.notes.trim().length > 0) {
      payload.notes = assignFormState.notes.trim();
    }

    setIsAssignSubmitting(true);

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message =
          errorBody && typeof errorBody.message === "string"
            ? errorBody.message
            : "Failed to assign asset. Please try again.";
        setAssignFormError(message);
        setIsAssignSubmitting(false);
        return;
      }

      const updatedAssets = await fetchAssets();
      setAssets(updatedAssets);

      setIsAssignSubmitting(false);
      setIsAssignDialogOpen(false);
      setAssigningAsset(null);
      setAssignFormState({
        employeeId: "",
        assignedAt: "",
        assignedCondition: "GOOD",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to assign asset:", err);
      setAssignFormError("Unable to assign asset right now. Please try again.");
      setIsAssignSubmitting(false);
    }
  }

  return (
    <AppShell title="Assets">
      <div className="flex flex-col gap-6 bg-[#080b12] -m-4 min-h-[calc(100vh-4rem)] p-4 md:-m-6 md:p-6 lg:-m-8 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Assets
            </h1>
            <p className="text-sm text-slate-400">
              View and track all hardware and software assets in your organization.
            </p>
            <p className="text-xs text-slate-500">
              Showing {filteredAssets.length} of {assets.length} assets
            </p>
          </div>
          <Button onClick={openDialog} className="w-full bg-violet-600 text-white shadow-lg shadow-violet-950/30 hover:bg-violet-500 sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading assets...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-slate-200">{error}</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-slate-200">
              No assets found
            </p>
            <p className="text-sm text-slate-400">
              Assets will appear here once they are added.
            </p>
          </div>
        ) : (
  <>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {[
        { label: "Total Assets", value: statusCounts.total },
        { label: "Available", value: statusCounts.available },
        { label: "Assigned", value: statusCounts.assigned },
        { label: "In Repair", value: statusCounts.inRepair },
        { label: "Retired", value: statusCounts.retired },
      ].map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-800/80 bg-[#0d121c] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
          <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{item.value}</p>
        </div>
      ))}
    </div>

    <div className="rounded-2xl border border-slate-800/80 bg-[#0d121c] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-slate-200">Search and filters</p>
            <p className="text-xs text-slate-500">
              {filteredAssets.length} matching {filteredAssets.length === 1 ? "asset" : "assets"}
            </p>
          </div>
        </div>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-2 lg:col-span-1">
          <label htmlFor="asset-search" className="text-sm font-medium text-slate-200">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="asset-search"
              type="text"
              placeholder="Tag, name, serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-200">Status</label>
          <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40">
            <option value="ALL">All Statuses</option>
            {ASSET_STATUSES.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category-filter" className="text-sm font-medium text-slate-200">Category</label>
          <select id="category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40">
            <option value="ALL">All Categories</option>
            {ASSET_CATEGORIES.map((category) => <option key={category} value={category}>{formatLabel(category)}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="condition-filter" className="text-sm font-medium text-slate-200">Condition</label>
          <select id="condition-filter" value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40">
            <option value="ALL">All Conditions</option>
            {ASSET_CONDITIONS.map((condition) => <option key={condition} value={condition}>{formatLabel(condition)}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="type-filter" className="text-sm font-medium text-slate-200">Type</label>
          <select id="type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40">
            <option value="ALL">All Types</option>
            {ASSET_TYPES.map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}
          </select>
        </div>
      </div>
    </div>

    <div className="w-full overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#0d121c] shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
          
            <Table>
              <TableHeader className="bg-slate-900/70">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Asset Tag</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Name</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Type</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Category</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Manufacturer</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Model</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Serial Number</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Condition</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Status</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Health</TableHead>
                  <TableHead className="min-w-[250px] whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-800/70">
                {filteredAssets.length === 0 ? (
                  <TableRow className="border-slate-800 hover:bg-transparent">
  <TableCell
    colSpan={11}
    className="h-32 text-center"
  >
    <div className="flex flex-col items-center justify-center gap-1">
      <p className="text-sm font-medium text-slate-200">
        No matching assets found
      </p>
      <p className="text-sm text-slate-400">
        Try adjusting your search or filters.
      </p>
    </div>
  </TableCell>
</TableRow>
) : (
    filteredAssets.map((asset) => (
                  <TableRow key={asset.id} className="border-slate-800/70 transition-colors hover:bg-violet-500/[0.05]">
                    <TableCell className="whitespace-nowrap text-sm text-slate-300">
                      <Link href={`/assets/${asset.id}`} className="font-medium text-white transition-colors hover:text-violet-400 hover:underline">
                        {asset.assetTag}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      <div className="min-w-[160px]">
                        <Link href={`/assets/${asset.id}`} className="font-medium text-white transition-colors hover:text-violet-400 hover:underline">
                          {asset.name}
                        </Link>
                        {asset.description && (
                          <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">{asset.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400"><Badge variant="outline">{formatLabel(asset.assetType)}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-300">{formatLabel(asset.category)}</TableCell>
                    <TableCell className="text-sm text-slate-400">{asset.manufacturer ?? "—"}</TableCell>
                    <TableCell className="text-sm text-slate-400">{asset.model ?? "—"}</TableCell>
                    <TableCell className="text-sm text-slate-400">{asset.serialNumber ?? "—"}</TableCell>
                    <TableCell className="text-sm text-slate-400"><Badge variant={getConditionBadgeVariant(asset.condition)}>{formatLabel(asset.condition)}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-400">
                      <Badge variant={getStatusBadgeVariant(asset.status)} className="whitespace-nowrap">
                        {formatLabel(asset.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {(() => {
                        const health = getAssetHealthForList(asset);
                        return (
                          <Badge
                            variant="outline"
                            title={health.description}
                            className={`whitespace-nowrap ${getHealthBadgeClass(health.level)}`}
                          >
                            {health.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/assets/${asset.id}`}>
  <Button
    type="button"
    variant="outline"
    size="sm"
  >
    View Details
  </Button>
</Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(asset)}
                        >
                          <Pencil className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        {asset.status === "AVAILABLE" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(asset)}
                          >
                            <UserPlus className="mr-2 h-3 w-3" />
                            Assign
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                        ))
        )}
        </TableBody>
            </Table>
                    </div>
        </>
        )}
      </div>

      {isDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={closeDialog}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-lg border border-slate-700 bg-[#0d121c] p-6 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200">
                Add Asset
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isSubmitting}
                className="text-slate-500 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {formError && (
                <div className="flex items-start gap-2 rounded-2xl border border-slate-800 border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="assetTag" className="text-sm font-medium text-slate-200">
                    Asset Tag
                  </label>
                  <input
                    id="assetTag"
                    type="text"
                    value={formState.assetTag}
                    onChange={(e) => updateField("assetTag", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-200">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formState.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="assetType" className="text-sm font-medium text-slate-200">
                    Asset Type
                  </label>
                  <select
                    id="assetType"
                    value={formState.assetType}
                    onChange={(e) => updateField("assetType", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  >
                    <option value="">Select type</option>
                    {ASSET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="category" className="text-sm font-medium text-slate-200">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formState.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  >
                    <option value="">Select category</option>
                    {ASSET_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="condition" className="text-sm font-medium text-slate-200">
                    Condition
                  </label>
                  <select
                    id="condition"
                    value={formState.condition}
                    onChange={(e) => updateField("condition", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  >
                    {ASSET_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="status" className="text-sm font-medium text-slate-200">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formState.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  >
                    {ASSET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="manufacturer" className="text-sm font-medium text-slate-200">
                    Manufacturer
                  </label>
                  <input
                    id="manufacturer"
                    type="text"
                    value={formState.manufacturer}
                    onChange={(e) => updateField("manufacturer", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="model" className="text-sm font-medium text-slate-200">
                    Model
                  </label>
                  <input
                    id="model"
                    type="text"
                    value={formState.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="serialNumber" className="text-sm font-medium text-slate-200">
                    Serial Number
                  </label>
                  <input
                    id="serialNumber"
                    type="text"
                    value={formState.serialNumber}
                    onChange={(e) => updateField("serialNumber", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="purchasePrice" className="text-sm font-medium text-slate-200">
                    Purchase Price
                  </label>
                  <input
                    id="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.purchasePrice}
                    onChange={(e) => updateField("purchasePrice", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="purchaseDate" className="text-sm font-medium text-slate-200">
                    Purchase Date
                  </label>
                  <input
                    id="purchaseDate"
                    type="date"
                    value={formState.purchaseDate}
                    onChange={(e) => updateField("purchaseDate", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="warrantyExpiry" className="text-sm font-medium text-slate-200">
                    Warranty Expiry
                  </label>
                  <input
                    id="warrantyExpiry"
                    type="date"
                    value={formState.warrantyExpiry}
                    onChange={(e) => updateField("warrantyExpiry", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="licenseKey" className="text-sm font-medium text-slate-200">
                    License Key
                  </label>
                  <input
                    id="licenseKey"
                    type="text"
                    value={formState.licenseKey}
                    onChange={(e) => updateField("licenseKey", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="licenseExpiry" className="text-sm font-medium text-slate-200">
                    License Expiry
                  </label>
                  <input
                    id="licenseExpiry"
                    type="date"
                    value={formState.licenseExpiry}
                    onChange={(e) => updateField("licenseExpiry", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-sm font-medium text-slate-200">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formState.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Asset"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={closeEditDialog}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-lg border border-slate-700 bg-[#0d121c] p-6 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200">
                Edit Asset
              </h2>
              <button
                type="button"
                onClick={closeEditDialog}
                disabled={isEditSubmitting}
                className="text-slate-500 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              {editFormError && (
                <div className="flex items-start gap-2 rounded-2xl border border-slate-800 border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-assetTag" className="text-sm font-medium text-slate-200">
                    Asset Tag
                  </label>
                  <input
                    id="edit-assetTag"
                    type="text"
                    value={editFormState.assetTag}
                    onChange={(e) => updateEditField("assetTag", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-name" className="text-sm font-medium text-slate-200">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editFormState.name}
                    onChange={(e) => updateEditField("name", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-assetType" className="text-sm font-medium text-slate-200">
                    Asset Type
                  </label>
                  <select
                    id="edit-assetType"
                    value={editFormState.assetType}
                    onChange={(e) => updateEditField("assetType", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  >
                    <option value="">Select type</option>
                    {ASSET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-category" className="text-sm font-medium text-slate-200">
                    Category
                  </label>
                  <select
                    id="edit-category"
                    value={editFormState.category}
                    onChange={(e) => updateEditField("category", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  >
                    <option value="">Select category</option>
                    {ASSET_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-condition" className="text-sm font-medium text-slate-200">
                    Condition
                  </label>
                  <select
                    id="edit-condition"
                    value={editFormState.condition}
                    onChange={(e) => updateEditField("condition", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  >
                    {ASSET_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-status" className="text-sm font-medium text-slate-200">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={editFormState.status}
                    onChange={(e) => updateEditField("status", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  >
                    {ASSET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-manufacturer" className="text-sm font-medium text-slate-200">
                    Manufacturer
                  </label>
                  <input
                    id="edit-manufacturer"
                    type="text"
                    value={editFormState.manufacturer}
                    onChange={(e) => updateEditField("manufacturer", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-model" className="text-sm font-medium text-slate-200">
                    Model
                  </label>
                  <input
                    id="edit-model"
                    type="text"
                    value={editFormState.model}
                    onChange={(e) => updateEditField("model", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-serialNumber" className="text-sm font-medium text-slate-200">
                    Serial Number
                  </label>
                  <input
                    id="edit-serialNumber"
                    type="text"
                    value={editFormState.serialNumber}
                    onChange={(e) => updateEditField("serialNumber", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-purchasePrice" className="text-sm font-medium text-slate-200">
                    Purchase Price
                  </label>
                  <input
                    id="edit-purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editFormState.purchasePrice}
                    onChange={(e) => updateEditField("purchasePrice", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-purchaseDate" className="text-sm font-medium text-slate-200">
                    Purchase Date
                  </label>
                  <input
                    id="edit-purchaseDate"
                    type="date"
                    value={editFormState.purchaseDate}
                    onChange={(e) => updateEditField("purchaseDate", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-warrantyExpiry" className="text-sm font-medium text-slate-200">
                    Warranty Expiry
                  </label>
                  <input
                    id="edit-warrantyExpiry"
                    type="date"
                    value={editFormState.warrantyExpiry}
                    onChange={(e) => updateEditField("warrantyExpiry", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-licenseKey" className="text-sm font-medium text-slate-200">
                    License Key
                  </label>
                  <input
                    id="edit-licenseKey"
                    type="text"
                    value={editFormState.licenseKey}
                    onChange={(e) => updateEditField("licenseKey", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-licenseExpiry" className="text-sm font-medium text-slate-200">
                    License Expiry
                  </label>
                  <input
                    id="edit-licenseExpiry"
                    type="date"
                    value={editFormState.licenseExpiry}
                    onChange={(e) => updateEditField("licenseExpiry", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="edit-description" className="text-sm font-medium text-slate-200">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editFormState.description}
                  onChange={(e) => updateEditField("description", e.target.value)}
                  disabled={isEditSubmitting}
                  rows={3}
                  className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditDialog}
                  disabled={isEditSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditSubmitting}>
                  {isEditSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssignDialogOpen && assigningAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={closeAssignDialog}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg border border-slate-700 bg-[#0d121c] p-6 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200">
                Assign Asset
              </h2>
              <button
                type="button"
                onClick={closeAssignDialog}
                disabled={isAssignSubmitting}
                className="text-slate-500 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset Tag</span>
                <span className="font-medium text-slate-200">
                  {assigningAsset.assetTag}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-slate-200">
                  {assigningAsset.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-slate-200">
                  {assigningAsset.category.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Status</span>
                <Badge variant={getStatusBadgeVariant(assigningAsset.status)}>
                  {assigningAsset.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-4">
              {assignFormError && (
                <div className="flex items-start gap-2 rounded-2xl border border-slate-800 border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{assignFormError}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="assign-employee" className="text-sm font-medium text-slate-200">
                  Employee
                </label>
                {isEmployeesLoading ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading employees...
                  </div>
                ) : employeesError ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-800 border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {employeesError}
                  </div>
                ) : (
                  <select
                    id="assign-employee"
                    value={assignFormState.employeeId}
                    onChange={(e) => updateAssignField("employeeId", e.target.value)}
                    disabled={isAssignSubmitting}
                    className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  >
                    <option value="">Select employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employeeCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="assign-assignedAt" className="text-sm font-medium text-slate-200">
                  Assigned At
                </label>
                <input
                  id="assign-assignedAt"
                  type="datetime-local"
                  value={assignFormState.assignedAt}
                  onChange={(e) => updateAssignField("assignedAt", e.target.value)}
                  disabled={isAssignSubmitting}
                  className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="assign-condition" className="text-sm font-medium text-slate-200">
                  Assigned Condition
                </label>
                <select
                  id="assign-condition"
                  value={assignFormState.assignedCondition}
                  onChange={(e) => updateAssignField("assignedCondition", e.target.value)}
                  disabled={isAssignSubmitting}
                  className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                >
                  {ASSET_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="assign-notes" className="text-sm font-medium text-slate-200">
                  Notes
                </label>
                <textarea
                  id="assign-notes"
                  value={assignFormState.notes}
                  onChange={(e) => updateAssignField("notes", e.target.value)}
                  disabled={isAssignSubmitting}
                  rows={3}
                  className="rounded-2xl border border-slate-800 border-slate-700 bg-[#080b12] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAssignDialog}
                  disabled={isAssignSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAssignSubmitting}>
                  {isAssignSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Asset"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}