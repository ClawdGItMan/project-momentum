import React from "react";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { CharacterScreen } from "@/src/features/character/CharacterScreen";

export default function CharacterTab() {
  const { currentUser, character, muscleGroups } = useMomentumSession();

  return (
    <CharacterScreen
      character={character}
      muscleGroups={muscleGroups}
      userName={currentUser.name}
      missionLine={currentUser.missionLine}
    />
  );
}
