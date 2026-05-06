import { ServiceCategoryPage } from "@/components/common/ServiceCategoryPage";
import React from "react";
import { useTranslation } from "react-i18next";

export default function TransportLicensingPage() {
  const { t } = useTranslation();

  return (
    <ServiceCategoryPage
      title={t("transportLicensing")}
      subtitle="Licenses, road tax & vehicle registration"
      heroIcon="car-sport-outline"
      services={[
        { label: "Renew Driving License", icon: "card-outline" },
        { label: "Pay Road Tax", icon: "cash-outline" },
        { label: "Vehicle Registration", icon: "document-text-outline" },
        { label: "Driving Test Application", icon: "clipboard-outline" },
      ]}
    />
  );
}
