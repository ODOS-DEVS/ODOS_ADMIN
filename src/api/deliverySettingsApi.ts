import { requestJson } from "@/api/client";

export type DeliverySettings = {
  freeShippingThreshold: number;
  economyFee: number;
  expressFee: number;
  sameDayFee: number;
  sameDayCutoffHour: number;
  sameDayRegions: string[];
  economyEnabled: boolean;
  expressEnabled: boolean;
  sameDayEnabled: boolean;
  economyTitle: string;
  economyEta: string;
  expressTitle: string;
  expressEta: string;
  sameDayTitle: string;
  sameDayEta: string;
  updatedAt: string;
};

export type DeliverySettingsDraft = {
  freeShippingThreshold: number;
  economyFee: number;
  expressFee: number;
  sameDayFee: number;
  sameDayCutoffHour: number;
  sameDayRegionsText: string;
  economyEnabled: boolean;
  expressEnabled: boolean;
  sameDayEnabled: boolean;
  economyTitle: string;
  economyEta: string;
  expressTitle: string;
  expressEta: string;
  sameDayTitle: string;
  sameDayEta: string;
};

type BackendDeliverySettings = {
  free_shipping_threshold: number;
  economy_fee: number;
  express_fee: number;
  same_day_fee: number;
  same_day_cutoff_hour: number;
  same_day_regions: string[];
  economy_enabled: boolean;
  express_enabled: boolean;
  same_day_enabled: boolean;
  economy_title: string;
  economy_eta: string;
  express_title: string;
  express_eta: string;
  same_day_title: string;
  same_day_eta: string;
  updated_at: string;
};

function mapDeliverySettings(settings: BackendDeliverySettings): DeliverySettings {
  return {
    freeShippingThreshold: settings.free_shipping_threshold,
    economyFee: settings.economy_fee,
    expressFee: settings.express_fee,
    sameDayFee: settings.same_day_fee,
    sameDayCutoffHour: settings.same_day_cutoff_hour,
    sameDayRegions: settings.same_day_regions,
    economyEnabled: settings.economy_enabled,
    expressEnabled: settings.express_enabled,
    sameDayEnabled: settings.same_day_enabled,
    economyTitle: settings.economy_title,
    economyEta: settings.economy_eta,
    expressTitle: settings.express_title,
    expressEta: settings.express_eta,
    sameDayTitle: settings.same_day_title,
    sameDayEta: settings.same_day_eta,
    updatedAt: settings.updated_at,
  };
}

export function buildDeliverySettingsDraft(settings: DeliverySettings): DeliverySettingsDraft {
  return {
    freeShippingThreshold: settings.freeShippingThreshold,
    economyFee: settings.economyFee,
    expressFee: settings.expressFee,
    sameDayFee: settings.sameDayFee,
    sameDayCutoffHour: settings.sameDayCutoffHour,
    sameDayRegionsText: settings.sameDayRegions.join("\n"),
    economyEnabled: settings.economyEnabled,
    expressEnabled: settings.expressEnabled,
    sameDayEnabled: settings.sameDayEnabled,
    economyTitle: settings.economyTitle,
    economyEta: settings.economyEta,
    expressTitle: settings.expressTitle,
    expressEta: settings.expressEta,
    sameDayTitle: settings.sameDayTitle,
    sameDayEta: settings.sameDayEta,
  };
}

function buildPayload(draft: DeliverySettingsDraft) {
  return {
    free_shipping_threshold: draft.freeShippingThreshold,
    economy_fee: draft.economyFee,
    express_fee: draft.expressFee,
    same_day_fee: draft.sameDayFee,
    same_day_cutoff_hour: draft.sameDayCutoffHour,
    same_day_regions_text: draft.sameDayRegionsText,
    economy_enabled: draft.economyEnabled,
    express_enabled: draft.expressEnabled,
    same_day_enabled: draft.sameDayEnabled,
    economy_title: draft.economyTitle.trim(),
    economy_eta: draft.economyEta.trim(),
    express_title: draft.expressTitle.trim(),
    express_eta: draft.expressEta.trim(),
    same_day_title: draft.sameDayTitle.trim(),
    same_day_eta: draft.sameDayEta.trim(),
  };
}

export async function getDeliverySettings(token: string) {
  const settings = await requestJson<BackendDeliverySettings>("/admin/delivery-settings", {
    token,
  });
  return mapDeliverySettings(settings);
}

export async function updateDeliverySettings(token: string, draft: DeliverySettingsDraft) {
  const settings = await requestJson<BackendDeliverySettings>("/admin/delivery-settings", {
    method: "PATCH",
    token,
    body: JSON.stringify(buildPayload(draft)),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return mapDeliverySettings(settings);
}
