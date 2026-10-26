import { Copy, Upload } from "lucide-react";
import {
  useDataProvider,
  useNotify,
  useRefresh,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

import { MobileContent } from "../layout/MobileContent";
import MobileHeader from "../layout/MobileHeader";
import {
  fillBlock,
  fillTemplate,
  templatesFromBackup,
  type MessageTemplate,
} from "./messagesModel";
import { useMessageTemplates } from "./useMessageTemplates";

export const MessagesPage = () => {
  const translate = useTranslate();
  const isMobile = useIsMobile();
  const { data: templates, isPending } = useMessageTemplates();

  const content = isPending ? (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  ) : templates?.length ? (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {translate("crm.messages.hint")}
      </p>
      {templates.map((template, index) => (
        <TemplateCard key={template.id} template={template} index={index} />
      ))}
    </div>
  ) : (
    <ImportTemplates />
  );

  if (isMobile) {
    return (
      <>
        <MobileHeader>
          <h1 className="text-xl font-semibold">
            {translate("crm.messages.title")}
          </h1>
        </MobileHeader>
        <MobileContent>{content}</MobileContent>
      </>
    );
  }

  return (
    <div className="mx-auto mt-4 flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        {translate("crm.messages.title")}
      </h1>
      {content}
    </div>
  );
};

MessagesPage.path = "/messages";

const copy = (text: string, notify: ReturnType<typeof useNotify>) =>
  navigator.clipboard.writeText(text).then(() => notify("crm.common.copied"));

const TemplateCard = ({
  template,
  index,
}: {
  template: MessageTemplate;
  index: number;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [update] = useUpdate<MessageTemplate>();
  const [blocks, setBlocks] = useState(template.blocks);

  const save = (next: string[]) => {
    if (next.join("\u0000") === template.blocks.join("\u0000")) return;
    update(
      "message_templates",
      { id: template.id, data: { blocks: next }, previousData: template },
      { onSuccess: () => notify("crm.messages.saved") },
    );
  };

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">
          {index + 1}. {template.title}
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => copy(fillTemplate({ blocks }), notify)}
        >
          <Copy className="h-4 w-4" />
          {translate("crm.messages.copy_all")}
        </Button>
      </div>
      {blocks.map((block, i) => (
        <div key={i} className="flex items-start gap-2">
          <Textarea
            value={block}
            rows={Math.max(2, Math.ceil(block.length / 80))}
            aria-label={translate("crm.messages.block", { number: i + 1 })}
            onChange={(e) =>
              setBlocks(blocks.map((b, j) => (j === i ? e.target.value : b)))
            }
            onBlur={() => save(blocks)}
          />
          <Button
            size="icon"
            variant="ghost"
            aria-label={translate("crm.common.copy")}
            onClick={() => copy(fillBlock(block), notify)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </Card>
  );
};

const ImportTemplates = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const input = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const importFile = async (file: File) => {
    setImporting(true);
    try {
      const templates = templatesFromBackup(JSON.parse(await file.text()));
      if (!templates?.length) {
        notify("crm.messages.import_empty", { type: "warning" });
        return;
      }
      for (const data of templates) {
        await dataProvider.create("message_templates", { data });
      }
      notify("crm.messages.imported", {
        messageArgs: { smart_count: templates.length },
      });
      refresh();
    } catch {
      notify("crm.messages.import_error", { type: "error" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="flex flex-col items-start gap-3 p-6">
      <p className="text-sm text-muted-foreground">
        {translate("crm.messages.empty")}
      </p>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importFile(file);
          e.target.value = "";
        }}
      />
      <Button onClick={() => input.current?.click()} disabled={importing}>
        <Upload className="h-4 w-4" />
        {translate("crm.messages.import")}
      </Button>
    </Card>
  );
};
