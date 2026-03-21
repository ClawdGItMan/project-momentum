import React from "react";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { CharacterScreen } from "@/src/features/character/CharacterScreen";

export default function CharacterTab() {
  const { currentUser, character } = useMomentumSession();

  return (
    <CharacterScreen
      character={character}
      userName={currentUser.name}
      missionLine={currentUser.missionLine}
    />
  );
}
