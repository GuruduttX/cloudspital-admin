"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { setDoctorAccess } from "./access-actions";

export function DoctorAccess({ id, isActive }: { id: string; isActive?: boolean }) {
  const [state, action, pending] = useActionState(setDoctorAccess, {});
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => { if (state.success) dialog.current?.close(); }, [state]);
  const fields = <><input type="hidden" name="doctorId" value={id} /><input type="hidden" name="active" value={String(!isActive)} /><input type="hidden" name="previous" value={isActive === undefined ? "unknown" : String(isActive)} /></>;
  return <div className="doctor-access" aria-label="Dashboard access">
    {isActive ? <button type="button" className="button button-revoke access-trigger" onClick={() => dialog.current?.showModal()}>Revoke access</button> : <form action={action}>{fields}<button type="submit" className="button button-dark access-trigger" disabled={pending}>{pending ? "Updating…" : "Grant access"}</button></form>}
    {state.error && !isActive && <p role="alert">{state.error}</p>}
    {state.success && <span className="sr-only" role="status">{state.success}</span>}
    <dialog ref={dialog} className="access-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { if (pending) event.preventDefault(); }}>
      <h2 id={titleId}>Revoke dashboard access?</h2>
      <p id={descriptionId}>This doctor will be signed out and unable to use the dashboard. They will also be removed from active listings and booking availability. You can grant access again later.</p>
      {state.error && <p role="alert">{state.error}</p>}
      <form action={action}>{fields}<div className="access-dialog-actions"><button type="button" className="button button-light" disabled={pending} onClick={() => dialog.current?.close()}>Cancel</button><button type="submit" className="button button-revoke" disabled={pending}>{pending ? "Revoking…" : "Revoke access"}</button></div></form>
    </dialog>
  </div>;
}
