import { CRM } from "@/components/atomic-crm/root/CRM";

/**
 * Application entry point
 *
 * Customize Atomic CRM by passing props to the CRM component:
 *  - companySectors
 *  - darkTheme
 *  - dealCategories
 *  - dealPipelineStatuses
 *  - dealStages
 *  - lightTheme
 *  - darkModeLogo / lightModeLogo
 *  - noteStatuses
 *  - taskTypes
 *  - title
 * ... as well as all the props accepted by shadcn-admin-kit's <Admin> component.
 *
 * Logos must be an imported asset, an absolute URL, or a data URI — never a
 * route-relative path like "./img/logo.png", which breaks on nested routes.
 */

// Stage values "opportunity", "won" and "lost" are kept from the defaults
// because the dashboard charts filter on them.
const dealStages = [
  { value: "opportunity", label: "Contacto inicial" },
  { value: "appointment", label: "Cita agendada" },
  { value: "proposal-sent", label: "Propuesta enviada" },
  { value: "won", label: "Cerrado" },
  { value: "lost", label: "No interesado" },
];

const dealCategories = [{ value: "optimaxx-plus", label: "OptimaxxPlus" }];

const noteStatuses = [
  { value: "cold", label: "Frío", color: "#7dbde8" },
  { value: "warm", label: "Tibio", color: "#e8cb7d" },
  { value: "hot", label: "Caliente", color: "#e88b7d" },
  { value: "in-contract", label: "Cliente", color: "#a4e87d" },
];

const taskTypes = [
  { value: "none", label: "Ninguno" },
  { value: "call", label: "Llamada" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "meeting", label: "Cita" },
  { value: "presentation", label: "Presentación" },
  { value: "follow-up", label: "Seguimiento" },
  { value: "quarterly-review", label: "Revisión trimestral" },
  { value: "greeting", label: "Felicitación" },
  { value: "email", label: "Correo" },
];

const App = () => (
  <CRM
    title="OptimaxxPlus CRM"
    currency="MXN"
    disableTelemetry
    dealStages={dealStages}
    dealCategories={dealCategories}
    dealPipelineStatuses={["won"]}
    noteStatuses={noteStatuses}
    taskTypes={taskTypes}
  />
);

export default App;
