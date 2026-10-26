import { required, useTranslate } from "ra-core";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { NumberInput } from "@/components/admin/number-input";
import { DateInput } from "@/components/admin/date-input";
import { SelectInput } from "@/components/admin/select-input";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput.tsx";
import { AutocompleteContactInput } from "../contacts/AutocompleteContactInput.tsx";

export const DealInputs = () => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col gap-10 p-1">
      <DealInfoInputs />

      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <DealLinkedToInputs />
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <DealMiscInputs />
      </div>

      <DealPolicyInputs />
    </div>
  );
};

const DealInfoInputs = () => {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <TextInput source="name" validate={required()} helperText={false} />
      <TextInput source="description" multiline rows={3} helperText={false} />
    </div>
  );
};

const DealLinkedToInputs = () => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-4 flex-1">
      <h6 className="text-lg font-semibold">
        {translate("resources.deals.inputs.linked_to")}
      </h6>
      <ReferenceArrayInput source="contact_ids" reference="contacts_summary">
        <AutocompleteContactInput label="resources.deals.fields.contact_ids" />
      </ReferenceArrayInput>

      {/* Optional: OptimaxxPlus plans are sold to individuals */}
      <ReferenceInput source="company_id" reference="companies">
        <AutocompleteCompanyInput
          label="resources.deals.fields.company_id"
          modal
        />
      </ReferenceInput>
    </div>
  );
};

const DealMiscInputs = () => {
  const { dealStages, dealCategories } = useConfigurationContext();
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-4 flex-1">
      <h6 className="text-lg font-semibold">
        {translate("resources.deals.field_categories.misc")}
      </h6>

      <AutocompleteArrayInput
        source="categories"
        choices={dealCategories}
        optionText="label"
        optionValue="value"
        defaultValue={dealCategories[0] ? [dealCategories[0].value] : []}
        helperText={false}
      />
      {/* amount (the plan value) is computed from it by the database */}
      <NumberInput
        source="monthly_contribution"
        defaultValue={0}
        min={0}
        helperText={false}
        validate={required()}
      />
      <DateInput
        validate={required()}
        source="expected_closing_date"
        helperText={false}
        defaultValue={new Date().toISOString().split("T")[0]}
      />
      <SelectInput
        source="stage"
        choices={dealStages}
        optionText="label"
        optionValue="value"
        defaultValue="opportunity"
        helperText={false}
        validate={required()}
      />
    </div>
  );
};

const paymentStatuses = ["current", "late", "to_verify"] as const;

const DealPolicyInputs = () => {
  const translate = useTranslate();
  const paymentStatusChoices = paymentStatuses.map((value) => ({
    id: value,
    name: translate(`resources.deals.payment_statuses.${value}`),
  }));
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">
        {translate("resources.deals.field_categories.policy")}
      </h6>
      <div className="grid gap-4 md:grid-cols-3">
        <DateInput source="plan_start" helperText={false} />
        <NumberInput source="plan_years" min={1} helperText={false} />
        <SelectInput
          source="payment_status"
          choices={paymentStatusChoices}
          helperText={false}
        />
      </div>
      <BooleanInput source="month19_contacted" helperText={false} />
    </div>
  );
};
