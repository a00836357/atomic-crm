import { MessageCircle } from "lucide-react";
import { useRecordContext, useTranslate } from "ra-core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toWhatsAppNumber } from "../alerts/alertsModel";
import type { Contact } from "../types";
import { fillTemplate, firstNameOf } from "./messagesModel";
import { MessagesPage } from "./MessagesPage";
import { useMessageTemplates } from "./useMessageTemplates";

/**
 * Opens WhatsApp with a template filled for the current contact. WhatsApp only
 * prefills the chat: the message is sent when the user presses send.
 */
export const WhatsAppTemplateButton = ({
  compact = false,
}: {
  compact?: boolean;
}) => {
  const contact = useRecordContext<Contact>();
  const translate = useTranslate();
  const { data: templates } = useMessageTemplates();
  if (!contact) return null;

  const number = toWhatsAppNumber(contact.phone_jsonb?.[0]?.number);
  const open = (text?: string) => {
    const query = text ? `?text=${encodeURIComponent(text)}` : "";
    window.open(
      `https://wa.me/${number ?? ""}${query}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={translate("crm.messages.send_whatsapp")}
          >
            <MessageCircle className="size-5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full">
            <MessageCircle className="h-4 w-4" />
            {translate("crm.messages.send_whatsapp")}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-96 w-72 overflow-y-auto"
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {number
            ? translate("crm.messages.choose_template")
            : translate("crm.messages.no_phone_hint")}
        </DropdownMenuLabel>
        {templates?.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onSelect={() =>
              open(
                fillTemplate(template, {
                  firstName: firstNameOf(contact.first_name),
                }),
              )
            }
          >
            {template.title}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => open()}>
          {translate("crm.messages.blank_message")}
        </DropdownMenuItem>
        {templates?.length === 0 ? (
          <DropdownMenuItem asChild>
            <Link to={MessagesPage.path}>
              {translate("crm.messages.import")}
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
