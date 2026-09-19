"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, X, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
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

async function fetchAssets(): Promise<Asset[]> {
  const res = await fetch("/api/assets");

  if (!res.ok) {
    throw new Error("Failed to fetch assets");
  }

  return res.json() as Promise<Asset[]>;
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

  function updateField<K extends keyof AssetFormState>(field: K, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  function updateEditField<K extends keyof AssetFormState>(field: K, value: string) {
    setEditFormState((prev) => ({ ...prev, [field]: value }));
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

  return (
    <AppShell title="Assets">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Assets
            </h1>
            <p className="text-sm text-muted-foreground">
              View and track all hardware and software assets in your
              organization.
            </p>
          </div>
          <Button onClick={openDialog} className="w-full sm:w-auto">
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
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">
              No assets found
            </p>
            <p className="text-sm text-muted-foreground">
              Assets will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium text-foreground">
                      {asset.assetTag}
                    </TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.assetType}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{asset.manufacturer ?? "—"}</TableCell>
                    <TableCell>{asset.model ?? "—"}</TableCell>
                    <TableCell>{asset.serialNumber ?? "—"}</TableCell>
                    <TableCell>{asset.condition}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(asset.status)}>
                        {asset.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(asset)}
                      >
                        <Pencil className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {isDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDialog}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-lg border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Add Asset
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {formError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="assetTag" className="text-sm font-medium text-foreground">
                    Asset Tag
                  </label>
                  <input
                    id="assetTag"
                    type="text"
                    value={formState.assetTag}
                    onChange={(e) => updateField("assetTag", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formState.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="assetType" className="text-sm font-medium text-foreground">
                    Asset Type
                  </label>
                  <select
                    id="assetType"
                    value={formState.assetType}
                    onChange={(e) => updateField("assetType", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                  <label htmlFor="category" className="text-sm font-medium text-foreground">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formState.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                  <label htmlFor="condition" className="text-sm font-medium text-foreground">
                    Condition
                  </label>
                  <select
                    id="condition"
                    value={formState.condition}
                    onChange={(e) => updateField("condition", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    {ASSET_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="status" className="text-sm font-medium text-foreground">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formState.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    {ASSET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="manufacturer" className="text-sm font-medium text-foreground">
                    Manufacturer
                  </label>
                  <input
                    id="manufacturer"
                    type="text"
                    value={formState.manufacturer}
                    onChange={(e) => updateField("manufacturer", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="model" className="text-sm font-medium text-foreground">
                    Model
                  </label>
                  <input
                    id="model"
                    type="text"
                    value={formState.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="serialNumber" className="text-sm font-medium text-foreground">
                    Serial Number
                  </label>
                  <input
                    id="serialNumber"
                    type="text"
                    value={formState.serialNumber}
                    onChange={(e) => updateField("serialNumber", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="purchasePrice" className="text-sm font-medium text-foreground">
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
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="purchaseDate" className="text-sm font-medium text-foreground">
                    Purchase Date
                  </label>
                  <input
                    id="purchaseDate"
                    type="date"
                    value={formState.purchaseDate}
                    onChange={(e) => updateField("purchaseDate", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="warrantyExpiry" className="text-sm font-medium text-foreground">
                    Warranty Expiry
                  </label>
                  <input
                    id="warrantyExpiry"
                    type="date"
                    value={formState.warrantyExpiry}
                    onChange={(e) => updateField("warrantyExpiry", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="licenseKey" className="text-sm font-medium text-foreground">
                    License Key
                  </label>
                  <input
                    id="licenseKey"
                    type="text"
                    value={formState.licenseKey}
                    onChange={(e) => updateField("licenseKey", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="licenseExpiry" className="text-sm font-medium text-foreground">
                    License Expiry
                  </label>
                  <input
                    id="licenseExpiry"
                    type="date"
                    value={formState.licenseExpiry}
                    onChange={(e) => updateField("licenseExpiry", e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formState.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeEditDialog}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-lg border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Edit Asset
              </h2>
              <button
                type="button"
                onClick={closeEditDialog}
                disabled={isEditSubmitting}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              {editFormError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-assetTag" className="text-sm font-medium text-foreground">
                    Asset Tag
                  </label>
                  <input
                    id="edit-assetTag"
                    type="text"
                    value={editFormState.assetTag}
                    onChange={(e) => updateEditField("assetTag", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-name" className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editFormState.name}
                    onChange={(e) => updateEditField("name", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-assetType" className="text-sm font-medium text-foreground">
                    Asset Type
                  </label>
                  <select
                    id="edit-assetType"
                    value={editFormState.assetType}
                    onChange={(e) => updateEditField("assetType", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                  <label htmlFor="edit-category" className="text-sm font-medium text-foreground">
                    Category
                  </label>
                  <select
                    id="edit-category"
                    value={editFormState.category}
                    onChange={(e) => updateEditField("category", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                  <label htmlFor="edit-condition" className="text-sm font-medium text-foreground">
                    Condition
                  </label>
                  <select
                    id="edit-condition"
                    value={editFormState.condition}
                    onChange={(e) => updateEditField("condition", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    {ASSET_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-status" className="text-sm font-medium text-foreground">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={editFormState.status}
                    onChange={(e) => updateEditField("status", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    {ASSET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-manufacturer" className="text-sm font-medium text-foreground">
                    Manufacturer
                  </label>
                  <input
                    id="edit-manufacturer"
                    type="text"
                    value={editFormState.manufacturer}
                    onChange={(e) => updateEditField("manufacturer", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-model" className="text-sm font-medium text-foreground">
                    Model
                  </label>
                  <input
                    id="edit-model"
                    type="text"
                    value={editFormState.model}
                    onChange={(e) => updateEditField("model", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-serialNumber" className="text-sm font-medium text-foreground">
                    Serial Number
                  </label>
                  <input
                    id="edit-serialNumber"
                    type="text"
                    value={editFormState.serialNumber}
                    onChange={(e) => updateEditField("serialNumber", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-purchasePrice" className="text-sm font-medium text-foreground">
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
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-purchaseDate" className="text-sm font-medium text-foreground">
                    Purchase Date
                  </label>
                  <input
                    id="edit-purchaseDate"
                    type="date"
                    value={editFormState.purchaseDate}
                    onChange={(e) => updateEditField("purchaseDate", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-warrantyExpiry" className="text-sm font-medium text-foreground">
                    Warranty Expiry
                  </label>
                  <input
                    id="edit-warrantyExpiry"
                    type="date"
                    value={editFormState.warrantyExpiry}
                    onChange={(e) => updateEditField("warrantyExpiry", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-licenseKey" className="text-sm font-medium text-foreground">
                    License Key
                  </label>
                  <input
                    id="edit-licenseKey"
                    type="text"
                    value={editFormState.licenseKey}
                    onChange={(e) => updateEditField("licenseKey", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-licenseExpiry" className="text-sm font-medium text-foreground">
                    License Expiry
                  </label>
                  <input
                    id="edit-licenseExpiry"
                    type="date"
                    value={editFormState.licenseExpiry}
                    onChange={(e) => updateEditField("licenseExpiry", e.target.value)}
                    disabled={isEditSubmitting}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="edit-description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editFormState.description}
                  onChange={(e) => updateEditField("description", e.target.value)}
                  disabled={isEditSubmitting}
                  rows={3}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
    </AppShell>
  );
}