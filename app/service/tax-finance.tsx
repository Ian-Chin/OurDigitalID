import { ServiceCategoryPage } from "@/components/common/ServiceCategoryPage";
import React from "react";
import { useTranslation } from "react-i18next";

export default function TaxFinancePage() {
  const { t } = useTranslation();

  return (
    <ServiceCategoryPage
      title={t("taxFinance")}
      subtitle="Income tax, payments & refunds"
      heroIcon="cash-outline"
      services={[
        { label: "Income Tax Filing", icon: "document-text-outline" },
        { label: "Tax Payment", icon: "card-outline" },
        { label: "Tax Refund Status", icon: "swap-horizontal-outline" },
        { label: "Financial Assistance", icon: "hand-left-outline" },
      ]}
    />
  );
}
