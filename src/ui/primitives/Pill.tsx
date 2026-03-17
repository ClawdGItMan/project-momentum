import React from "react";

import { Badge } from "./Badge";

type PillProps = {
  label: string;
};

export function Pill({ label }: PillProps) {
  return <Badge label={label} tone="accent" />;
}

