"use client";

import React from "react";

const cx = (...s) => s.filter(Boolean).join(" ");

export default function RepoTabs({ children, defaultValue = "commits" }) {
  const [value, setValue] = React.useState(defaultValue);
  const baseId = React.useId();

  const tabs = [
    { key: "overview", label: "ITEM ONE".replace("ITEM ONE", "Overview".toUpperCase()) },
    { key: "commits",  label: "Commits".toUpperCase() },
    { key: "options",  label: "Options".toUpperCase() },
  ];

  // Horizontal keyboard nav
  const listRef = React.useRef(null);
  const onKeyDown = (e) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();

    const triggers = Array.from(listRef.current?.querySelectorAll("[role='tab']") || []);
    const idx = triggers.findIndex((el) => el.getAttribute("data-value") === value);

    if (e.key === "Home") return (triggers[0]?.focus(), setValue(triggers[0].dataset.value));
    if (e.key === "End")  return (triggers.at(-1)?.focus(), setValue(triggers.at(-1).dataset.value));

    const next = e.key === "ArrowLeft" ? (idx - 1 + triggers.length) % triggers.length
                                       : (idx + 1) % triggers.length;
    triggers[next]?.focus();
    setValue(triggers[next].dataset.value);
  };

  return (
    <div
      className="
        mt-4 rounded-2xl border shadow-sm overflow-hidden
        bg-white dark:bg-slate-950
      "
    >
      {/* Top rail */}
      <div className="px-4 sm:px-6 pt-4">
        <div
          ref={listRef}
          role="tablist"
          aria-orientation="horizontal"
          className="flex gap-8 sm:gap-10 items-end border-b border-slate-200 dark:border-slate-800"
          onKeyDown={onKeyDown}
        >
          {tabs.map((t) => {
            const active = value === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                data-value={t.key}
                id={`${baseId}-tab-${t.key}`}
                aria-controls={`${baseId}-panel-${t.key}`}
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setValue(t.key)}
                className={cx(
                  "relative pb-3 text-[13px] sm:text-sm tracking-wide font-semibold uppercase",
                  "text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white",
                  active && "text-blue-600 dark:text-blue-400"
                )}
              >
                {t.label}
                {/* active underline */}
                <span
                  className={cx(
                    "pointer-events-none absolute left-0 right-0 -bottom-[1px] h-[3px]",
                    active ? "bg-blue-600 dark:bg-blue-400" : "bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Panels */}
      <TabPanel baseId={baseId} value={value} tab="overview">
        <div className="p-4 sm:p-6 text-slate-700 dark:text-slate-300">Item One (Overview)</div>
      </TabPanel>

      <TabPanel baseId={baseId} value={value} tab="commits">
        <div className="p-0 sm:p-0">{children}</div>
      </TabPanel>

      <TabPanel baseId={baseId} value={value} tab="options">
        <div className="p-4 sm:p-6 text-slate-700 dark:text-slate-300">Item Three (Options)</div>
      </TabPanel>
    </div>
  );
}

function TabPanel({ baseId, value, tab, children }) {
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${tab}`}
      aria-labelledby={`${baseId}-tab-${tab}`}
      hidden={value !== tab}
    >
      {value === tab && children}
    </div>
  );
}