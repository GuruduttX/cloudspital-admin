"use client";

import { useId, useState, type ReactNode } from "react";

export function RecentRecords({ sections }: { sections: { key: string; title: string; content: ReactNode }[] }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  return <section className="panel records-panel recent-records" aria-label="Recent doctor records">
    <header className="recent-records-header"><div><h2>Recent records</h2><p>The five latest entries in each category</p></div>
      <div className="recent-records-tabs" role="tablist" aria-label="Recent record type">
        {sections.map((section, index) => <button key={section.key} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => {
          let next = index;
          if (event.key === "ArrowRight") next = (index + 1) % sections.length;
          else if (event.key === "ArrowLeft") next = (index + sections.length - 1) % sections.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = sections.length - 1;
          else return;
          event.preventDefault();
          setSelected(next);
          document.getElementById(`${id}-tab-${next}`)?.focus();
        }}>{section.title}</button>)}
      </div>
    </header>
    {sections.map((section, index) => <div key={section.key} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} tabIndex={0}>{section.content}</div>)}
  </section>;
}
