import { useCallback, useEffect, useState, type ReactNode } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type ConsentStatus = {
  versions: { terms: string; privacy: string; ai: string };
  accepted: { terms: boolean; privacy: boolean; ai: boolean };
};

type AiConsentRequest = {
  version: string;
  resolve: (accepted: boolean) => void;
};

async function postAcceptance(types: string[]) {
  const response = await fetch(`${API_BASE}/api/consents/accept`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ types }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "No se pudo registrar la aceptación.");
}

function LegalDocumentDisclosure({
  title,
  version,
  testId,
  children,
}: {
  title: string;
  version: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <details data-testid={testId} className="rounded-xl border border-border bg-background p-4">
      <summary className="cursor-pointer rounded-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {title} · versión {version}
      </summary>
      <div className="mt-4 max-h-[55vh] overflow-y-auto overscroll-contain pr-2 text-sm leading-6">
        {children}
      </div>
    </details>
  );
}

function TermsContent() {
  return (
    <ol className="list-decimal space-y-4 pl-5 marker:font-semibold">
      <li>
        <h3 className="font-semibold">Objeto y alcance</h3>
        <p>Neurometric Terapias es una plataforma destinada principalmente a profesionales para organizar pacientes, agenda, objetivos, sesiones, registros clínicos, informes y archivos. Estos Términos regulan el acceso y uso de la plataforma.</p>
      </li>
      <li>
        <h3 className="font-semibold">Responsable y contacto</h3>
        <p>La responsable de Neurometric Terapias es Jacqueline Stefani Márquez, con domicilio en Colonia Tirolesa, Córdoba, Argentina. Para consultas podés escribir a neurometricapp@gmail.com.</p>
      </li>
      <li>
        <h3 className="font-semibold">Cuentas y credenciales</h3>
        <p>La cuenta es personal y corresponde a la persona registrada. Mantené la confidencialidad de tus credenciales, usalas de forma segura y avisá si advertís un acceso que no autorizaste. Sos responsable de la actividad realizada desde tu cuenta, salvo que corresponda atribuirla a un acceso no autorizado informado oportunamente.</p>
      </li>
      <li>
        <h3 className="font-semibold">Información de pacientes</h3>
        <p>El profesional decide qué información incorpora a la plataforma y debe contar con las autorizaciones, consentimientos o fundamentos que correspondan para tratarla y utilizar el servicio. La aceptación de estos Términos por el profesional es para su propia cuenta y no constituye consentimiento de ningún paciente ni de sus representantes.</p>
      </li>
      <li>
        <h3 className="font-semibold">Confidencialidad</h3>
        <p>Usá la información clínica únicamente para fines profesionales autorizados. Debés proteger su confidencialidad, limitar el acceso a personas autorizadas y evitar compartirla por canales o con destinatarios que no correspondan.</p>
      </li>
      <li>
        <h3 className="font-semibold">Uso de inteligencia artificial</h3>
        <p>Las funciones de inteligencia artificial son herramientas de asistencia profesional: no reemplazan la evaluación, el diagnóstico, el tratamiento ni el criterio profesional. Sus resultados pueden ser inexactos o incompletos y deben revisarse antes de utilizarlos. Neurometric no presta por sí misma atención terapéutica ni sustituye al profesional.</p>
      </li>
      <li>
        <h3 className="font-semibold">Proveedores externos e IA</h3>
        <p>Algunas funciones opcionales de IA pueden procesar información mediante proveedores tecnológicos externos para realizar la tarea solicitada. El uso de esas funciones requiere aceptar el Aviso de Uso de IA correspondiente. La Política de Privacidad explica qué información puede procesarse y el uso de proveedores.</p>
      </li>
      <li>
        <h3 className="font-semibold">Pruebas, promociones y suscripciones</h3>
        <p>Neurometric puede ofrecer períodos de prueba, promociones o suscripciones. Las condiciones específicas de cada oferta se informarán al presentarla.</p>
      </li>
      <li>
        <h3 className="font-semibold">Precio y contratación</h3>
        <p>Antes de contratar un servicio pago se informarán su precio, moneda, periodicidad y condiciones aplicables.</p>
      </li>
      <li>
        <h3 className="font-semibold">Pagos</h3>
        <p>Los pagos se realizarán mediante los medios informados por Neurometric para el servicio contratado. Los proveedores de pago que intervengan pueden aplicar sus propias condiciones.</p>
      </li>
      <li>
        <h3 className="font-semibold">Baja de suscripción y datos</h3>
        <p>Podés solicitar la baja de una suscripción por los canales informados para ese servicio. La baja comercial de una suscripción y la eliminación de una cuenta o de sus datos son procesos distintos; la baja no implica por sí sola que la información se elimine inmediatamente.</p>
      </li>
      <li>
        <h3 className="font-semibold">Suspensión</h3>
        <p>El acceso puede suspenderse cuando resulte necesario ante un incumplimiento de estos Términos, uso no autorizado, riesgos para la seguridad o falta de pago cuando corresponda. En la medida posible se informará el motivo y los pasos disponibles para resolverlo.</p>
      </li>
      <li>
        <h3 className="font-semibold">Disponibilidad</h3>
        <p>Se procura mantener la plataforma disponible, pero no se garantiza una disponibilidad absolutamente ininterrumpida. Puede haber interrupciones por mantenimiento, incidentes o dependencia de servicios tecnológicos externos.</p>
      </li>
      <li>
        <h3 className="font-semibold">Conservación de documentación</h3>
        <p>Conservá por otros medios las copias de la documentación que debas mantener por razones profesionales o legales. La plataforma no reemplaza tus obligaciones de archivo.</p>
      </li>
      <li>
        <h3 className="font-semibold">Propiedad intelectual e información cargada</h3>
        <p>La plataforma, su software, diseño, marcas y materiales propios pertenecen a sus titulares y no se transfieren por el uso del servicio. Cargar información clínica no convierte esa información en propiedad de Neurometric; su tratamiento se limita a lo necesario para prestar las funciones solicitadas, según la Política de Privacidad.</p>
      </li>
      <li>
        <h3 className="font-semibold">Usos prohibidos</h3>
        <p>No uses la plataforma para fines ilegales, para acceder sin autorización a cuentas o sistemas, vulnerar la confidencialidad de pacientes, interferir con la seguridad o funcionamiento del servicio, suplantar a otra persona ni intentar obtener o alterar información a la que no tenés derecho de acceso.</p>
      </li>
      <li>
        <h3 className="font-semibold">Alcance profesional</h3>
        <p>Neurometric proporciona herramientas tecnológicas de organización y asistencia. No brinda por sí misma atención terapéutica, no establece una relación profesional con los pacientes cargados y no sustituye las decisiones del profesional tratante.</p>
      </li>
      <li>
        <h3 className="font-semibold">Servicios tecnológicos externos</h3>
        <p>El funcionamiento puede depender de proveedores externos de infraestructura, almacenamiento, procesamiento o pagos. La disponibilidad de esos servicios puede afectar temporalmente algunas funciones y su uso puede estar sujeto a condiciones propias de cada proveedor.</p>
      </li>
      <li>
        <h3 className="font-semibold">Actualizaciones y versiones</h3>
        <p>Estos Términos pueden actualizarse. La versión y fecha vigentes se mostrarán al solicitar aceptación; los cambios relevantes pueden requerir una nueva aceptación antes de continuar usando las funciones alcanzadas.</p>
      </li>
      <li>
        <h3 className="font-semibold">Legislación aplicable</h3>
        <p>Estos Términos se interpretan conforme a la legislación de la República Argentina, sin excluir derechos imperativos que pudieran corresponder según el lugar de residencia o contratación de la persona usuaria.</p>
      </li>
      <li>
        <h3 className="font-semibold">Registro de aceptación</h3>
        <p>La aceptación expresa de estos Términos se asocia a la cuenta de la persona usuaria y queda registrada junto con la versión aceptada y la fecha y hora. No representa aceptación ni consentimiento en nombre de pacientes.</p>
      </li>
    </ol>
  );
}

function PrivacyContent() {
  return (
    <ol className="list-decimal space-y-4 pl-5 marker:font-semibold">
      <li>
        <h3 className="font-semibold">Responsable y plataforma</h3>
        <p>Neurometric Terapias es una plataforma destinada principalmente a profesionales para organizar pacientes, agenda, objetivos, sesiones, registros clínicos, informes y archivos. La responsable es Jacqueline Stefani Márquez, con domicilio en Colonia Tirolesa, Córdoba, Argentina. Contacto: neurometricapp@gmail.com.</p>
      </li>
      <li>
        <h3 className="font-semibold">Información que puede tratarse</h3>
        <p>Según el uso de la plataforma, puede tratarse información de usuarios y pacientes, incluyendo datos identificatorios, antecedentes, anamnesis, diagnósticos, evaluaciones, objetivos, evolución, sesiones, informes, citas, pagos, documentos e imágenes.</p>
      </li>
      <li>
        <h3 className="font-semibold">Información sensible</h3>
        <p>La información relativa a la salud es sensible y requiere especial protección. El acceso y uso de esta información debe limitarse a las personas autorizadas y a las finalidades relacionadas con el servicio.</p>
      </li>
      <li>
        <h3 className="font-semibold">Finalidades</h3>
        <p>La información puede utilizarse para el funcionamiento de la cuenta y la plataforma, organización clínica, documentación, agenda, almacenamiento, seguridad, gestión de suscripciones y funciones opcionales de inteligencia artificial solicitadas por el usuario.</p>
      </li>
      <li>
        <h3 className="font-semibold">Publicidad</h3>
        <p>Neurometric no utiliza información clínica de pacientes para publicidad dirigida.</p>
      </li>
      <li>
        <h3 className="font-semibold">Información incorporada por profesionales</h3>
        <p>El profesional decide qué información de sus pacientes incorpora y es responsable de contar con las autorizaciones, consentimientos o fundamentos que correspondan. La aceptación de esta Política por el profesional se refiere a su propia cuenta y no constituye consentimiento del paciente ni de sus representantes.</p>
      </li>
      <li>
        <h3 className="font-semibold">Proveedores tecnológicos</h3>
        <p>Neurometric utiliza proveedores tecnológicos externos para su infraestructura y funcionamiento, incluyendo actualmente Netlify, Render y Supabase/PostgreSQL. Estos proveedores intervienen en las tareas técnicas necesarias para prestar y mantener el servicio.</p>
      </li>
      <li>
        <h3 className="font-semibold">Almacenamiento</h3>
        <p>Los datos principales se almacenan en PostgreSQL. Determinados documentos e imágenes se almacenan en servicios de archivos de Supabase.</p>
      </li>
      <li>
        <h3 className="font-semibold">Funciones opcionales de IA</h3>
        <p>Si solicitás una función opcional de IA, la información necesaria para realizar esa tarea puede enviarse al proveedor tecnológico que la procese. Según la función y lo que se envíe, puede incluir datos clínicos, datos identificables, texto clínico e imágenes, incluidas imágenes manuscritas para transcripción u organización.</p>
      </li>
      <li>
        <h3 className="font-semibold">Aviso de Uso de IA</h3>
        <p>Las funciones de IA requieren la aceptación del Aviso de Uso de IA correspondiente a la versión vigente antes de su primer uso. La aceptación de ese aviso tampoco constituye consentimiento del paciente.</p>
      </li>
      <li>
        <h3 className="font-semibold">Minimización</h3>
        <p>Se recomienda ingresar solo la información necesaria para la tarea y minimizar los datos personales e identificadores que no sean necesarios.</p>
      </li>
      <li>
        <h3 className="font-semibold">Procesamiento internacional</h3>
        <p>Algunos proveedores pueden procesar información mediante infraestructura ubicada fuera de Argentina. Cuando corresponda, se procurará utilizar los mecanismos aplicables para esas transferencias internacionales.</p>
      </li>
      <li>
        <h3 className="font-semibold">Seguridad</h3>
        <p>Se aplican medidas técnicas y organizativas razonables orientadas a proteger la información y limitar su acceso. Ninguna transmisión o almacenamiento de información puede garantizarse como absolutamente seguro.</p>
      </li>
      <li>
        <h3 className="font-semibold">Conservación</h3>
        <p>La información se conserva durante el tiempo necesario para las finalidades informadas y para atender obligaciones o fundamentos legítimos de conservación. La baja de una cuenta no implica necesariamente la eliminación inmediata de toda la información cuando exista una obligación o un fundamento legítimo para conservarla.</p>
      </li>
      <li>
        <h3 className="font-semibold">Derechos y consultas</h3>
        <p>Podés solicitar el ejercicio de los derechos que correspondan sobre tus datos personales, incluyendo acceso, actualización, rectificación y supresión, sujeto a las obligaciones o fundamentos legítimos aplicables. Para realizar una consulta o solicitud, escribí a neurometricapp@gmail.com.</p>
      </li>
      <li>
        <h3 className="font-semibold">Niños y adolescentes</h3>
        <p>Los profesionales pueden incorporar información de niños y adolescentes cuando estén autorizados a tratarla y cumplan las responsabilidades que correspondan. La plataforma no está destinada a que personas menores de edad creen cuentas profesionales.</p>
      </li>
      <li>
        <h3 className="font-semibold">Enlaces externos</h3>
        <p>La plataforma puede incluir enlaces a servicios externos. Al acceder a ellos, se aplican las condiciones y políticas del servicio correspondiente; Neurometric no controla su funcionamiento ni sus prácticas de privacidad.</p>
      </li>
      <li>
        <h3 className="font-semibold">Cambios de esta Política</h3>
        <p>Esta Política puede actualizarse y se identificará mediante su versión. Los cambios relevantes pueden requerir una nueva aceptación antes de continuar usando las funciones alcanzadas.</p>
      </li>
      <li>
        <h3 className="font-semibold">Aceptación asociada a la cuenta</h3>
        <p>La aceptación queda asociada a la cuenta del profesional, con la versión y fecha y hora correspondientes. No equivale a consentimiento ni aceptación en nombre de pacientes.</p>
      </li>
    </ol>
  );
}

function TermsDocument({ version }: { version: string }) {
  return (
    <LegalDocumentDisclosure title="Términos y Condiciones" version={version} testId="document-terms">
      <TermsContent />
    </LegalDocumentDisclosure>
  );
}

function PrivacyDocument({ version }: { version: string }) {
  return (
    <LegalDocumentDisclosure title="Política de Privacidad" version={version} testId="document-privacy">
      <PrivacyContent />
    </LegalDocumentDisclosure>
  );
}

function AiNotice() {
  return (
    <>
      <p className="text-sm leading-6">
        Neurometric utiliza inteligencia artificial como herramienta opcional de asistencia profesional. Puede colaborar en informes, perfiles clínicos, objetivos, orientación y en la transcripción u organización de información manuscrita.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
        <li>Según la función, pueden procesarse edad, diagnósticos, antecedentes, anamnesis, evaluaciones, objetivos, observaciones, sesiones, texto clínico e imágenes manuscritas. Algunas funciones pueden incluir datos identificables.</li>
        <li>Los resultados pueden contener errores u omisiones. La IA no sustituye tu evaluación ni criterio profesional, y no constituye por sí sola un diagnóstico ni una indicación terapéutica. Revisá el resultado antes de utilizarlo.</li>
        <li>Usá solo información cuyo tratamiento estés autorizado a realizar y minimizá identificadores innecesarios. Tu aceptación no constituye consentimiento del paciente.</li>
        <li>Para completar la tarea pueden intervenir proveedores tecnológicos externos y puede haber procesamiento mediante infraestructura fuera de Argentina.</li>
      </ul>
      <details data-testid="ai-privacy-policy" className="rounded-xl border border-border bg-background p-3">
        <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Consultar la Política de Privacidad
        </summary>
        <div className="mt-3 max-h-[45vh] overflow-y-auto overscroll-contain pr-2 text-sm leading-6">
          <PrivacyContent />
        </div>
      </details>
    </>
  );
}

export function LegalConsentLayer({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [statusReady, setStatusReady] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiRequest, setAiRequest] = useState<AiConsentRequest | null>(null);
  const [aiChecked, setAiChecked] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setStatusReady(false);
      return;
    }
    setStatusReady(false);
    try {
      const response = await fetch(`${API_BASE}/api/consents/status`, { credentials: "include" });
      if (!response.ok) throw new Error("No se pudo comprobar el estado.");
      setStatus(await response.json());
    } catch {
      // Consent status outages must not take the existing authentication path down.
      setStatus(null);
    } finally {
      setStatusReady(true);
    }
  }, [user?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const onRequired = (event: Event) => {
      const request = (event as CustomEvent<AiConsentRequest>).detail;
      setAiRequest(request);
      setAiChecked(false);
      setAiError("");
    };
    window.addEventListener("nm:ai-consent-required", onRequired);
    return () => window.removeEventListener("nm:ai-consent-required", onRequired);
  }, []);

  const needsTerms = !!status && !status.accepted.terms;
  const needsPrivacy = !!status && !status.accepted.privacy;
  const coreAcceptancesReady =
    (!needsTerms || termsChecked) && (!needsPrivacy || privacyChecked);

  const acceptCore = async () => {
    if (!status || !coreAcceptancesReady || saving) return;
    const types: string[] = [];
    if (needsTerms) types.push("terms");
    if (needsPrivacy) types.push("privacy");
    if (!types.length) return;
    setSaving(true);
    setError("");
    try {
      await postAcceptance(types);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar la aceptación.");
    } finally {
      setSaving(false);
    }
  };

  const acceptAi = async () => {
    if (!aiChecked || !aiRequest || aiSaving) return;
    setAiSaving(true);
    setAiError("");
    try {
      await postAcceptance(["ai"]);
      aiRequest.resolve(true);
      setAiRequest(null);
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : "No se pudo registrar la aceptación.");
    } finally {
      setAiSaving(false);
    }
  };

  const declineAi = () => {
    aiRequest?.resolve(false);
    setAiRequest(null);
  };

  const needsCore = !!status && (!status.accepted.terms || !status.accepted.privacy);
  if (user && statusReady && needsCore) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-primary">Aceptación requerida</p>
          <h1 className="text-2xl font-bold">Antes de continuar</h1>
          <p>Cuenta autenticada: <strong>{user.name}</strong> · {user.email}</p>
          <p className="text-sm text-muted-foreground">Leé cada documento y marcá su casilla para expresar tu aceptación por separado. La aceptación se registra en tu propia cuenta.</p>
          {status && <>
            {needsTerms && <TermsDocument version={status.versions.terms} />}
            {needsPrivacy && <PrivacyDocument version={status.versions.privacy} />}
          </>}
          <div className="space-y-3">
            {needsTerms && (
              <label className="flex items-start gap-3 text-sm leading-6">
                <Checkbox
                  data-testid="checkbox-accept-terms"
                  checked={termsChecked}
                  onCheckedChange={value => setTermsChecked(value === true)}
                  aria-label="Acepto los Términos y Condiciones"
                />
                <span>Acepto los Términos y Condiciones, versión {status.versions.terms}.</span>
              </label>
            )}
            {needsPrivacy && (
              <label className="flex items-start gap-3 text-sm leading-6">
                <Checkbox
                  data-testid="checkbox-accept-privacy"
                  checked={privacyChecked}
                  onCheckedChange={value => setPrivacyChecked(value === true)}
                  aria-label="Acepto la Política de Privacidad"
                />
                <span>Acepto la Política de Privacidad, versión {status.versions.privacy}.</span>
              </label>
            )}
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button data-testid="button-accept-legal" onClick={() => void acceptCore()} disabled={!coreAcceptancesReady || saving}>{saving ? "Guardando…" : "Aceptar y continuar"}</Button>
            <Button data-testid="button-logout-legal" variant="outline" onClick={() => void logout()}>Cerrar sesión</Button>
          </div>
        </section>
      </main>
    );
  }

  return <>
    {children}
    {aiRequest && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="ai-consent-title" className="w-full max-w-xl space-y-4 rounded-2xl bg-card p-5 shadow-xl sm:p-6">
          <p className="text-sm font-semibold text-primary">Aviso de uso de IA · versión {aiRequest.version}</p>
          <h2 id="ai-consent-title" className="text-xl font-bold">Antes de usar esta función</h2>
          <div className="max-h-[55vh] space-y-4 overflow-y-auto overscroll-contain pr-1">
            <AiNotice />
          </div>
          <label className="flex items-start gap-3 text-sm leading-6">
            <Checkbox data-testid="checkbox-accept-ai" checked={aiChecked} onCheckedChange={value => setAiChecked(value === true)} aria-label="Acepto el aviso de uso de IA" />
            <span>Acepto el Aviso de Uso de IA, versión {aiRequest.version}.</span>
          </label>
          {aiError && <p role="alert" className="text-sm text-destructive">{aiError}</p>}
          <div className="flex justify-end gap-3">
            <Button data-testid="button-decline-ai" variant="outline" onClick={declineAi} disabled={aiSaving}>Cancelar</Button>
            <Button data-testid="button-accept-ai" onClick={() => void acceptAi()} disabled={!aiChecked || aiSaving}>{aiSaving ? "Guardando…" : "Acepto y continuar"}</Button>
          </div>
        </section>
      </div>
    )}
  </>;
}