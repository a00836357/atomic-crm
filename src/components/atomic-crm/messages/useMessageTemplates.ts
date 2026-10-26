import { useGetList } from "ra-core";

import type { MessageTemplate } from "./messagesModel";

export const useMessageTemplates = () =>
  useGetList<MessageTemplate>("message_templates", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "position", order: "ASC" },
  });
