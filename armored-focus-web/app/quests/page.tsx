import AuthorizedPage from "../ReusableUI/AuthorizedPage";
import LevelCard from "../ReusableUI/Cards/LevelCard/LevelCard";
import { StandardCard } from "../ReusableUI/Cards/StandardCard/StandardCard";
import "./Quests.css";

export default function Quests() {
  return (
    <AuthorizedPage className="quests-page">
      <StandardCard className="quest-card-color ">Quests</StandardCard>
    </AuthorizedPage>
  );
}
